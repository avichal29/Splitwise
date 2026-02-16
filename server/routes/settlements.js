const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  try {
    const settlements = db.prepare(`
      SELECT s.*, payer.name as paid_by_name, payee.name as paid_to_name, g.name as group_name
      FROM settlements s
      JOIN users payer ON payer.id = s.paid_by
      JOIN users payee ON payee.id = s.paid_to
      LEFT JOIN groups_ g ON g.id = s.group_id
      WHERE s.paid_by = ? OR s.paid_to = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id, req.user.id);
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { paid_to, amount, group_id } = req.body;
    if (!paid_to || !amount) {
      return res.status(400).json({ error: 'paid_to and amount are required' });
    }

    const result = db.prepare(
      'INSERT INTO settlements (paid_by, paid_to, amount, group_id) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, paid_to, amount, group_id || null);

    res.status(201).json({ id: result.lastInsertRowid, paid_by: req.user.id, paid_to, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
