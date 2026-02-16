import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../widgets/glass_card.dart';
import '../widgets/gradient_avatar.dart';
import '../widgets/gradient_button.dart';

class FriendsScreen extends StatefulWidget {
  const FriendsScreen({super.key});

  @override
  State<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> {
  List<User> _friends = [];
  List<User> _searchResults = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getList('/friends');
      if (!mounted) return;
      setState(() {
        _friends = data.map((f) => User.fromJson(f)).toList();
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _search(String q) async {
    if (q.length < 2) {
      setState(() => _searchResults = []);
      return;
    }
    try {
      final data = await ApiService.getList('/auth/users/search?q=$q');
      if (!mounted) return;
      setState(() {
        _searchResults = data
            .map((u) => User.fromJson(u))
            .where((u) => !_friends.any((f) => f.id == u.id))
            .toList();
      });
    } catch (_) {}
  }

  Future<void> _addFriend(User user) async {
    try {
      await ApiService.post('/friends', {'friend_id': user.id});
      _searchCtrl.clear();
      setState(() => _searchResults = []);
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${user.name} added as friend!'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _removeFriend(User user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Friend'),
        content: Text('Remove ${user.name} from your friends?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      await ApiService.delete('/friends/${user.id}');
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  void _showSettleDialog(User friend) {
    final amountCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Container(
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
                Row(
                  children: [
                    GradientAvatar(name: friend.name, size: 44),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Settle Up With',
                            style: TextStyle(fontSize: 13, color: AppColors.surface400)),
                        Text(friend.name,
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: amountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  autofocus: true,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                  decoration: const InputDecoration(
                    labelText: 'Amount',
                    prefixIcon: Icon(Icons.attach_money, size: 28),
                  ),
                ),
                const SizedBox(height: 20),
                GradientButton(
                  text: 'Settle',
                  icon: Icons.handshake,
                  onPressed: () async {
                    final amount = double.tryParse(amountCtrl.text);
                    if (amount == null || amount <= 0) return;
                    try {
                      await ApiService.post('/settlements', {
                        'paid_to': friend.id,
                        'amount': amount,
                      });
                      if (mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Settlement recorded!'),
                            backgroundColor: AppColors.primary,
                          ),
                        );
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(e.toString())),
                        );
                      }
                    }
                  },
                ),
              ],
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
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  // Search bar
                  TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Search users to add...',
                      prefixIcon: const Icon(Icons.person_search),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close),
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() => _searchResults = []);
                              },
                            )
                          : null,
                    ),
                    onChanged: _search,
                  ),

                  // Search results
                  if (_searchResults.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    ...(_searchResults.map((u) => GlassCard(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          onTap: () => _addFriend(u),
                          child: Row(
                            children: [
                              GradientAvatar(name: u.name, size: 36),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(u.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                    Text(u.email, style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.surface400 : Colors.grey,
                                    )),
                                  ],
                                ),
                              ),
                              const Icon(Icons.person_add, color: AppColors.primary, size: 20),
                            ],
                          ),
                        ))),
                  ],

                  const SizedBox(height: 20),

                  // Friends list
                  if (_friends.isEmpty)
                    Padding(
                      padding: EdgeInsets.only(top: MediaQuery.of(context).size.height * 0.15),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(Icons.people_outline, size: 64,
                                color: isDark ? AppColors.surface600 : Colors.grey.shade300),
                            const SizedBox(height: 16),
                            const Text('No friends yet',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            Text('Search for users above to add friends',
                                style: TextStyle(color: isDark ? AppColors.surface400 : Colors.grey)),
                          ],
                        ),
                      ),
                    )
                  else ...[
                    Text(
                      'Friends (${_friends.length})',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 12),
                    ...(_friends.map((f) => GlassCard(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            children: [
                              GradientAvatar(name: f.name, size: 44),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(f.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                    Text(f.email, style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.surface400 : Colors.grey,
                                    )),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.handshake_outlined, color: AppColors.primary),
                                tooltip: 'Settle Up',
                                onPressed: () => _showSettleDialog(f),
                              ),
                              IconButton(
                                icon: Icon(Icons.person_remove_outlined, color: Colors.red.shade300, size: 20),
                                tooltip: 'Remove',
                                onPressed: () => _removeFriend(f),
                              ),
                            ],
                          ),
                        ))),
                  ],
                ],
              ),
            ),
    );
  }
}
