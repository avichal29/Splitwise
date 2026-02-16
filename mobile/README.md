# Splitwise Mobile App (Flutter)

Cross-platform iOS & Android app for the Splitwise expense-splitting application.

## Features
- 🔐 Login / Register with JWT auth
- 📊 Dashboard with balance overview, group cards, recent expenses
- 👥 Groups — create, view details, add members, settle up
- 💸 Add Expense — category picker, group selector, split options (equal/exact/%)
- 📋 Activity — expenses & settlements timeline
- 🤝 Friends — search, add, remove, settle up
- 🌙 Dark / Light mode with persistence
- 🎨 Gen-Z styling — gradients, glassmorphism, animations

## Prerequisites
- **Flutter SDK** 3.24+ (`flutter --version`)
- **Android Studio** (for Android builds) or **Xcode** (for iOS builds)
- **Backend server** running on port 5000 (see `../server/`)

## API Configuration
Edit `lib/config/api_config.dart` to set your server URL:
- **Android emulator**: `http://10.0.2.2:5000/api` (default)
- **iOS simulator**: `http://localhost:5000/api`
- **Physical device**: Use your machine's LAN IP, e.g. `http://192.168.1.100:5000/api`

## Setup & Run

```bash
# Install dependencies
flutter pub get

# Run on Android
flutter run

# Run on iOS (macOS only)
flutter run -d ios

# Run on Chrome (web)
flutter run -d chrome

# Build release APK
flutter build apk --release

# Build iOS release (macOS only)
flutter build ios --release
```

## Project Structure
```
lib/
├── config/
│   ├── api_config.dart       # Server URL config
│   └── theme.dart            # App theme, colors, gradients
├── models/
│   ├── user.dart             # User model
│   └── group.dart            # Group, Expense, Settlement, Balance models
├── providers/
│   ├── auth_provider.dart    # Auth state management
│   └── theme_provider.dart   # Dark/light mode state
├── services/
│   └── api_service.dart      # HTTP client with JWT
├── screens/
│   ├── login_screen.dart
│   ├── register_screen.dart
│   ├── home_screen.dart      # Bottom nav shell
│   ├── dashboard_screen.dart
│   ├── groups_screen.dart
│   ├── group_detail_screen.dart
│   ├── add_expense_screen.dart
│   ├── activity_screen.dart
│   └── friends_screen.dart
├── widgets/
│   ├── glass_card.dart       # Glassmorphism card
│   ├── gradient_avatar.dart  # Dynamic gradient avatars
│   └── gradient_button.dart  # Gradient CTA button
└── main.dart                 # App entry point
