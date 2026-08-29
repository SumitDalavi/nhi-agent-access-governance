import requests
import pytest
import time
import uuid

API_BASE = "http://localhost:3002/api"

@pytest.fixture(scope="module")
def setup_nhis():
    """Create test NHIs in the registry."""
    # 1. Valid Agent
    valid_payload = {
        "name": f"Valid-Agent-{uuid.uuid4().hex[:8]}",
        "owner": "test-team",
        "purpose": "Integration Testing",
        "scopes": ["read:kubernetes_pods"],
        "credential_type": "SPIFFE"
    }
    r = requests.post(f"{API_BASE}/nhis", json=valid_payload)
    valid_id = r.json()["id"]

    # 2. Expired/Revoked Agent
    expired_payload = {
        "name": f"Expired-Agent-{uuid.uuid4().hex[:8]}",
        "owner": "test-team",
        "purpose": "Integration Testing",
        "scopes": ["read:kubernetes_pods"],
        "credential_type": "SPIFFE"
    }
    r = requests.post(f"{API_BASE}/nhis", json=expired_payload)
    expired_id = r.json()["id"]
    
    # Revoke the expired agent (setting status to INACTIVE)
    requests.delete(f"{API_BASE}/nhis/{expired_id}")

    return {"valid": valid_id, "expired": expired_id}

def test_expired_svid_rejected(setup_nhis):
    """Test that an agent presenting an expired SPIFFE SVID is denied access."""
    nhi_id = setup_nhis["expired"]
    
    eval_payload = {
        "nhi_id": nhi_id,
        "action": "read",
        "resource": "kubernetes_pods"
    }
    
    response = requests.post(f"{API_BASE}/authz/evaluate", json=eval_payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["allowed"] is False
    assert "not active" in data["reason"].lower()

def test_valid_agent_allowed(setup_nhis):
    """Test that an active agent with proper scope is allowed."""
    nhi_id = setup_nhis["valid"]
    
    eval_payload = {
        "nhi_id": nhi_id,
        "action": "read",
        "resource": "kubernetes_pods"
    }
    
    response = requests.post(f"{API_BASE}/authz/evaluate", json=eval_payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["allowed"] is True
    assert data["reason"] == "Granted by policy"

def test_privilege_escalation_blocked(setup_nhis):
    """Test that a valid agent cannot escalate privileges beyond its scope."""
    nhi_id = setup_nhis["valid"]
    
    eval_payload = {
        "nhi_id": nhi_id,
        "action": "write",
        "resource": "kubernetes_secrets"
    }
    
    response = requests.post(f"{API_BASE}/authz/evaluate", json=eval_payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["allowed"] is False
    assert "insufficient scope" in data["reason"].lower()
