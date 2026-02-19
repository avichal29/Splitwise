const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  try {
    const groups = db.prepare(`
      SELECT g.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups_ g
      JOIN group_members gm ON gm.group_id = g.id
      JOIN users u ON u.id = g.created_by
      WHERE gm.user_id = ?
      ORDER BY g.created_at DESC
    `).all(req.user.id);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const group = db.prepare(`
      SELECT g.*, u.name as created_by_name FROM groups_ g
      JOIN users u ON u.id = g.created_by
      WHERE g.id = ?
    `).get(req.params.id);

    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Verify membership
    const isMember = db.prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this group' });

    const members = db.prepare(`
      SELECT u.id, u.name, u.email FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ?
    `).all(req.params.id);

    const expenses = db.prepare(`
      SELECT e.*, u.name as paid_by_name FROM expenses e
      JOIN users u ON u.id = e.paid_by
      WHERE e.group_id = ?
      ORDER BY e.created_at DESC
    `).all(req.params.id);

    for (const expense of expenses) {
      expense.splits = db.prepare(`
        SELECT es.*, u.name as user_name FROM expense_splits es
        JOIN users u ON u.id = es.user_id
        WHERE es.expense_id = ?
      `).all(expense.id);
    }

    const settlements = db.prepare(`
      SELECT s.*, payer.name as paid_by_name, payee.name as paid_to_name
      FROM settlements s
      JOIN users payer ON payer.id = s.paid_by
      JOIN users payee ON payee.id = s.paid_to
      WHERE s.group_id = ?
      ORDER BY s.created_at DESC
    `).all(req.params.id);

    res.json({ ...group, members, expenses, settlements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, description, member_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    const result = db.prepare('INSERT INTO groups_ (name, description, created_by) VALUES (?, ?, ?)').run(name, description || '', req.user.id);
    const groupId = result.lastInsertRowid;

    const insertMember = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
    insertMember.run(groupId, req.user.id);

    if (member_ids && member_ids.length > 0) {
      const addMembers = db.transaction((ids) => {
        for (const id of ids) {
          if (id !== req.user.id) {
            insertMember.run(groupId, id);
          }
        }
      });
      addMembers(member_ids);
    }

    res.status(201).json({ id: groupId, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/members', auth, (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    // Verify requester is a member
    const isMember = db.prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this group' });

    // Only allow adding friends, not arbitrary users
    const isFriend = db.prepare(
      'SELECT 1 FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
    ).get(req.user.id, user_id, user_id, req.user.id);
    if (!isFriend) return res.status(400).json({ error: 'You can only add your friends to groups' });

    db.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)').run(req.params.id, user_id);
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const group = db.prepare('SELECT * FROM groups_ WHERE id = ? AND created_by = ?').get(req.params.id, req.user.id);
    if (!group) return res.status(403).json({ error: 'Only the creator can delete the group' });

    db.prepare('DELETE FROM groups_ WHERE id = ?').run(req.params.id);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
