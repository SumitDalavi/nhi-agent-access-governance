# Decisions

## ADR-001: Open Policy Agent (OPA) for Authorization
**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
We need to evaluate if an NHI agent has the necessary scopes to access a specific resource (like a Kubernetes namespace or AWS bucket). Hardcoding this into the Node.js API creates a monolithic authorization bottleneck.

**Decision:**  
We chose Open Policy Agent (OPA) using Rego policies.

**Consequences:**  
- ✅ Policies are decoupled from application code.
- ✅ We can test policies independently.
- ⚠️ Slight latency penalty (HTTP call to OPA sidecar), mitigated by deploying OPA on the same node/pod.
