package nhi.authz_test

import data.nhi.authz.allow

test_allow_exact_match {
    allow with input as {"scopes": ["read:secrets"], "action": "read", "resource": "secrets"}
}

test_deny_mismatch {
    not allow with input as {"scopes": ["read:secrets"], "action": "write", "resource": "secrets"}
}

test_allow_wildcard_resource {
    allow with input as {"scopes": ["read:*"], "action": "read", "resource": "users"}
}

test_allow_wildcard_action {
    allow with input as {"scopes": ["*:secrets"], "action": "delete", "resource": "secrets"}
}

test_allow_admin_wildcard {
    allow with input as {"scopes": ["*:*"], "action": "destroy", "resource": "everything"}
}
