# Non-Human Identity (NHI) & AI Agent Access Governance Platform

A proof-of-concept demonstrating how organizations govern access for non-human identities (service accounts, AI agents, MCP servers, CI/CD bots).

## The Problem
Traditional IAM assumes a human is behind every credential. AI agents and MCP servers now request infrastructure access, execute tool calls, and act autonomously — but most organizations have no lifecycle management, blast-radius limits, or audit trail for these non-human identities. A compromised or misconfigured agent credential can silently escalate privileges across systems with no human in the loop to notice.

## The Solution
An NHI governance platform that tracks non-human identities, enforces least-privilege scope requests at runtime using Open Policy Agent (OPA), and records every access decision in an immutable audit log.

```text
+-------------------+       +-----------------------+       +-------------------+
|                   |       |                       |       |                   |
|   AI Agent /      | ----> |   Registry & Policy   | ----> |   Target System   |
|   MCP Server      |       |   API (Node.js)       |       |   (Kubernetes)    |
|                   |       |                       |       |                   |
+-------------------+       +-----------------------+       +-------------------+
                                      |   ^
                                      v   | (Allow/Deny)
                            +-----------------------+
                            |                       |
                            |   Open Policy Agent   |
                            |   (Rego Policies)     |
                            |                       |
                            +-----------------------+
```

## Why This Over the Obvious Alternative
Most "AI security" demos focus on prompt injection or model output filtering. This project addresses the infrastructure-layer problem: treating AI agents as first-class identities with their own lifecycle, least-privilege scoping, and audit requirements — the exact "Non-Human Identity governance" pattern that CISOs are now mandating before allowing agentic AI into production environments.

## Tech Stack
- **Registry & Policy API:** Node.js, TypeScript, Express, PostgreSQL
- **Policy Engine:** Open Policy Agent (OPA) using Rego
- **Auth:** Short-lived OIDC tokens for NHI-to-service authentication (mirror GitHub Actions OIDC pattern)
- **Audit Log:** Structured JSON logs, queryable via a simple log viewer
- **Dashboard:** React (Vite), Tailwind CSS
- **Containerization:** Docker, Docker Compose

## Decision Log

| Component | Decision | Rationale |
| :--- | :--- | :--- |
| **Policy Engine** | Open Policy Agent (OPA) | Decouples authorization logic from application code, standardizing policy-as-code across the infrastructure. |
| **Database** | PostgreSQL | Relational structure is ideal for tracking identities and their relational audit logs immutably. |
| **Frontend** | React + Tailwind | Enables rapid iteration of a clean, modern dashboard for security analysts to review active NHIs and logs. |

## Project Structure

```text
nhi-agent-access-governance/
├── dashboard/            # React frontend for monitoring NHIs and logs
├── docs/                 # Architecture and design documentation
├── policy/               # OPA Rego policies (authz.rego)
├── registry-api/         # Node.js Express backend and DB connection
├── scripts/              # Seed scripts and DB init
├── docker-compose.yml    # Local multi-container orchestration
└── README.md             # This file
```

## Prerequisites

| Tool | Purpose |
| :--- | :--- |
| Docker & Docker Compose | Container orchestration |
| Node.js 18+ (Optional) | Local development outside of Docker |
| bash & curl | Running the demo script |

## Step-by-Step Setup

1. **Clone the repository and enter the directory:**
   ```bash
   git clone https://github.com/your-username/nhi-agent-access-governance.git
   cd nhi-agent-access-governance
   ```

2. **Start the platform via Docker Compose:**
   ```bash
   docker-compose up --build -d
   ```
   This spins up PostgreSQL, the OPA engine, the Registry API (Port 3001), and the Dashboard (Port 5173).

## Usage & Demo

Run the automated demo script to populate the registry and simulate scenarios:
```bash
./scripts/demo.sh
```

### Scenario 1: Registration
The script registers an "AI MCP Agent" and a "CI/CD Bot" into the NHI registry, assigning specific limited scopes (`read:kubernetes_pods`).

### Scenario 2: Allowed Request
The AI Agent requests to `read` the resource `kubernetes_pods`. The API queries OPA. Since the scope matches, OPA returns `true` and the request is allowed.

### Scenario 3: Denied Request (Scope Escalation Attempt)
The AI Agent is compromised and attempts to `read` the resource `kubernetes_secrets`. OPA evaluates the request, finds no matching scope, returns `false`, and the request is dropped.

### Scenario 4: Denied Request (Unauthorized Write)
The AI Agent attempts to `write` to `kubernetes_deployments`. It is explicitly denied as it lacks write scopes for deployments.

Navigate to **http://localhost:5173** to view the active NHIs and see the real-time audit log catching these allowed/denied requests.

## Verification

| Check | Expected Result |
| :--- | :--- |
| Database Init | `docker-compose logs postgres` shows successful initialization. |
| OPA Policies | `docker-compose logs opa` shows no parse errors on `authz.rego`. |
| API Health | `curl http://localhost:3001/health` returns `{"status":"ok"}`. |
| Dashboard | http://localhost:5173 loads and displays seeded data after running the demo script. |

## Author

**Sumit Dalavi — Senior DevSecOps / Platform Engineer**
- [GitHub](https://github.com/your-username)
- [LinkedIn](https://linkedin.com/in/your-profile)


## CI & Reliability Updates (August 2026)

- **CI Pipeline Remediation:** Successfully resolved all CI/CD pipeline failures and established baseline CI workflows.
- **Specific Fix:** Added and configured robust GitHub Actions workflows for automated testing, linting, and formatting.
- **Status:** 🟩 Passing
