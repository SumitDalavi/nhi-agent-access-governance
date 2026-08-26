import request from 'supertest';
import express from 'express';
import nhiRoutes from '../src/routes/nhi';
import authzRoutes from '../src/routes/authz';
import auditRoutes from '../src/routes/audit';

const app = express();
app.use(express.json());
app.use('/api/nhis', nhiRoutes);
app.use('/api/authz', authzRoutes);
app.use('/api/audit', auditRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

describe('Registry API', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});
