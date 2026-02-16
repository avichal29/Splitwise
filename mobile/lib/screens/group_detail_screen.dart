import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../models/group.dart';
import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/glass_card.dart';
import '../widgets/gradient_avatar.dart';
import '../widgets/gradient_button.dart';

class GroupDetailScreen extends StatefulWidget {
  final int groupId;
  const GroupDetailScreen({super.key, required this.groupId});

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen>
    with SingleTickerProviderStateMixin {
  Group? _group;
  bool _loading = true;
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.get('/groups/${widget.groupId}');
      if (!mounted) return;
      setState(() {
        _group = Group.fromJson(data);
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddMember() {
    final searchCtrl = TextEditingController();
    List<User> results = [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return StatefulBuilder(
          builder: (ctx, setModalState) => Container(
            margin: const EdgeInsets.only(top: 100),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surface900 : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Padding(
              padding: EdgeInsets.only(
                left: 20, right: 20, top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surface600 : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Add Member', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: searchCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Search users...',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: (q) async {
                      if (q.length < 2) {
                        setModalState(() => results = []);
                        return;
                      }
                      try {
                        final data = await ApiService.getList('/auth/users/search?q=$q');
                        setModalState(() {
                          results = data.map((u) => User.fromJson(u)).where(
                            (u) => !(_group?.members?.any((m) => m.id == u.id) ?? false),
                          ).toList();
                        });
                      } catch (_) {}
                    },
                  ),
                  if (results.isNotEmpty)
                    Container(
                      constraints: const BoxConstraints(maxHeight: 250),
                      margin: const EdgeInsets.only(top: 8),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: results.length,
                        itemBuilder: (_, i) {
                          final u = results[i];
                          return ListTile(
                            leading: GradientAvatar(name: u.name, size: 36),
                            title: Text(u.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text(u.email, style: const TextStyle(fontSize: 12)),
                            trailing: const Icon(Icons.person_add, color: AppColors.primary),
                            onTap: () async {
                              try {
                                await ApiService.post('/groups/${widget.groupId}/members', {'user_id': u.id});
                                if (mounted) {
                                  Navigator.pop(ctx);
                                  _load();
                                }
                              } catch (e) {
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                                }
                              }
                            },
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showSettleDialog() {
    final amountCtrl = TextEditingController();
    User? selectedUser;

    final otherMembers = _group?.members?.where(
      (m) => m.id != context.read<AuthProvider>().user?.id,
    ).toList() ?? [];

    if (otherMembers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No other members to settle with')),
      );
      return;
    }

    selectedUser = otherMembers.first;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return StatefulBuilder(
          builder: (ctx, setModalState) => Container(
            margin: const EdgeInsets.only(top: 100),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surface900 : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Padding(
              padding: EdgeInsets.only(
                left: 20, right: 20, top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surface600 : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Settle Up', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<User>(
                    value: selectedUser,
                    decoration: const InputDecoration(labelText: 'Pay to'),
                    items: otherMembers.map((u) => DropdownMenuItem(
                      value: u,
                      child: Row(
                        children: [
                          GradientAvatar(name: u.name, size: 24, fontSize: 10),
                          const SizedBox(width: 8),
                          Text(u.name),
                        ],
                      ),
                    )).toList(),
                    onChanged: (u) => setModalState(() => selectedUser = u),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Amount',
                      prefixIcon: Icon(Icons.attach_money),
                    ),
                  ),
                  const SizedBox(height: 20),
                  GradientButton(
                    text: 'Settle',
                    icon: Icons.handshake,
                    onPressed: () async {
                      final amount = double.tryParse(amountCtrl.text);
                      if (amount == null || amount <= 0 || selectedUser == null) return;
                      try {
                        await ApiService.post('/settlements', {
                          'paid_to': selectedUser!.id,
                          'amount': amount,
                          'group_id': widget.groupId,
                        });
                        if (mounted) {
                          Navigator.pop(ctx);
                          _load();
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                        }
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(_group?.name ?? 'Group'),
        actions: [
          IconButton(icon: const Icon(Icons.person_add_outlined), onPressed: _showAddMember),
          IconButton(icon: const Icon(Icons.handshake_outlined), onPressed: _showSettleDialog),
        ],
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Members'),
            Tab(text: 'Expenses'),
            Tab(text: 'Settlements'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _load,
              child: TabBarView(
                controller: _tabCtrl,
                children: [
                  // Members tab
                  ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _group?.members?.length ?? 0,
                    itemBuilder: (_, i) {
                      final m = _group!.members![i];
                      return GlassCard(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Row(
                          children: [
                            GradientAvatar(name: m.name, size: 40),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(m.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                  Text(m.email, style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? AppColors.surface400 : Colors.grey,
                                  )),
                                ],
                              ),
                            ),
                            if (m.id == _group!.createdBy)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text('Admin', style: TextStyle(
                                  color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w600,
                                )),
                              ),
                          ],
                        ),
                      );
                    },
                  ),

                  // Expenses tab
                  _group?.expenses?.isEmpty ?? true
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.receipt_long, size: 48,
                                  color: isDark ? AppColors.surface600 : Colors.grey.shade300),
                              const SizedBox(height: 12),
                              const Text('No expenses yet'),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _group!.expenses!.length,
                          itemBuilder: (_, i) {
                            final e = _group!.expenses![i];
                            return GlassCard(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 36, height: 36,
                                        decoration: BoxDecoration(
                                          color: AppColors.primary.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(Icons.receipt, color: AppColors.primary, size: 18),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(e.description, style: const TextStyle(fontWeight: FontWeight.w600)),
                                            Text('Paid by ${e.paidByName}', style: TextStyle(
                                              fontSize: 12,
                                              color: isDark ? AppColors.surface400 : Colors.grey,
                                            )),
                                          ],
                                        ),
                                      ),
                                      Text('\$${e.amount.toStringAsFixed(2)}',
                                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                                    ],
                                  ),
                                  if (e.splits.isNotEmpty) ...[
                                    const SizedBox(height: 10),
                                    const Divider(height: 1),
                                    const SizedBox(height: 8),
                                    ...e.splits.map((s) => Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 2),
                                      child: Row(
                                        children: [
                                          GradientAvatar(name: s.userName, size: 20, fontSize: 8),
                                          const SizedBox(width: 8),
                                          Text(s.userName, style: const TextStyle(fontSize: 13)),
                                          const Spacer(),
                                          Text('\$${s.amount.toStringAsFixed(2)}',
                                              style: TextStyle(fontSize: 13, color: isDark ? AppColors.surface300 : Colors.grey.shade700)),
                                        ],
                                      ),
                                    )),
                                  ],
                                ],
                              ),
                            );
                          },
                        ),

                  // Settlements tab
                  _group?.settlements?.isEmpty ?? true
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.handshake, size: 48,
                                  color: isDark ? AppColors.surface600 : Colors.grey.shade300),
                              const SizedBox(height: 12),
                              const Text('No settlements yet'),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _group!.settlements!.length,
                          itemBuilder: (_, i) {
                            final s = _group!.settlements![i];
                            return GlassCard(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  GradientAvatar(name: s.paidByName, size: 36),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.arrow_forward, size: 16, color: AppColors.primary),
                                  const SizedBox(width: 8),
                                  GradientAvatar(name: s.paidToName, size: 36),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('${s.paidByName} → ${s.paidToName}',
                                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                  Text('\$${s.amount.toStringAsFixed(2)}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.primary,
                                      )),
                                ],
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
    );
  }
}
