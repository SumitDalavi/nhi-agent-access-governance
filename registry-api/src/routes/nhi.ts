import { Router } from 'express';
import { query } from '../db';

const router = Router();

// Get all NHIs
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM nhis ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new NHI
router.post('/', async (req, res) => {
  const { name, owner, purpose, scopes, credential_type, expires_at } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO nhis (name, owner, purpose, scopes, credential_type, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, owner, purpose, JSON.stringify(scopes), credential_type, expires_at]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an NHI (Revoke)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM nhis WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
