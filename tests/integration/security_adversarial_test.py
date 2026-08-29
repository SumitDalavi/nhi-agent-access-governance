import requests
import pytest

def test_expired_svid_rejected():
    """Test that an agent presenting an expired SPIFFE SVID is denied access."""
    # Assuming the API endpoint requires mutual TLS and extracts SVID.
    # An expired cert should fail at the TLS handshake level or custom verifier.
    try:
        # Mocking an expired cert passing to the endpoint
        response = requests.get('https://localhost:8443/api/v1/resource', cert=('expired_cert.pem', 'expired_key.pem'), verify=False)
        assert response.status_code == 401 or response.status_code == 403
    except requests.exceptions.SSLError:
        # Expected failure
        pass

def test_identity_spoofing_denied():
    """Test that an agent cannot spoof the SPIFFE ID of another service."""
    # The SVID contains the SPIFFE ID signed by the trust domain CA.
    # If a service tries to spoof the ID but doesn't have the corresponding private key, the handshake fails.
    # If the service successfully connects but OPA checks the signed ID vs requested resource, it should be blocked.
    response = requests.get('https://localhost:8443/api/v1/secure-data', headers={"X-Spoofed-Spiffe-ID": "spiffe://example.org/admin"}, verify=False)
    # The backend MUST NOT trust headers, only the verified certificate SAN.
    assert response.status_code == 403

def test_privilege_escalation_blocked_by_opa():
    """Test that an authenticated agent cannot access resources beyond its OPA policy bounds."""
    # Agent is valid (spiffe://example.org/viewer) but tries to write data
    policy_payload = {
        "input": {
            "spiffe_id": "spiffe://example.org/viewer",
            "method": "POST",
            "path": "/api/v1/secure-data"
        }
    }
    # OPA evaluation endpoint
    response = requests.post('http://localhost:8181/v1/data/authz/allow', json=policy_payload)
    assert response.status_code == 200
    result = response.json().get('result', False)
    assert result is False, "OPA allowed unauthorized write access!"
