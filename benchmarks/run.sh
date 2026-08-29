#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "[benchmark] Starting NHI Access Governance benchmark..."
echo "[benchmark] Ensuring results dir exists..."
mkdir -p "$REPO_ROOT/benchmarks/results"

if ! command -v python3 &>/dev/null; then
  echo "[benchmark] ERROR: python3 is required"
  exit 1
fi

cd "$REPO_ROOT"
python3 benchmarks/benchmark.py

echo "[benchmark] Done. Results in benchmarks/results/policy_eval_latency.json"
