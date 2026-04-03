# Mobile Security (React Native / Expo)

All secrets in the JS bundle are extractable. Use a backend proxy for all third-party API calls requiring secret keys.

Use `expo-secure-store` or `react-native-keychain` for auth tokens — never `AsyncStorage` (unencrypted plaintext).

Validate and sanitize all deep link parameters. Never include sensitive data in deep link URLs.
