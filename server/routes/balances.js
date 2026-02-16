const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  try {
    const userId = req.user.id;

    // Money others owe the current user (user paid, others have splits)
    const owedToMe = db.prepare(`
      SELECT es.user_id, u.name as user_name, SUM(es.amount) as total
      FROM expense_splits es
      JOIN expenses e ON e.id = es.expense_id
      JOIN users u ON u.id = es.user_id
      WHERE e.paid_by = ? AND es.user_id != ?
      GROUP BY es.user_id
    `).all(userId, userId);

    // Money current user owes others (others paid, user has splits)
    const iOwe = db.prepare(`
      SELECT e.paid_by as user_id, u.name as user_name, SUM(es.amount) as total
      FROM expense_splits es
      JOIN expenses e ON e.id = es.expense_id
      JOIN users u ON u.id = e.paid_by
      WHERE es.user_id = ? AND e.paid_by != ?
      GROUP BY e.paid_by
    `).all(userId, userId);

    // Settlements where current user paid someone
    const settledByMe = db.prepare(`
      SELECT paid_to as user_id, SUM(amount) as total
      FROM settlements WHERE paid_by = ?
      GROUP BY paid_to
    `).all(userId);

    // Settlements where someone paid the current user
    const settledToMe = db.prepare(`
      SELECT paid_by as user_id, SUM(amount) as total
      FROM settlements WHERE paid_to = ?
      GROUP BY paid_by
    `).all(userId);

    // Calculate net balances per person
    const balanceMap = {};

    for (const row of owedToMe) {
      balanceMap[row.user_id] = balanceMap[row.user_id] || { user_id: row.user_id, user_name: row.user_name, amount: 0 };
      balanceMap[row.user_id].amount += row.total;
    }

    for (const row of iOwe) {
      balanceMap[row.user_id] = balanceMap[row.user_id] || { user_id: row.user_id, user_name: row.user_name, amount: 0 };
      balanceMap[row.user_id].amount -= row.total;
    }

    for (const row of settledByMe) {
      if (balanceMap[row.user_id]) {
        balanceMap[row.user_id].amount -= row.total;
      }
    }

    for (const row of settledToMe) {
      if (balanceMap[row.user_id]) {
        balanceMap[row.user_id].amount += row.total;
      }
    }

    const balances = Object.values(balanceMap)
      .filter(b => Math.abs(b.amount) > 0.01)
      .map(b => ({ ...b, amount: parseFloat(b.amount.toFixed(2)) }));

    const totalOwed = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);
    const totalOwe = balances.filter(b => b.amount < 0).reduce((sum, b) => sum + Math.abs(b.amount), 0);

    res.json({
      balances,
      total_owed_to_you: parseFloat(totalOwed.toFixed(2)),
      total_you_owe: parseFloat(totalOwe.toFixed(2)),
      net_balance: parseFloat((totalOwed - totalOwe).toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
