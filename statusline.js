#!/usr/bin/env node
'use strict';

const fs = require('fs');

let raw = '';
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    process.stdout.write('[statusline: unparsable input]');
    return;
  }
  process.stdout.write(buildStatusLine(data));
});

function buildStatusLine(data) {
  const segments = [
    dirSegment(data),
    blurbSegment(data),
    usageSegment(data),
    modelSegment(data),
    contextSegment(data),
  ].filter(Boolean);

  return segments.join(' | ');
}

// -- current dir --------------------------------------------------------

function dirSegment(data) {
  const ws = data.workspace || {};
  const dir = ws.current_dir || ws.project_dir || data.cwd;
  if (!dir) return null;
  const base = dir.split(/[\\/]/).filter(Boolean).pop() || dir;
  return `./${base}`;
}

// -- model + effort -------------------------------------------------------

function modelSegment(data) {
  const name = (data.model && (data.model.display_name || data.model.id)) || 'model?';
  let suffix = '';
  if (data.effort && data.effort.level) {
    suffix = ` (${data.effort.level})`;
  } else if (data.thinking && data.thinking.enabled) {
    suffix = ' (thinking)';
  }
  return `${name}${suffix}`;
}

// -- context usage ----------------------------------------------------------

function contextSegment(data) {
  const cw = data.context_window;
  if (!cw || typeof cw.used_percentage !== 'number') return null;
  const pct = Math.round(cw.used_percentage);
  const usedTok = typeof cw.total_input_tokens === 'number' ? cw.total_input_tokens : null;
  const totalTok = typeof cw.context_window_size === 'number' ? cw.context_window_size : null;
  if (usedTok != null && totalTok != null) {
    return `${fmtTok(usedTok)}/${fmtTok(totalTok)} (${pct}%)`;
  }
  return `${pct}%`;
}

function fmtTok(n) {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

// -- 5h / 7d usage windows ----------------------------------------------------

function usageSegment(data) {
  const rl = data.rate_limits;
  if (!rl) return null;
  const parts = [
    fmtUsage(rl.five_hour, 'current'),
    fmtUsage(rl.seven_day, 'weekly'),
  ].filter(Boolean);
  return parts.length ? `usage: ${parts.join(', ')}` : null;
}

function fmtUsage(window, label) {
  if (!window || typeof window.used_percentage !== 'number') return null;
  const pct = Math.round(window.used_percentage);
  const reset = typeof window.resets_at === 'number' ? formatResetAt(window.resets_at) : null;
  return reset ? `${pct}% ${label} (${reset})` : `${pct}% ${label}`;
}

function formatResetAt(epochSeconds) {
  const ms = epochSeconds > 1e12 ? epochSeconds : epochSeconds * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const sameDay = d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
  const time = formatClock(d);
  if (sameDay) return time;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  return `${weekday} ${time}`;
}

function formatClock(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')}${ampm}`;
}

// -- best-effort session description (official data only) --------------------

function blurbSegment(data) {
  if (data.transcript_path) {
    const line = readBlurbFromTranscript(data.transcript_path);
    if (line) return `"${line}"`;
  }
  if (data.output_style && data.output_style.name && data.output_style.name !== 'default') {
    return `[${data.output_style.name}]`;
  }
  return null;
}

// Reads only the tail of the transcript (bounded cost regardless of session length).
function readTail(path, maxBytes) {
  const stat = fs.statSync(path);
  const start = Math.max(0, stat.size - maxBytes);
  const fd = fs.openSync(path, 'r');
  try {
    const buf = Buffer.alloc(stat.size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    return buf.toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function readBlurbFromTranscript(transcriptPath) {
  let lines;
  try {
    const tail = readTail(transcriptPath, 200_000);
    // drop the first line: it may be a partial line cut mid-record by the byte offset
    lines = tail.split('\n').slice(1).filter(Boolean);
  } catch {
    return null;
  }
  return findTodoBlurb(lines) || findLastAssistantText(lines);
}

// Best-effort: if this session used a todo/task-tracking tool, its in-progress
// item is a much better "what's happening" label than raw assistant prose.
// Defensive about the exact tool/field names since they aren't confirmed for
// this harness — silently falls through to the text-based blurb if the shape
// doesn't match what's expected.
function findTodoBlurb(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    const entry = safeParse(lines[i]);
    const msg = entry && entry.message;
    if (!msg || msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;
    for (const block of msg.content) {
      if (!block || block.type !== 'tool_use') continue;
      if (typeof block.name !== 'string' || !/todo|task/i.test(block.name)) continue;
      const todos = block.input && Array.isArray(block.input.todos) ? block.input.todos : null;
      if (!todos) continue;
      const item = todos.find((t) => t && t.status === 'in_progress')
        || todos.find((t) => t && t.status === 'pending');
      const label = item && (item.activeForm || item.content);
      if (label) return cleanText(label, 40);
    }
  }
  return null;
}

function findLastAssistantText(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    const entry = safeParse(lines[i]);
    const msg = entry && entry.message;
    if (!msg || msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;
    const textBlock = msg.content.find((b) => b && b.type === 'text' && b.text);
    if (textBlock) {
      const cleaned = cleanText(textBlock.text, 50);
      if (cleaned) return cleaned;
    }
  }
  return null;
}

function safeParse(line) {
  try { return JSON.parse(line); } catch { return null; }
}

function cleanText(raw, maxLen) {
  let text = raw.replace(/`/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const firstSentence = text.match(/^[^.!?\n]{5,}[.!?]/);
  if (firstSentence) text = firstSentence[0];
  if (text.length > maxLen) text = text.slice(0, maxLen - 3).trim() + '...';
  return text;
}
