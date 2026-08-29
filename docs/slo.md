# Service Level Objectives

## Availability SLO
- Target: 99.99% for policy evaluation
- Context: Authorization sits in the critical path of every single inter-service request.
- Error budget: 4.38 minutes/month

## Latency SLO
- Target: P99 < 5ms for policy evaluation (OPA sidecar)
- Measurement: Intercepted via Envoy metrics or OPA's native `/metrics` endpoint.
- Context: Because OPA runs as a sidecar, network latency is effectively zero. Evaluation must be extremely fast to prevent cascading latency in microservices.

## Correctness SLO
- Zero instances of privilege escalation or unauthorized data access.
- Measurement: 100% of policy decisions must be logged and periodically audited.
