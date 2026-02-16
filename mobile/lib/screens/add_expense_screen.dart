import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../models/group.dart';
import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/gradient_avatar.dart';
import '../widgets/gradient_button.dart';

class AddExpenseScreen extends StatefulWidget {
  const AddExpenseScreen({super.key});

  @override
  State<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends State<AddExpenseScreen> {
  final _descCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  List<Group> _groups = [];
  List<User> _friends = [];
  Group? _selectedGroup;
  String _splitType = 'equal';
  List<User> _splitWith = [];
  bool _loading = true;
  bool _submitting = false;

  final _categories = [
    {'icon': Icons.restaurant, 'label': 'Food', 'color': Colors.orange},
    {'icon': Icons.directions_car, 'label': 'Transport', 'color': Colors.blue},
    {'icon': Icons.home, 'label': 'Rent', 'color': Colors.purple},
    {'icon': Icons.movie, 'label': 'Entertainment', 'color': Colors.pink},
    {'icon': Icons.shopping_bag, 'label': 'Shopping', 'color': Colors.teal},
    {'icon': Icons.more_horiz, 'label': 'Other', 'color': Colors.grey},
  ];
  int _selectedCategory = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        ApiService.getList('/groups'),
        ApiService.getList('/friends'),
      ]);
      if (!mounted) return;
      setState(() {
        _groups = (results[0] as List).map((g) => Group.fromJson(g)).toList();
        _friends = (results[1] as List).map((u) => User.fromJson(u)).toList();
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadGroupMembers(Group group) async {
    try {
      final data = await ApiService.get('/groups/${group.id}');
      final detail = Group.fromJson(data);
      final me = context.read<AuthProvider>().user;
      if (!mounted) return;
      setState(() {
        _splitWith = detail.members?.where((m) => m.id != me?.id).toList() ?? [];
      });
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (_descCtrl.text.isEmpty || _amountCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill description and amount')),
      );
      return;
    }
    final amount = double.tryParse(_amountCtrl.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid amount')),
      );
      return;
    }
    if (_splitWith.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one person to split with')),
      );
      return;
    }

    setState(() => _submitting = true);
    final me = context.read<AuthProvider>().user!;

    // Include self in splits
    final allSplitters = [me, ..._splitWith];
    final splits = allSplitters.map((u) => {'user_id': u.id}).toList();

    try {
      await ApiService.post('/expenses', {
        'description': '${_categories[_selectedCategory]['label']}: ${_descCtrl.text}',
        'amount': amount,
        'group_id': _selectedGroup?.id,
        'split_type': _splitType,
        'splits': splits,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Expense added!'),
            backgroundColor: AppColors.primary,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
    if (mounted) setState(() => _submitting = false);
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    _amountCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Add Expense')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Add Expense')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category picker
            const Text('Category', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) {
                  final cat = _categories[i];
                  final selected = _selectedCategory == i;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedCategory = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 70,
                      decoration: BoxDecoration(
                        color: selected
                            ? (cat['color'] as Color).withOpacity(0.15)
                            : isDark
                                ? AppColors.surface800.withOpacity(0.5)
                                : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: selected
                              ? (cat['color'] as Color)
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(cat['icon'] as IconData,
                              color: cat['color'] as Color, size: 24),
                          const SizedBox(height: 6),
                          Text(
                            cat['label'] as String,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                              color: selected ? cat['color'] as Color : null,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),

            // Description
            TextField(
              controller: _descCtrl,
              decoration: const InputDecoration(
                labelText: 'Description',
                prefixIcon: Icon(Icons.edit_outlined),
              ),
            ),
            const SizedBox(height: 16),

            // Amount
            TextField(
              controller: _amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
              decoration: const InputDecoration(
                labelText: 'Amount',
                prefixIcon: Icon(Icons.attach_money, size: 28),
              ),
            ),
            const SizedBox(height: 24),

            // Group selector
            const Text('Group (optional)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 8),
            DropdownButtonFormField<Group?>(
              value: _selectedGroup,
              decoration: const InputDecoration(prefixIcon: Icon(Icons.group_outlined)),
              hint: const Text('No group (personal)'),
              items: [
                const DropdownMenuItem<Group?>(value: null, child: Text('No group')),
                ..._groups.map((g) => DropdownMenuItem(value: g, child: Text(g.name))),
              ],
              onChanged: (g) {
                setState(() {
                  _selectedGroup = g;
                  _splitWith = [];
                });
                if (g != null) _loadGroupMembers(g);
              },
            ),
            const SizedBox(height: 24),

            // Split with
            const Text('Split With', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 8),
            if (_selectedGroup == null) ...[
              // Show friends to pick from
              if (_friends.isEmpty)
                Text('Add friends first to split expenses',
                    style: TextStyle(color: isDark ? AppColors.surface400 : Colors.grey))
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _friends.map((f) {
                    final selected = _splitWith.any((u) => u.id == f.id);
                    return FilterChip(
                      avatar: GradientAvatar(name: f.name, size: 24, fontSize: 10),
                      label: Text(f.name),
                      selected: selected,
                      selectedColor: AppColors.primary.withOpacity(0.2),
                      checkmarkColor: AppColors.primary,
                      onSelected: (val) {
                        setState(() {
                          if (val) {
                            _splitWith.add(f);
                          } else {
                            _splitWith.removeWhere((u) => u.id == f.id);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
            ] else ...[
              // Show group members
              if (_splitWith.isEmpty)
                Text('Loading group members...',
                    style: TextStyle(color: isDark ? AppColors.surface400 : Colors.grey))
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _splitWith.map((m) => Chip(
                    avatar: GradientAvatar(name: m.name, size: 24, fontSize: 10),
                    label: Text(m.name),
                  )).toList(),
                ),
            ],
            const SizedBox(height: 24),

            // Split type
            const Text('Split Type', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'equal', label: Text('Equal'), icon: Icon(Icons.drag_handle, size: 16)),
                ButtonSegment(value: 'exact', label: Text('Exact'), icon: Icon(Icons.pin, size: 16)),
                ButtonSegment(value: 'percentage', label: Text('%'), icon: Icon(Icons.percent, size: 16)),
              ],
              selected: {_splitType},
              onSelectionChanged: (v) => setState(() => _splitType = v.first),
              style: ButtonStyle(
                backgroundColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return AppColors.primary.withOpacity(0.15);
                  }
                  return null;
                }),
              ),
            ),
            const SizedBox(height: 32),

            GradientButton(
              text: 'Add Expense',
              icon: Icons.add,
              loading: _submitting,
              onPressed: _submit,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
