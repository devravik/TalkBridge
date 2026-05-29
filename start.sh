#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Load .env ────────────────────────────────────────────────────────────────
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# ── Resolve LAN IP ───────────────────────────────────────────────────────────
# Extract IP from FRONTEND_URL if set, otherwise auto-detect
if [ -n "${FRONTEND_URL:-}" ]; then
  LAN_IP=$(echo "$FRONTEND_URL" | sed -E 's|https?://([^:/]+).*|\1|')
else
  LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || echo "localhost")
fi

BACKEND_PORT="${PORT:-8080}"
FRONTEND_PORT=3000

# ── TLS detection ─────────────────────────────────────────────────────────────
USE_TLS=false
if [ -f "${TLS_CERT:-}" ] && [ -f "${TLS_KEY:-}" ]; then
  USE_TLS=true
  SCHEME="https"
  WS_SCHEME="wss"
else
  SCHEME="http"
  WS_SCHEME="ws"
fi

BACKEND_URL="${SCHEME}://${LAN_IP}:${BACKEND_PORT}"
FRONTEND_URL_DISPLAY="${SCHEME}://${LAN_IP}:${FRONTEND_PORT}"

# ── Cleanup ───────────────────────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Stopping servers..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID"  2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

# ── Backend ───────────────────────────────────────────────────────────────────
echo "Starting backend..."
(cd backend && go run ./cmd/server/...) &
BACKEND_PID=$!

# Wait for backend to be ready (max 15s)
for i in $(seq 1 15); do
  if curl -sk "${BACKEND_URL}/health" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "Starting frontend..."

NEXT_ARGS="-H 0.0.0.0 -p ${FRONTEND_PORT}"

if [ "$USE_TLS" = true ]; then
  NEXT_ARGS="$NEXT_ARGS --experimental-https --experimental-https-key ${TLS_KEY} --experimental-https-cert ${TLS_CERT}"
  NEXT_PUBLIC_API_URL="${SCHEME}://${LAN_IP}:${BACKEND_PORT}"
  NEXT_PUBLIC_WS_URL="${WS_SCHEME}://${LAN_IP}:${BACKEND_PORT}"
else
  NEXT_PUBLIC_API_URL="http://${LAN_IP}:${BACKEND_PORT}"
  NEXT_PUBLIC_WS_URL="ws://${LAN_IP}:${BACKEND_PORT}"
fi

export NEXT_PUBLIC_API_URL NEXT_PUBLIC_WS_URL

# shellcheck disable=SC2086
npm --prefix ./frontend run dev -- $NEXT_ARGS > /tmp/talkbridge-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready (max 20s)
for i in $(seq 1 20); do
  if curl -sk "${FRONTEND_URL_DISPLAY}" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# ── Ready banner ──────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TalkBridge is running"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Frontend  →  ${FRONTEND_URL_DISPLAY}"
echo "  Backend   →  ${BACKEND_URL}"
echo ""
if [ "$USE_TLS" = true ]; then
echo "  Other devices (same WiFi):"
echo "  → Open ${FRONTEND_URL_DISPLAY}"
echo "  → Accept the self-signed cert warning once"
echo "  → Allow camera & microphone when prompted"
echo ""
fi
echo "  Press Ctrl+C to stop"
echo ""

# ── Keep alive ────────────────────────────────────────────────────────────────
wait
