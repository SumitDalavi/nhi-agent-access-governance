#!/bin/bash
set -e

API_URL="http://localhost:3001/api"

echo "================================================="
echo "   NHI & AI Agent Access Governance Demo"
echo "================================================="
echo "Waiting for API to be ready..."
until curl -s $API_URL/nhis > /dev/null; do
  sleep 1
done

echo -e "\n1. Seeding NHIs into the Registry..."
# 1. AI MCP Agent
AGENT_ID=$(curl -s -X POST $API_URL/nhis \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DevSecOps MCP Agent",
    "owner": "security-team",
    "purpose": "Autonomous vulnerability remediation",
    "scopes": ["read:github_issues", "write:github_prs", "read:kubernetes_pods"],
    "credential_type": "OIDC",
    "expires_at": "2026-12-31T23:59:59Z"
  }' | grep -o '"id":[^,]*' | cut -d: -f2)

# 2. CI/CD Bot
curl -s -X POST $API_URL/nhis \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitLab CI Deployer",
    "owner": "platform-engineering",
    "purpose": "Deploy images to staging environment",
    "scopes": ["write:kubernetes_deployments"],
    "credential_type": "mTLS",
    "expires_at": "2027-01-01T00:00:00Z"
  }' > /dev/null

echo "✅ NHIs seeded."
echo "Agent ID: $AGENT_ID"

echo -e "\n2. Simulating ALLOWED request (Least-privilege scope matched)..."
echo "Agent requesting to read kubernetes pods..."
curl -s -X POST $API_URL/authz/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "nhi_id": '$AGENT_ID',
    "action": "read",
    "resource": "kubernetes_pods"
  }'

echo -e "\n\n3. Simulating DENIED request (Scope escalation attempt)..."
echo "Agent requesting to read kubernetes secrets (Not in granted scopes!)..."
curl -s -X POST $API_URL/authz/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "nhi_id": '$AGENT_ID',
    "action": "read",
    "resource": "kubernetes_secrets"
  }'

echo -e "\n\n4. Simulating DENIED request (Unauthorized write)..."
echo "Agent requesting to write kubernetes deployments..."
curl -s -X POST $API_URL/authz/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "nhi_id": '$AGENT_ID',
    "action": "write",
    "resource": "kubernetes_deployments"
  }'

echo -e "\n\n✅ Demo complete. Check the dashboard at http://localhost:5173 to see the audit logs."
