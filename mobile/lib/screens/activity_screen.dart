import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../models/group.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/glass_card.dart';
import '../widgets/gradient_avatar.dart';

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen>
    with SingleTickerProviderStateMixin {
  List<Expense> _expenses = [];
  List<Settlement> _settlements = [];
  bool _loading = true;
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
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
      final results = await Future.wait([
        ApiService.getList('/expenses'),
        ApiService.getList('/settlements'),
      ]);
      if (!mounted) return;
      setState(() {
        _expenses = (results[0] as List).map((e) => Expense.fromJson(e)).toList();
        _settlements = (results[1] as List).map((s) => Settlement.fromJson(s)).toList();
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final me = context.watch<AuthProvider>().user;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
          child: TabBar(
            controller: _tabCtrl,
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: isDark ? AppColors.surface400 : Colors.grey,
            tabs: const [
              Tab(text: 'Expenses'),
              Tab(text: 'Settlements'),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : TabBarView(
                  controller: _tabCtrl,
                  children: [
                    // Expenses
                    _expenses.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.receipt_long, size: 56,
                                    color: isDark ? AppColors.surface600 : Colors.grey.shade300),
                                const SizedBox(height: 12),
                                const Text('No expenses yet',
                                    style: TextStyle(fontWeight: FontWeight.w600)),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            color: AppColors.primary,
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _expenses.length,
                              itemBuilder: (_, i) {
                                final e = _expenses[i];
                                final isPayer = e.paidBy == me?.id;
                                return GlassCard(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          gradient: isPayer
                                              ? AppColors.primaryGradient
                                              : LinearGradient(colors: [
                                                  Colors.red.shade300,
                                                  Colors.orange.shade300,
                                                ]),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Icon(
                                          Icons.receipt_long,
                                          color: Colors.white,
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              e.description,
                                              style: const TextStyle(fontWeight: FontWeight.w600),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              isPayer
                                                  ? 'You paid'
                                                  : 'Paid by ${e.paidByName}',
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: isDark
                                                    ? AppColors.surface400
                                                    : Colors.grey.shade600,
                                              ),
                                            ),
                                            if (e.groupName != null)
                                              Text(
                                                e.groupName!,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: AppColors.primary.withOpacity(0.7),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            '\$${e.amount.toStringAsFixed(2)}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 16,
                                            ),
                                          ),
                                          Text(
                                            e.splitType,
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isDark
                                                  ? AppColors.surface500
                                                  : Colors.grey.shade400,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),

                    // Settlements
                    _settlements.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.handshake, size: 56,
                                    color: isDark ? AppColors.surface600 : Colors.grey.shade300),
                                const SizedBox(height: 12),
                                const Text('No settlements yet',
                                    style: TextStyle(fontWeight: FontWeight.w600)),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            color: AppColors.primary,
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _settlements.length,
                              itemBuilder: (_, i) {
                                final s = _settlements[i];
                                final isPayer = s.paidBy == me?.id;
                                return GlassCard(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  child: Row(
                                    children: [
                                      GradientAvatar(name: s.paidByName, size: 38),
                                      const SizedBox(width: 8),
                                      Icon(Icons.arrow_forward,
                                          size: 16, color: AppColors.primary),
                                      const SizedBox(width: 8),
                                      GradientAvatar(name: s.paidToName, size: 38),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              isPayer
                                                  ? 'You paid ${s.paidToName}'
                                                  : '${s.paidByName} paid you',
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.w600, fontSize: 13),
                                            ),
                                            if (s.groupName != null)
                                              Text(
                                                s.groupName!,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: AppColors.primary.withOpacity(0.7),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        '\$${s.amount.toStringAsFixed(2)}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                  ],
                ),
        ),
      ],
    );
  }
}
