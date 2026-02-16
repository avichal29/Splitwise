import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/group.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../widgets/glass_card.dart';
import '../widgets/gradient_avatar.dart';
import '../widgets/gradient_button.dart';
import 'group_detail_screen.dart';

class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});

  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> {
  List<Group> _groups = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getList('/groups');
      if (!mounted) return;
      setState(() {
        _groups = data.map((g) => Group.fromJson(g)).toList();
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showCreateDialog() {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final searchCtrl = TextEditingController();
    List<User> searchResults = [];
    List<User> selectedMembers = [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isDark = Theme.of(ctx).brightness == Brightness.dark;
            return Container(
              margin: const EdgeInsets.only(top: 60),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surface900 : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Padding(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.surface600 : Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text('Create Group',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 20),
                      TextField(
                        controller: nameCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Group Name',
                          prefixIcon: Icon(Icons.group),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: descCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Description (optional)',
                          prefixIcon: Icon(Icons.description_outlined),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: searchCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Search members...',
                          prefixIcon: Icon(Icons.search),
                        ),
                        onChanged: (q) async {
                          if (q.length < 2) {
                            setModalState(() => searchResults = []);
                            return;
                          }
                          try {
                            final data = await ApiService.getList(
                                '/auth/users/search?q=$q');
                            setModalState(() {
                              searchResults = data
                                  .map((u) => User.fromJson(u))
                                  .where((u) => !selectedMembers
                                      .any((s) => s.id == u.id))
                                  .toList();
                            });
                          } catch (_) {}
                        },
                      ),
                      if (searchResults.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(top: 8),
                          constraints: const BoxConstraints(maxHeight: 150),
                          child: ListView.builder(
                            shrinkWrap: true,
                            itemCount: searchResults.length,
                            itemBuilder: (_, i) {
                              final u = searchResults[i];
                              return ListTile(
                                dense: true,
                                leading: GradientAvatar(name: u.name, size: 32, fontSize: 13),
                                title: Text(u.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                subtitle: Text(u.email, style: const TextStyle(fontSize: 12)),
                                trailing: const Icon(Icons.add_circle, color: AppColors.primary),
                                onTap: () {
                                  setModalState(() {
                                    selectedMembers.add(u);
                                    searchResults.removeAt(i);
                                    searchCtrl.clear();
                                  });
                                },
                              );
                            },
                          ),
                        ),
                      if (selectedMembers.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: selectedMembers
                              .map((u) => Chip(
                                    avatar: GradientAvatar(name: u.name, size: 24, fontSize: 10),
                                    label: Text(u.name),
                                    deleteIcon: const Icon(Icons.close, size: 16),
                                    onDeleted: () {
                                      setModalState(() => selectedMembers.remove(u));
                                    },
                                  ))
                              .toList(),
                        ),
                      ],
                      const SizedBox(height: 20),
                      GradientButton(
                        text: 'Create Group',
                        icon: Icons.add,
                        onPressed: () async {
                          if (nameCtrl.text.isEmpty) return;
                          try {
                            await ApiService.post('/groups', {
                              'name': nameCtrl.text,
                              'description': descCtrl.text,
                              'member_ids': selectedMembers.map((u) => u.id).toList(),
                            });
                            if (mounted) {
                              Navigator.pop(ctx);
                              _load();
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
              ),
            );
          },
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
              child: _groups.isEmpty
                  ? ListView(
                      children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                        Center(
                          child: Column(
                            children: [
                              Icon(Icons.group_outlined,
                                  size: 64, color: isDark ? AppColors.surface600 : Colors.grey.shade300),
                              const SizedBox(height: 16),
                              const Text('No groups yet',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 8),
                              Text('Create a group to start splitting!',
                                  style: TextStyle(color: isDark ? AppColors.surface400 : Colors.grey)),
                            ],
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _groups.length,
                      itemBuilder: (_, i) {
                        final g = _groups[i];
                        return GlassCard(
                          margin: const EdgeInsets.only(bottom: 12),
                          onTap: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => GroupDetailScreen(groupId: g.id),
                              ),
                            );
                            _load();
                          },
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  gradient: AppColors.getAvatarGradient(g.name),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Center(
                                  child: Text(
                                    g.name.isNotEmpty ? g.name[0].toUpperCase() : '?',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 20,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      g.name,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w700, fontSize: 16),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${g.memberCount} members • by ${g.createdByName}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppColors.surface400 : Colors.grey,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right, size: 20),
                            ],
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Group', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }
}
