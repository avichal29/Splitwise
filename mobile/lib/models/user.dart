class User {
  final int id;
  final String name;
  final String email;
  final String? createdAt;

  User({required this.id, required this.name, required this.email, this.createdAt});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'email': email};
}
