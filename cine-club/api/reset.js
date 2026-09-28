import { reset } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const pin = process.env.ADMIN_PIN;
  if (!pin) return res.status(403).json({ error: 'Reset is disabled: set ADMIN_PIN in Vercel.' });
  if (String(req.body?.pin || '') !== pin) return res.status(401).json({ error: 'Wrong PIN.' });
  try {
    await reset();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
