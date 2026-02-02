#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 \"<query>\" \"<max_tokens>\" \"<role>\" \"<analysis_mode>\" \"<direct_mode>\""
  exit 1
fi

QUERY="$1"
MAX_TOKENS="${2:-65536}"
ROLE="${3:-}"
ANALYSIS_MODE="${4:-true}"
DIRECT_MODE="${5:-false}"

# Temp file to capture the full streamed output while still showing it live
TMPFILE="$(mktemp)"
trap 'rm -f "$TMPFILE"' EXIT

# Build the HTTP command with optional parameters
# Using Mastra REST API endpoint
HTTP_ARGS=(
  http://localhost:4111/api/agents/nibrs-crime-agent/stream
  query="$QUERY"
  max_tokens:="$MAX_TOKENS"
  analysis_mode:="$ANALYSIS_MODE"
  direct_mode:="$DIRECT_MODE"
)

# Only add role if it's not empty
if [ -n "$ROLE" ]; then
  HTTP_ARGS+=(role="$ROLE")
fi

# Stream to stdout AND save to file
http "${HTTP_ARGS[@]}" | tee "$TMPFILE"

# After the stream ends, extract the final_response JSON and print just the message
FINAL_MSG=$(
  awk -v RS= -v ORS="\n\n" '/"type": *"final_response"/ {print}' "$TMPFILE" \
  | sed 's/^data: //g' \
  | jq -r '.data.response // empty' 2>/dev/null || true
)

if [ -n "$FINAL_MSG" ]; then
  printf "\n\033[1mFinal:\033[0m %s\n" "$FINAL_MSG"
else
  printf "\n\033[1mFinal:\033[0m (no final_response found)\n"
fi
