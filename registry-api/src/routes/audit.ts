import { Router } from 'express';
import { query } from '../db';

const router = Router();

// Get audit logs
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT a.*, n.name as nhi_name
      FROM audit_logs a
      LEFT JOIN nhis n ON a.nhi_id = n.id
      ORDER BY a.timestamp DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
