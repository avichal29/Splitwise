const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  try {
    const expenses = db.prepare(`
      SELECT DISTINCT e.*, u.name as paid_by_name, g.name as group_name
      FROM expenses e
      JOIN users u ON u.id = e.paid_by
      LEFT JOIN groups_ g ON g.id = e.group_id
      LEFT JOIN expense_splits es ON es.expense_id = e.id
      WHERE e.paid_by = ? OR es.user_id = ?
      ORDER BY e.created_at DESC
    `).all(req.user.id, req.user.id);

    for (const expense of expenses) {
      expense.splits = db.prepare(`
        SELECT es.*, u.name as user_name FROM expense_splits es
        JOIN users u ON u.id = es.user_id
        WHERE es.expense_id = ?
      `).all(expense.id);
    }

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { description, amount, group_id, split_type, splits } = req.body;

    if (!description || !amount || !splits || splits.length === 0) {
      return res.status(400).json({ error: 'Description, amount, and splits are required' });
    }

    const result = db.prepare(
      'INSERT INTO expenses (description, amount, paid_by, group_id, split_type) VALUES (?, ?, ?, ?, ?)'
    ).run(description, amount, req.user.id, group_id || null, split_type || 'equal');

    const expenseId = result.lastInsertRowid;

    const insertSplit = db.prepare('INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)');
    const addSplits = db.transaction((splitList) => {
      for (const split of splitList) {
        insertSplit.run(expenseId, split.user_id, split.amount);
      }
    });

    if (split_type === 'equal') {
      const splitAmount = parseFloat((amount / splits.length).toFixed(2));
      const equalSplits = splits.map(s => ({ user_id: s.user_id, amount: splitAmount }));
      addSplits(equalSplits);
    } else if (split_type === 'exact') {
      addSplits(splits);
    } else if (split_type === 'percentage') {
      const percentageSplits = splits.map(s => ({
        user_id: s.user_id,
        amount: parseFloat(((s.percentage / 100) * amount).toFixed(2))
      }));
      addSplits(percentageSplits);
    } else {
      addSplits(splits);
    }

    const expense = db.prepare(`
      SELECT e.*, u.name as paid_by_name FROM expenses e
      JOIN users u ON u.id = e.paid_by
      WHERE e.id = ?
    `).get(expenseId);

    expense.splits = db.prepare(`
      SELECT es.*, u.name as user_name FROM expense_splits es
      JOIN users u ON u.id = es.user_id
      WHERE es.expense_id = ?
    `).all(expenseId);

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND paid_by = ?').get(req.params.id, req.user.id);
    if (!expense) return res.status(403).json({ error: 'Only the payer can delete this expense' });

    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
