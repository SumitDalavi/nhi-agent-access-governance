CREATE TABLE IF NOT EXISTS nhis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    purpose TEXT,
    scopes JSONB NOT NULL DEFAULT '[]',
    credential_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    nhi_id INTEGER REFERENCES nhis(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    previous_hash VARCHAR(64),
    hash VARCHAR(64),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
