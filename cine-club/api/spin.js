import { assign, getBoard, normalizeName } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const name = normalizeName(req.body?.name);
  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  try {
    const result = await assign(name);
    const board = await getBoard();
    if (!result.course) return res.status(409).json({ error: 'All three courses are already taken.', board });
    return res.status(200).json({ name, ...result, board });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error, try again.' });
  }
}
