# ADR-002: Policy Engine — OPA vs Casbin

## Status: Accepted

## Context
Once an agent's identity is authenticated via SPIFFE, we need an authorization engine to determine if that identity (e.g., `spiffe://example.org/billing-service`) is allowed to perform a specific action on a specific resource.

## Decision
We chose **Open Policy Agent (OPA)**.

## Alternatives Considered
| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Hardcoded RBAC | Trivial to implement | Impossible to scale, requires code deployment to change rules | Does not meet enterprise requirements |
| Casbin | Lightweight, supports many models (RBAC, ABAC), fast | Difficult to decouple policy from application code cleanly | Good, but lacks OPA's ecosystem |
| Open Policy Agent (OPA) | Cloud Native standard, fully decoupled, policy-as-code (Rego) | Rego has a steep learning curve | **Selected** due to industry standardization and robust tooling |

## Consequences
- Positive: Policies are managed as code, version controlled, and can be updated independently of the application lifecycle.
- Negative: Engineering teams must learn Rego.
- Trade-offs accepted: We accept Rego's complexity in exchange for powerful, decoupled, context-aware policy enforcement.
