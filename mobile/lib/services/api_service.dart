import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static String? _token;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
  }

  static Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('token', token);
    } else {
      await prefs.remove('token');
    }
  }

  static String? get token => _token;

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  static Future<Map<String, dynamic>> get(String path) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.url}$path'),
      headers: _headers,
    );
    if (res.statusCode >= 400) {
      final body = jsonDecode(res.body);
      throw ApiException(body['error'] ?? 'Request failed', res.statusCode);
    }
    return jsonDecode(res.body);
  }

  static Future<List<dynamic>> getList(String path) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.url}$path'),
      headers: _headers,
    );
    if (res.statusCode >= 400) {
      final body = jsonDecode(res.body);
      throw ApiException(body['error'] ?? 'Request failed', res.statusCode);
    }
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> post(
      String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.url}$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    if (res.statusCode >= 400) {
      final resBody = jsonDecode(res.body);
      throw ApiException(resBody['error'] ?? 'Request failed', res.statusCode);
    }
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> delete(String path) async {
    final res = await http.delete(
      Uri.parse('${ApiConfig.url}$path'),
      headers: _headers,
    );
    if (res.statusCode >= 400) {
      final body = jsonDecode(res.body);
      throw ApiException(body['error'] ?? 'Request failed', res.statusCode);
    }
    return jsonDecode(res.body);
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}
