const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);

    const token = jwt.sign({ id: result.lastInsertRowid, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search users by exact email only (privacy: no name-based discovery)
router.get('/users/search', auth, (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) return res.json([]);

    // Only match by email (exact or partial email match) — never expose by name alone
    const users = db.prepare(
      'SELECT id, name, email FROM users WHERE email LIKE ? AND id != ?'
    ).all(`%${q}%`, req.user.id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search only within current user's friends (for expense splitting, group adding, etc.)
router.get('/users/friends-search', auth, (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const friends = db.prepare(`
      SELECT u.id, u.name, u.email FROM friends f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ? AND (u.name LIKE ? OR u.email LIKE ?)
      UNION
      SELECT u.id, u.name, u.email FROM friends f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ? AND (u.name LIKE ? OR u.email LIKE ?)
    `).all(req.user.id, `%${q}%`, `%${q}%`, req.user.id, `%${q}%`, `%${q}%`);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
