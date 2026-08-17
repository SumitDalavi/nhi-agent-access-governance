import { Router } from 'express';
import { query } from '../db';
import axios from 'axios';

const router = Router();

// Evaluate policy via OPA
router.post('/evaluate', async (req, res) => {
  const { nhi_id, action, resource } = req.body;

  try {
    // 1. Fetch NHI scopes
    const nhiResult = await query('SELECT * FROM nhis WHERE id = $1', [nhi_id]);
    if (nhiResult.rows.length === 0) {
      return res.status(404).json({ error: 'NHI not found' });
    }
    const nhi = nhiResult.rows[0];

    // 2. Query OPA for policy decision
    // In a real environment, you might just send the input and OPA fetches the data, 
    // or you pass the scopes in the input. Here we pass the scopes.
    const opaInput = {
      input: {
        action,
        resource,
        scopes: nhi.scopes
      }
    };

    let allowed = false;
    let reason = "OPA evaluation failed";
    
    try {
      const opaUrl = process.env.OPA_URL || 'http://localhost:8181/v1/data/nhi/authz/allow';
      const opaResponse = await axios.post(opaUrl, opaInput);
      allowed = opaResponse.data.result === true;
      reason = allowed ? "Granted by policy" : "Denied by policy: insufficient scope";
    } catch (err: any) {
      console.error("Error communicating with OPA:", err.message);
    }

    // 3. Log the decision
    await query(
      `INSERT INTO audit_logs (nhi_id, action, resource, allowed, reason) 
       VALUES ($1, $2, $3, $4, $5)`,
      [nhi_id, action, resource, allowed, reason]
    );

    res.json({ allowed, reason });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
