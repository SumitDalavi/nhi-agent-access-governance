# Runbook — nhi-agent-access-governance
> Last updated: 2026-08-29

## Prerequisites
| Tool | Required Version | How to check |
|---|---|---|
| Node.js | >= 18 | `node -v` |
| Docker & Compose | Latest | `docker-compose version` |

## Quick Start
```bash
# Start all services
docker-compose up -d --build

# Run demo script
./scripts/demo.sh
```

## Run Tests
```bash
# Start test database (Phase 2 enhancement)
docker-compose -f docker-compose.test.yml up -d

# Wait for postgres to be ready
sleep 5

# Run tests
cd registry-api && npm test
```

Expected output:
```
PASS  test/policy.test.js
```

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| PORT | `3001` | HTTP port |
| DATABASE_URL | `postgres://...` | Connection to Postgres |
| OPA_URL | `http://localhost:8181` | Connection to OPA |

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| Connection Refused to DB | Postgres not ready | Wait a few seconds for Postgres to init |


---

## Release Runbook

### Release Trigger
Tag push matching `v*.*.*` (e.g., `v0.1.0`).

### Automated Pipeline Stages
1. **Quality & Validation Gate:** Validates policy syntax, manifest schemas, and configuration integrity.
2. **Distribution Packaging:** Bundles clean production manifests into `nhi-agent-access-governance-<tag>.tar.gz` and calculates SHA256 checksums.
3. **Syft Source SBOM:** Generates `sbom.spdx.json` adhering to SPDX 2.3 standard.
4. **GitHub Release:** Publishes release assets and release notes.

### Verification
```bash
gh release view v0.1.0 --repo SumitDalavi/nhi-agent-access-governance
gh release download v0.1.0 --repo SumitDalavi/nhi-agent-access-governance --pattern "checksums.txt"
```

### Failure Modes & Remediation
- **Linter / Test Failure:** Inspect policy syntax, configurations, or module arguments locally before tagging.
- **Checksum Mismatch:** Ensure file was completely downloaded without network truncation.

## Operations & Diagnostics Guide (v0.2.0)

### Mode Verification & Diagnostics
Inspect the active execution mode and backing provider status via the health endpoint:
```bash
# Check runtime mode and adapter status
curl -s http://localhost:8080/health | jq .
# Expected output when running without keys:
# {"status": "ok", "mode": {"database": "mock", "ai": "mock", "cache": "mock"}}
```

### Running in Mock Mode (Tier 1)
Start the service with zero external dependencies:
```bash
cp .env.example .env
# Start service without modifying .env
npm start || python main.py || go run .
```

### Running with Live Credentials (Tier 2 / 3)
Populate target credentials in `.env` and restart:
```bash
# Verify live upgrade via health check
curl -s http://localhost:8080/health | jq .mode
```

### Pulling Pre-Built OCI Image
```bash
docker pull ghcr.io/sumitdalavi/nhi-agent-access-governance:v0.2.0
docker run -d -p 8080:8080 --env-file .env ghcr.io/sumitdalavi/nhi-agent-access-governance:v0.2.0
```
