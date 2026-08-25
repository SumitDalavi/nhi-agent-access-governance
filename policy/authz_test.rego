package authz

import data.authz.allow

test_allow_admin {
    allow with input as {"user": {"role": "admin"}}
}

test_deny_regular_user {
    not allow with input as {"user": {"role": "user"}}
}

test_allow_agent_service {
    allow with input as {"user": {"role": "agent-service", "status": "active"}}
}

test_deny_inactive_agent_service {
    not allow with input as {"user": {"role": "agent-service", "status": "inactive"}}
}
