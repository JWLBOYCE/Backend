#!/usr/bin/env bash
set -euo pipefail

# Kill any running backend instance and rebuild.
# Usage: from AAB-Backend directory: ./scripts/rebuild.sh

PORT="${PORT:-8080}"
echo "Rebuilding backend (killing processes on port ${PORT})..."

# Kill processes bound to the backend port if lsof is available
if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:${PORT} || true)"
  if [[ -n "${PIDS}" ]]; then
    echo "Found PIDs on port ${PORT}: ${PIDS}. Attempting graceful kill..."
    kill ${PIDS} || true
    sleep 0.5
    # Force kill if still present
    PIDS2="$(lsof -ti tcp:${PORT} || true)"
    if [[ -n "${PIDS2}" ]]; then
      echo "Force killing remaining PIDs: ${PIDS2}"
      kill -9 ${PIDS2} || true
    fi
  fi
else
  echo "lsof not found; skipping port-based kill."
fi

# Best-effort kill common dev/start processes
pkill -f "tsx.*src/server.ts" 2>/dev/null || true
pkill -f "node .*dist/server.js" 2>/dev/null || true

echo "Building TypeScript..."
npm run build

echo "Backend rebuild complete. Start with 'npm run start' or 'npm run dev'."

