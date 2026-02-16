import 'user.dart';

class Group {
  final int id;
  final String name;
  final String description;
  final int createdBy;
  final String createdByName;
  final int memberCount;
  final String? createdAt;
  final List<User>? members;
  final List<Expense>? expenses;
  final List<Settlement>? settlements;

  Group({
    required this.id,
    required this.name,
    this.description = '',
    required this.createdBy,
    this.createdByName = '',
    this.memberCount = 0,
    this.createdAt,
    this.members,
    this.expenses,
    this.settlements,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      createdBy: json['created_by'] ?? 0,
      createdByName: json['created_by_name'] ?? '',
      memberCount: json['member_count'] ?? 0,
      createdAt: json['created_at'],
      members: json['members'] != null
          ? (json['members'] as List).map((m) => User.fromJson(m)).toList()
          : null,
      expenses: json['expenses'] != null
          ? (json['expenses'] as List).map((e) => Expense.fromJson(e)).toList()
          : null,
      settlements: json['settlements'] != null
          ? (json['settlements'] as List)
              .map((s) => Settlement.fromJson(s))
              .toList()
          : null,
    );
  }
}

class Expense {
  final int id;
  final String description;
  final double amount;
  final int paidBy;
  final String paidByName;
  final int? groupId;
  final String? groupName;
  final String splitType;
  final String? createdAt;
  final List<ExpenseSplit> splits;

  Expense({
    required this.id,
    required this.description,
    required this.amount,
    required this.paidBy,
    this.paidByName = '',
    this.groupId,
    this.groupName,
    this.splitType = 'equal',
    this.createdAt,
    this.splits = const [],
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'],
      description: json['description'] ?? '',
      amount: (json['amount'] as num).toDouble(),
      paidBy: json['paid_by'] ?? 0,
      paidByName: json['paid_by_name'] ?? '',
      groupId: json['group_id'],
      groupName: json['group_name'],
      splitType: json['split_type'] ?? 'equal',
      createdAt: json['created_at'],
      splits: json['splits'] != null
          ? (json['splits'] as List)
              .map((s) => ExpenseSplit.fromJson(s))
              .toList()
          : [],
    );
  }
}

class ExpenseSplit {
  final int id;
  final int expenseId;
  final int userId;
  final String userName;
  final double amount;

  ExpenseSplit({
    required this.id,
    required this.expenseId,
    required this.userId,
    this.userName = '',
    required this.amount,
  });

  factory ExpenseSplit.fromJson(Map<String, dynamic> json) {
    return ExpenseSplit(
      id: json['id'],
      expenseId: json['expense_id'] ?? 0,
      userId: json['user_id'] ?? 0,
      userName: json['user_name'] ?? '',
      amount: (json['amount'] as num).toDouble(),
    );
  }
}

class Settlement {
  final int id;
  final int paidBy;
  final String paidByName;
  final int paidTo;
  final String paidToName;
  final double amount;
  final int? groupId;
  final String? groupName;
  final String? createdAt;

  Settlement({
    required this.id,
    required this.paidBy,
    this.paidByName = '',
    required this.paidTo,
    this.paidToName = '',
    required this.amount,
    this.groupId,
    this.groupName,
    this.createdAt,
  });

  factory Settlement.fromJson(Map<String, dynamic> json) {
    return Settlement(
      id: json['id'],
      paidBy: json['paid_by'] ?? 0,
      paidByName: json['paid_by_name'] ?? '',
      paidTo: json['paid_to'] ?? 0,
      paidToName: json['paid_to_name'] ?? '',
      amount: (json['amount'] as num).toDouble(),
      groupId: json['group_id'],
      groupName: json['group_name'],
      createdAt: json['created_at'],
    );
  }
}

class Balance {
  final int userId;
  final String userName;
  final double amount;

  Balance({required this.userId, required this.userName, required this.amount});

  factory Balance.fromJson(Map<String, dynamic> json) {
    return Balance(
      userId: json['user_id'],
      userName: json['user_name'] ?? '',
      amount: (json['amount'] as num).toDouble(),
    );
  }
}

class BalanceSummary {
  final List<Balance> balances;
  final double totalOwedToYou;
  final double totalYouOwe;
  final double netBalance;

  BalanceSummary({
    required this.balances,
    required this.totalOwedToYou,
    required this.totalYouOwe,
    required this.netBalance,
  });

  factory BalanceSummary.fromJson(Map<String, dynamic> json) {
    return BalanceSummary(
      balances: (json['balances'] as List)
          .map((b) => Balance.fromJson(b))
          .toList(),
      totalOwedToYou: (json['total_owed_to_you'] as num).toDouble(),
      totalYouOwe: (json['total_you_owe'] as num).toDouble(),
      netBalance: (json['net_balance'] as num).toDouble(),
    );
  }
}
