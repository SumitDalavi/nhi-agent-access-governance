# Non-Human Identity (NHI) Architecture

## System Diagram
The following Mermaid.js sequence diagram maps the core workflow and interactions:

```mermaid
sequenceDiagram
    Agent->>ControlPlane: Request Access
ControlPlane->>Policy: Evaluate
ControlPlane->>Vault: Issue short-lived credential
Vault-->>Agent: Token
```


Traditional Identity and Access Management (IAM) has focused almost entirely on human users (e.g., SSO, MFA, active directory). However, with the rise of AI agents, CI/CD bots, and programmatic access (e.g., via MCP Servers), a new challenge has emerged: Governing Non-Human Identities (NHI).

## The NHI Lifecycle Model

This project demonstrates a zero-trust model for managing NHIs.

### 1. Registration & Scoping
Every AI Agent, bot, or service account must be registered in the **NHI Registry**. 
- It is assigned an **Owner** (for accountability).
- It is granted specific, least-privilege **Scopes** (e.g., `read:kubernetes_pods`, not `*:*`).
- It has a definitive **Expiry** (to prevent credential hoarding/drift).

### 2. Request & Policy Evaluation
When an AI agent requests an action (e.g., reading a database, or fetching kubernetes secrets):
- The agent authenticates (using short-lived OIDC or mTLS credentials).
- The registry API acts as a Policy Enforcement Point (PEP).
- It queries the **Policy Engine (Open Policy Agent - OPA)**, passing the agent's assigned scopes and the requested action/resource.
- OPA evaluates the request against the declarative Rego policies (Policy Decision Point).

### 3. Auditing & Logging
Every decision (Allowed or Denied) is recorded in an immutable **Audit Log**. 
- If an agent is compromised and attempts to escalate privileges (e.g., a supply-chain attack trying to read Kubernetes secrets instead of pods), the request is dropped.
- The denial is instantly logged with the specific reason and the agent's ID.

## Why OPA?
By decoupling the policy logic (Rego) from the API code (Node.js), we allow security teams to update access rules dynamically without redeploying the application, fulfilling the "Policy-as-Code" mandate of modern DevSecOps.
