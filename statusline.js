#!/usr/bin/env node
'use strict';

const os = require('os');

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

  const normalized = dir.replace(/\\/g, '/');
  const home = os.homedir().replace(/\\/g, '/');

  let tildePath = null;
  if (normalized === home) {
    tildePath = '~';
  } else if (normalized.startsWith(home + '/')) {
    tildePath = '~' + normalized.slice(home.length);
  }

  // pick whichever anchor (home or root) renders shorter; ties favor tilde
  if (tildePath && tildePath.length <= normalized.length) return tildePath;
  return normalized;
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

