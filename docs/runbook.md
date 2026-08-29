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
