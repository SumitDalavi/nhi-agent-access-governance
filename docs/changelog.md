# Changelog

## [2026-08-29] — Phase 2 Evidence
### Added
- Added `docker-compose.test.yml` to start PostgreSQL specifically for testing.
- Standardized documentation (`runbook.md`, `decisions.md`, `ARCHITECTURE.md`).
- Added maturity badge and mock boundaries to `README.md`.

### Fixed
- Added `DEMO_MODE=stub` logic to `registry-api/src/routes/authz.ts` to mock OPA calls during Jest testing, preventing connection timeout failures in CI.
- Added `--forceExit` to the `jest` test script in `package.json` to prevent tests from hanging indefinitely after execution due to unclosed database pools.
