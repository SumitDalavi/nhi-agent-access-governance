import { Router } from 'express';
import { query } from '../db';
import axios from 'axios';
import crypto from 'crypto';

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

    if (nhi.status !== 'ACTIVE') {
      const reason = 'Denied by policy: NHI is not active';
      await logAudit(nhi_id, action, resource, false, reason);
      return res.json({ allowed: false, reason });
    }

    // 2. Query OPA for policy decision
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
    await logAudit(nhi_id, action, resource, allowed, reason);

    res.json({ allowed, reason });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function logAudit(nhi_id: number, action: string, resource: string, allowed: boolean, reason: string) {
  // Fetch the last hash to chain it
  const lastLogResult = await query('SELECT hash FROM audit_logs ORDER BY id DESC LIMIT 1');
  const previous_hash = lastLogResult.rows.length > 0 ? lastLogResult.rows[0].hash : '0'.repeat(64);

  const payload = `${previous_hash}|${nhi_id}|${action}|${resource}|${allowed}|${reason}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex');

  await query(
    `INSERT INTO audit_logs (nhi_id, action, resource, allowed, reason, previous_hash, hash) 
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [nhi_id, action, resource, allowed, reason, previous_hash, hash]
  );
}

export default router;
