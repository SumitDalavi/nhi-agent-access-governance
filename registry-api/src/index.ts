import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nhiRoutes from './routes/nhi';
import authzRoutes from './routes/authz';
import auditRoutes from './routes/audit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/nhis', nhiRoutes);
app.use('/api/authz', authzRoutes);
app.use('/api/audit', auditRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Registry API listening at http://localhost:${port}`);
});
