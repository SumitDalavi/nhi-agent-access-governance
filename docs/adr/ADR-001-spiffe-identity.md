# ADR-001: SPIFFE/SPIRE for Agent Identity

## Status: Accepted

## Context
Non-Human Identities (NHI) such as microservices, CI/CD pipelines, and background agents need a secure way to authenticate to each other without sharing static secrets (like API keys).

## Decision
We chose **SPIFFE (Secure Production Identity Framework for Everyone) and SPIRE** for assigning and verifying cryptographic identities (SVIDs).

## Alternatives Considered
| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Static API Keys | Simple to implement, works everywhere | Secret sprawl, hard to rotate, easily leaked | Violates our zero-trust secure-by-default mandate |
| AWS IAM Roles (IRSA) / GCP Workload Identity | Cloud native | Vendor lock-in, hard to test locally (kind) | We require a cloud-agnostic solution |
| SPIFFE/SPIRE | Cryptographic identity, short-lived (minutes), vendor agnostic | High setup complexity | **Selected** as it provides the strongest security posture for multi-cloud |

## Consequences
- Positive: No static secrets are ever stored in the code or environment variables. Compromised agents have a very short window of vulnerability due to automatic SVID rotation.
- Negative: Requires deploying a SPIRE server and agents as DaemonSets on the Kubernetes cluster.
- Trade-offs accepted: We accept the initial infrastructure complexity to permanently solve secret sprawl.
