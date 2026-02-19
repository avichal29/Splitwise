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

router.get('/monthly', auth, (req, res) => {
  try {
    const userId = req.user.id;

    // Total spent by the user (expenses they paid) grouped by month - last 12 months
    const paidByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', e.created_at) as month,
        SUM(e.amount) as total_paid,
        COUNT(e.id) as expense_count
      FROM expenses e
      WHERE e.paid_by = ?
        AND e.created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', e.created_at)
      ORDER BY month ASC
    `).all(userId);

    // User's share of expenses (what they owe from splits) grouped by month
    const shareByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', e.created_at) as month,
        SUM(es.amount) as total_share
      FROM expense_splits es
      JOIN expenses e ON e.id = es.expense_id
      WHERE es.user_id = ?
        AND e.created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', e.created_at)
      ORDER BY month ASC
    `).all(userId);

    // Category breakdown for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const categoryBreakdown = db.prepare(`
      SELECT
        CASE
          WHEN e.description LIKE '%🍕%' THEN 'Food'
          WHEN e.description LIKE '%🏠%' THEN 'Rent'
          WHEN e.description LIKE '%🚗%' THEN 'Transport'
          WHEN e.description LIKE '%🎬%' THEN 'Entertainment'
          WHEN e.description LIKE '%🛒%' THEN 'Groceries'
          WHEN e.description LIKE '%✈️%' THEN 'Travel'
          WHEN e.description LIKE '%💡%' THEN 'Utilities'
          ELSE 'Other'
        END as category,
        SUM(es.amount) as amount
      FROM expense_splits es
      JOIN expenses e ON e.id = es.expense_id
      WHERE es.user_id = ?
        AND strftime('%Y-%m', e.created_at) = ?
      GROUP BY category
      ORDER BY amount DESC
    `).all(userId, currentMonth);

    // Build a full 12-month array (use local date, not UTC)
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${yyyy}-${mm}`);
    }

    const paidMap = {};
    for (const row of paidByMonth) {
      paidMap[row.month] = { total_paid: row.total_paid, expense_count: row.expense_count };
    }
    const shareMap = {};
    for (const row of shareByMonth) {
      shareMap[row.month] = row.total_share;
    }

    const monthly = months.map(m => ({
      month: m,
      total_paid: paidMap[m]?.total_paid || 0,
      your_share: shareMap[m] || 0,
      expense_count: paidMap[m]?.expense_count || 0,
    }));

    // Current month totals
    const currentData = monthly.find(m => m.month === currentMonth) || { total_paid: 0, your_share: 0, expense_count: 0 };
    const prevMonth = months.length >= 2 ? months[months.length - 2] : null;
    const prevData = prevMonth ? (monthly.find(m => m.month === prevMonth) || { your_share: 0 }) : { your_share: 0 };

    const changePercent = prevData.your_share > 0
      ? parseFloat((((currentData.your_share - prevData.your_share) / prevData.your_share) * 100).toFixed(1))
      : 0;

    res.json({
      monthly,
      current_month: {
        month: currentMonth,
        total_paid: currentData.total_paid,
        your_share: currentData.your_share,
        expense_count: currentData.expense_count,
        change_percent: changePercent,
      },
      categories: categoryBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk import from CSV (frontend parses file, sends JSON array)
router.post('/import', auth, (req, res) => {
  try {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'No transactions provided' });
    }

    const insertExpense = db.prepare(
      'INSERT INTO expenses (description, amount, paid_by, split_type) VALUES (?, ?, ?, ?)'
    );
    const insertSplit = db.prepare(
      'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)'
    );

    const importAll = db.transaction((txns) => {
      const imported = [];
      for (const txn of txns) {
        if (!txn.description || !txn.amount || txn.amount <= 0) continue;
        const result = insertExpense.run(txn.description, txn.amount, req.user.id, 'equal');
        insertSplit.run(result.lastInsertRowid, req.user.id, txn.amount);
        imported.push({ id: result.lastInsertRowid, description: txn.description, amount: txn.amount });
      }
      return imported;
    });

    const imported = importAll(transactions);
    res.status(201).json({ message: `${imported.length} expenses imported`, expenses: imported });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agentic quick add - parse natural language, detect friends, auto-categorize, auto-split
router.post('/quick', auth, (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const input = text.trim();
    const lowerInput = input.toLowerCase();

    // ─── Step 1: Parse amount ───
    const amountMatch = input.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d{1,2})?)/i);
    if (!amountMatch) {
      return res.status(400).json({ error: 'Could not find an amount. Try: "dinner 500 with Rahul"' });
    }
    const amount = parseFloat(amountMatch[1]);
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // ─── Step 2: Detect friends mentioned in text ───
    const userFriends = db.prepare(`
      SELECT u.id, u.name FROM friends f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ?
      UNION
      SELECT u.id, u.name FROM friends f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ?
    `).all(req.user.id, req.user.id);

    const mentionedFriends = [];
    const friendNameTokens = [];
    for (const friend of userFriends) {
      const friendName = friend.name.toLowerCase();
      const firstName = friendName.split(' ')[0];
      // Check if friend's first name appears in the input
      if (lowerInput.includes(firstName) && firstName.length >= 2) {
        mentionedFriends.push(friend);
        friendNameTokens.push(firstName);
      }
    }

    // ─── Step 3: Parse description ───
    let description = input
      .replace(/(?:rs\.?|₹|inr)?\s*\d+(?:\.\d{1,2})?/i, '')
      .replace(/\b(paid|spent|for|on|at|to|in|via|through|using|from|with|split|between|and|rupees?)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove matched friend names from description to keep it clean
    for (const token of friendNameTokens) {
      description = description.replace(new RegExp(`\\b${token}\\b`, 'gi'), '').trim();
    }

    if (!description) {
      description = 'Quick expense';
    }
    description = description.charAt(0).toUpperCase() + description.slice(1);

    // ─── Step 4: Auto-detect category (expanded keywords) ───
    const categoryMap = {
      '🍕': ['food', 'dinner', 'lunch', 'breakfast', 'snack', 'eat', 'restaurant', 'cafe', 'coffee', 'tea', 'pizza', 'burger', 'biryani', 'swiggy', 'zomato', 'dominos', 'kfc', 'mcd', 'mcdonalds', 'starbucks', 'chai', 'maggi', 'noodles', 'thali', 'dosa', 'idli', 'paratha', 'momos', 'chicken', 'paneer', 'dal', 'rice', 'roti', 'naan', 'tandoori', 'bbq', 'grill', 'sushi', 'pasta', 'cake', 'icecream', 'dessert', 'juice', 'lassi', 'shake', 'boba'],
      '🚗': ['uber', 'ola', 'cab', 'taxi', 'fuel', 'petrol', 'diesel', 'gas', 'auto', 'rickshaw', 'metro', 'bus', 'transport', 'rapido', 'parking', 'toll', 'car', 'bike', 'scooter', 'drive', 'ride', 'commute'],
      '🛒': ['grocery', 'groceries', 'supermarket', 'blinkit', 'bigbasket', 'zepto', 'dmart', 'vegetables', 'fruits', 'milk', 'bread', 'eggs', 'flour', 'oil', 'spices', 'provision', 'kirana', 'reliance fresh', 'more', 'spar'],
      '🎬': ['movie', 'cinema', 'netflix', 'prime', 'hotstar', 'spotify', 'entertainment', 'game', 'concert', 'show', 'pvr', 'inox', 'bookmyshow', 'imax', 'theatre', 'youtube', 'subscription', 'ott'],
      '🏠': ['rent', 'maintenance', 'house', 'flat', 'apartment', 'society', 'landlord', 'deposit', 'pg', 'hostel', 'room'],
      '✈️': ['flight', 'hotel', 'travel', 'trip', 'vacation', 'holiday', 'booking', 'train', 'irctc', 'makemytrip', 'goibibo', 'oyo', 'airbnb', 'resort', 'cleartrip', 'yatra', 'tourism'],
      '💡': ['bill', 'recharge', 'wifi', 'internet', 'phone', 'jio', 'airtel', 'vi', 'broadband', 'electricity', 'water bill', 'gas bill', 'postpaid', 'prepaid', 'dth', 'tata sky'],
    };

    let emoji = '🎁';
    for (const [cat, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => lowerInput.includes(kw))) {
        emoji = cat;
        break;
      }
    }

    const fullDescription = `${emoji} ${description}`;

    // ─── Step 5: Create expense & splits ───
    const splitWith = [req.user.id, ...mentionedFriends.map(f => f.id)];
    const splitAmount = parseFloat((amount / splitWith.length).toFixed(2));

    const result = db.prepare(
      'INSERT INTO expenses (description, amount, paid_by, split_type) VALUES (?, ?, ?, ?)'
    ).run(fullDescription, amount, req.user.id, 'equal');

    const expenseId = result.lastInsertRowid;

    const insertSplit = db.prepare('INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)');
    const addSplits = db.transaction((ids) => {
      for (const id of ids) {
        insertSplit.run(expenseId, id, splitAmount);
      }
    });
    addSplits(splitWith);

    const expense = db.prepare(`
      SELECT e.*, u.name as paid_by_name FROM expenses e
      JOIN users u ON u.id = e.paid_by WHERE e.id = ?
    `).get(expenseId);

    expense.splits = db.prepare(`
      SELECT es.*, u.name as user_name FROM expense_splits es
      JOIN users u ON u.id = es.user_id WHERE es.expense_id = ?
    `).all(expenseId);

    // Include AI insights in response
    expense.ai_parsed = {
      detected_category: Object.entries(categoryMap).find(([k]) => k === emoji)?.[0] ? emoji : 'Other',
      detected_friends: mentionedFriends.map(f => f.name),
      split_count: splitWith.length,
      per_person: splitAmount,
    };

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
