#!/bin/sh
# Claude Code status line
# Format: cwd | 5h: X% resets at H:MM PM | 7d: X% resets at H:MM PM | model | effort
input=$(cat)

# --- CWD: last 3 path components, ~ for home ---
raw_cwd=$(echo "$input" | jq -r '.cwd')
short_cwd=$(echo "$raw_cwd" | sed "s|^${HOME}|~|")
num_slashes=$(echo "$short_cwd" | tr -cd '/' | wc -c | tr -d ' ')
if [ "$num_slashes" -gt 2 ]; then
  short_cwd=$(echo "$short_cwd" | awk -F'/' '{print $(NF-2) "/" $(NF-1) "/" $NF}')
fi

# --- Rate limits ---
five_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
five_reset=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
week_pct=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
week_reset=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')

# --- Model and effort ---
model=$(echo "$input" | jq -r '.model.display_name // empty')
effort=$(echo "$input" | jq -r '.effort.level // empty')

# --- Format a Unix timestamp as clock time of reset ---
reset_at() {
  ts="$1"
  include_date="$2"
  [ -z "$ts" ] && return
  now=$(date +%s)
  diff=$((ts - now))
  if [ "$diff" -le 0 ]; then
    echo "now"
  elif [ "$include_date" = "1" ]; then
    date -r "$ts" +"%a %-I:%M %p"
  else
    date -r "$ts" +"%-I:%M %p"
  fi
}

# --- Assemble the status line ---
line="$short_cwd"

if [ -n "$five_pct" ]; then
  five=$(printf "5h: %.0f%%" "$five_pct")
  r=$(reset_at "$five_reset")
  [ -n "$r" ] && five="$five resets at $r"
  line="$line | $five"
fi

if [ -n "$week_pct" ]; then
  week=$(printf "7d: %.0f%%" "$week_pct")
  r=$(reset_at "$week_reset" 1)
  [ -n "$r" ] && week="$week resets at $r"
  line="$line | $week"
fi

[ -n "$model" ] && line="$line | $model"
[ -n "$effort" ] && line="$line | $effort"

printf "%s" "$line"
