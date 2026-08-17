package nhi.authz

default allow = false

# Allow if the NHI has a scope that matches the requested action and resource
allow {
    some i
    scope := input.scopes[i]
    
    # Simple prefix or exact match logic for demo purposes
    # E.g., scope = "read:secrets", action = "read", resource = "secrets"
    # Or scope = "admin:*"
    parts := split(scope, ":")
    action_match(parts[0], input.action)
    resource_match(parts[1], input.resource)
}

action_match(scope_action, requested_action) {
    scope_action == requested_action
}

action_match(scope_action, _) {
    scope_action == "*"
}

resource_match(scope_resource, requested_resource) {
    scope_resource == requested_resource
}

resource_match(scope_resource, _) {
    scope_resource == "*"
}
