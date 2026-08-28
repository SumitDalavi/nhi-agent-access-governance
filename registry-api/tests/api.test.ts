import request from 'supertest';
import express from 'express';
import nhiRoutes from '../src/routes/nhi';
import authzRoutes from '../src/routes/authz';
import auditRoutes from '../src/routes/audit';
import { query } from '../src/db';

const app = express();
app.use(express.json());
app.use('/api/nhis', nhiRoutes);
app.use('/api/authz', authzRoutes);
app.use('/api/audit', auditRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

describe('Registry API Integration Tests', () => {
  let testNhiId: number;

  beforeAll(async () => {
    // Wait for DB to be ready, clean up existing data
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      await query('DELETE FROM audit_logs');
      await query('DELETE FROM nhis');
    } catch (e) {
      console.warn('DB cleanup failed, might be first run:', e);
    }
  });

  afterAll(async () => {
    // Optional cleanup
    try {
      await query('DELETE FROM audit_logs');
      await query('DELETE FROM nhis');
    } catch (e) {
      // ignore
    }
  });

  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });

  it('should create a new NHI', async () => {
    const res = await request(app)
      .post('/api/nhis')
      .send({
        name: 'test-agent',
        owner: 'security-team',
        purpose: 'Test integration',
        scopes: ['read:secrets', 'write:logs'],
        credential_type: 'jwt',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('test-agent');
    testNhiId = res.body.id;
  });

  it('should fetch the created NHI', async () => {
    const res = await request(app).get('/api/nhis');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((nhi: any) => nhi.id === testNhiId)).toBeTruthy();
  });

  it('should evaluate authz as allowed with valid scope', async () => {
    // Wait a bit for OPA to be ready if it just started
    const res = await request(app)
      .post('/api/authz/evaluate')
      .send({
        nhi_id: testNhiId,
        action: 'read',
        resource: 'secrets'
      });
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
    expect(res.body.reason).toContain('Granted');
  });

  it('should evaluate authz as denied with invalid scope', async () => {
    const res = await request(app)
      .post('/api/authz/evaluate')
      .send({
        nhi_id: testNhiId,
        action: 'delete',
        resource: 'secrets'
      });
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(false);
    expect(res.body.reason).toContain('Denied');
  });

  it('should log audit events for evaluations', async () => {
    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(200);
    // At least 2 events from the previous tests
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    const lastAudit = res.body[0]; // descending order
    expect(lastAudit.nhi_id).toBe(testNhiId);
    expect(lastAudit.action).toBe('delete');
    expect(lastAudit.allowed).toBe(false);
  });

  it('should revoke (soft delete) an NHI', async () => {
    const res = await request(app).delete(`/api/nhis/${testNhiId}`);
    expect(res.status).toBe(204);

    const checkRes = await request(app).get('/api/nhis');
    const revokedNhi = checkRes.body.find((nhi: any) => nhi.id === testNhiId);
    expect(revokedNhi).toBeDefined();
    expect(revokedNhi.status).toBe('REVOKED');
  });
});
