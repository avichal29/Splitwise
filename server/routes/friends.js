const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  try {
    const friends = db.prepare(`
      SELECT u.id, u.name, u.email FROM friends f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ?
      UNION
      SELECT u.id, u.name, u.email FROM friends f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ?
    `).all(req.user.id, req.user.id);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { friend_id } = req.body;
    if (!friend_id) return res.status(400).json({ error: 'friend_id is required' });
    if (friend_id === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = db.prepare(
      'SELECT id FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
    ).get(req.user.id, friend_id, friend_id, req.user.id);

    if (existing) return res.status(400).json({ error: 'Already friends' });

    db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(req.user.id, friend_id);
    res.status(201).json({ message: 'Friend added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
    ).run(req.user.id, req.params.id, req.params.id, req.user.id);
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
