import 'package:flutter/foundation.dart' show kIsWeb, TargetPlatform, defaultTargetPlatform;

class ApiConfig {
  static String get url {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:5000/api';
      case TargetPlatform.iOS:
        return 'http://localhost:5000/api';
      default:
        return 'http://localhost:5000/api';
    }
  }
}
