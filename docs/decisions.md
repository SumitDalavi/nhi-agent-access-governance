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

## ADR-002: Mocking OPA in CI Tests
**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
During GitHub Actions CI execution, the Jest integration tests make HTTP calls to OPA. However, setting up the entire OPA sidecar and policies within the CI runner strictly for testing the registry-api adds unnecessary complexity and points of failure.

**Decision:**  
We will introduce a `DEMO_MODE=stub` environment variable. When active during tests, the API will bypass the HTTP call to OPA and return a mocked successful authorization response.

**Consequences:**  
- ✅ Positive outcome: CI tests run deterministically without requiring a complex sidecar deployment.
- ⚠️ Trade-off: The integration tests do not fully validate the Rego policies end-to-end, deferring that validation to isolated OPA unit tests.

## ADR-003: Declarative Multi-Cluster GitOps Packaging with ArgoCD and Kustomize
- **Date:** 2026-10-27
- **Status:** Accepted
- **Context:** Deploying this service across multi-cluster environments (`dev`, `staging`, `prod`) requires a standardized cloud-native packaging format that separates environment-agnostic base specifications from environment-specific resource allocations, replica counts, and security policies without modifying source code or inducing configuration drift.
- **Decision:** Adopt Kustomize overlays under `deploy/k8s/` and declarative ArgoCD `Application` definitions under `deploy/argocd/`.
  1. `deploy/k8s/base`: Declares non-root PodSecurity standards (`runAsUser: 10001`, `drop: [ALL]`, `readOnlyRootFilesystem: true`), probes, and resource constraints without hardcoding namespace.
  2. `deploy/k8s/overlays/{dev,staging,prod}`: Overrides namespace, replica counts, and resources per environment tier.
  3. `deploy/argocd/`: Standalone `Application` CRDs with automated self-healing in `dev`/`staging` and gated PR synchronization in `prod`.
- **Consequences:**
  - *Pros:* Fully declarative, CNCF-compliant, drift-resistant, and natively integrates with the `multi-cluster-gitops-promotion` catalog.
  - *Cons:* Requires maintaining separate overlay directories for each target cluster tier.
