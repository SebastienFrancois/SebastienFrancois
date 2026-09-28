import { getBoard } from '../lib/store.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ board: await getBoard() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
