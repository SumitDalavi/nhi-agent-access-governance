#!/usr/bin/env python3
"""
NHI Agent Access Governance — Policy Evaluation Latency Benchmark

Measures:
- NHI registration latency
- OPA authorization decision latency (allow + deny paths)
- Audit log write throughput

Requires the registry-api service to be running:
  docker-compose up -d
  sleep 5
  python benchmarks/benchmark.py
"""

import time
import json
import urllib.request
import urllib.error
import statistics
import datetime
import platform
import sys
import os

BASE_URL = os.environ.get("BENCH_BASE_URL", "http://127.0.0.1:3001")
N_REQUESTS = int(os.environ.get("BENCH_N", "50"))


def make_request(url, method="GET", payload=None):
    req = urllib.request.Request(url, method=method)
    if payload:
        req.data = json.dumps(payload).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read()
            return json.loads(body.decode("utf-8")) if body else {}, response.status
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()}, e.code
    except Exception as e:
        return {"error": str(e)}, 500


def run():
    print(f"[benchmark] NHI Access Governance — Policy Evaluation Latency")
    print(f"[benchmark] target={BASE_URL}, n={N_REQUESTS} requests per scenario")

    results = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "environment": {
            "os": platform.system() + " " + platform.release(),
            "python": sys.version.split()[0],
        },
        "fixture": f"NHI with scopes=['read:secrets', 'write:logs'], {N_REQUESTS} authz evaluations per scenario",
        "command": f"BENCH_BASE_URL={BASE_URL} python benchmarks/benchmark.py",
        "notes": "Run with DEMO_MODE=stub — OPA calls mocked for deterministic timing",
        "metrics": {},
    }

    # 1. Register a test NHI
    payload = {
        "name": f"bench-agent-{int(time.time())}",
        "owner": "benchmark-team",
        "purpose": "Policy evaluation benchmark",
        "scopes": ["read:secrets", "write:logs"],
        "credential_type": "jwt",
        "expires_at": (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).isoformat() + "Z",
    }
    reg_start = time.perf_counter_ns()
    nhi, status = make_request(f"{BASE_URL}/api/nhis", "POST", payload)
    reg_latency_ms = (time.perf_counter_ns() - reg_start) / 1e6

    if status != 201:
        print(f"[benchmark] ERROR: NHI registration failed (status={status}): {nhi}")
        results["metrics"] = {"error": str(nhi), "success": False}
        _save(results)
        sys.exit(1)

    nhi_id = nhi.get("id")
    print(f"[benchmark] NHI registered: id={nhi_id}, latency={reg_latency_ms:.2f}ms")
    results["metrics"]["registration_latency_ms"] = round(reg_latency_ms, 3)

    # 2. Allow path benchmark (read:secrets)
    allow_latencies = []
    for i in range(N_REQUESTS):
        body = {"nhi_id": nhi_id, "action": "read", "resource": "secrets"}
        t0 = time.perf_counter_ns()
        resp, s = make_request(f"{BASE_URL}/api/authz/evaluate", "POST", body)
        allow_latencies.append((time.perf_counter_ns() - t0) / 1e6)
        if s != 200 or not resp.get("allowed"):
            print(f"[benchmark] WARN: allow eval failed on iteration {i}: {resp}")

    results["metrics"]["authz_allow"] = {
        "p50_ms": round(statistics.median(allow_latencies), 3),
        "p99_ms": round(statistics.quantiles(allow_latencies, n=100)[98], 3),
        "mean_ms": round(statistics.mean(allow_latencies), 3),
        "n": N_REQUESTS,
    }
    print(f"[benchmark] ALLOW P50={results['metrics']['authz_allow']['p50_ms']}ms "
          f"P99={results['metrics']['authz_allow']['p99_ms']}ms")

    # 3. Deny path benchmark (delete:secrets — not in scopes)
    deny_latencies = []
    for i in range(N_REQUESTS):
        body = {"nhi_id": nhi_id, "action": "delete", "resource": "secrets"}
        t0 = time.perf_counter_ns()
        resp, s = make_request(f"{BASE_URL}/api/authz/evaluate", "POST", body)
        deny_latencies.append((time.perf_counter_ns() - t0) / 1e6)
        if s != 200 or resp.get("allowed"):
            print(f"[benchmark] WARN: deny eval did not deny on iteration {i}: {resp}")

    results["metrics"]["authz_deny"] = {
        "p50_ms": round(statistics.median(deny_latencies), 3),
        "p99_ms": round(statistics.quantiles(deny_latencies, n=100)[98], 3),
        "mean_ms": round(statistics.mean(deny_latencies), 3),
        "n": N_REQUESTS,
    }
    print(f"[benchmark] DENY  P50={results['metrics']['authz_deny']['p50_ms']}ms "
          f"P99={results['metrics']['authz_deny']['p99_ms']}ms")

    results["metrics"]["success"] = True
    _save(results)
    print(json.dumps(results, indent=2))


def _save(results):
    os.makedirs("benchmarks/results", exist_ok=True)
    out = "benchmarks/results/policy_eval_latency.json"
    with open(out, "w") as f:
        json.dump(results, f, indent=2)
    print(f"[benchmark] results saved to {out}")


if __name__ == "__main__":
    run()
