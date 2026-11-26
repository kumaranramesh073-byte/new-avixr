#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       Q-SIMUTRON OCT — Starting Up          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Kill anything already on ports 3100 / 5100 ──────────────────────────────
for PORT in 3100 5100; do
  PID=$(lsof -ti tcp:$PORT 2>/dev/null) || true
  if [ -n "$PID" ]; then
    echo "  Freeing port $PORT (PID $PID)..."
    kill -9 $PID 2>/dev/null || true
  fi
done
sleep 1

# ── Install deps if node_modules missing ────────────────────────────────────
if [ ! -d "$ROOT/backend/node_modules" ]; then
  echo "  Installing backend dependencies..."
  npm install --prefix "$ROOT/backend" --silent
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "  Installing frontend dependencies..."
  npm install --prefix "$ROOT/frontend" --silent
fi

# ── Start backend ────────────────────────────────────────────────────────────
echo "  Starting backend  → http://localhost:3100"
npm run dev --prefix "$ROOT/backend" > /tmp/qsimutron-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready (max 20s)
echo -n "  Waiting for backend..."
for i in $(seq 1 20); do
  if curl -s http://localhost:3100/api/health > /dev/null 2>&1; then
    echo " ready ✓"
    break
  fi
  echo -n "."
  sleep 1
done

# ── Start frontend ───────────────────────────────────────────────────────────
echo "  Starting frontend → http://localhost:5100"
npm run dev --prefix "$ROOT/frontend" > /tmp/qsimutron-frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

echo ""
echo "  ✅  Backend  running  (PID $BACKEND_PID) — http://localhost:3100"
echo "  ✅  Frontend running  (PID $FRONTEND_PID) — http://localhost:5100"
echo ""
echo "  Opening browser..."
open http://localhost:5100 2>/dev/null || true
echo ""
echo "  Logs:"
echo "    Backend  → /tmp/qsimutron-backend.log"
echo "    Frontend → /tmp/qsimutron-frontend.log"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

# ── Keep script alive; kill children on exit ────────────────────────────────
trap "echo ''; echo '  Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
