# building the Mobile App (APK)

To ensure the app works correctly (Offline Mode, Database, Notifications), you **MUST** follow these steps every time you want to create a new APK.

## Step 1: Run the Build Script

Double-click the **`build_mobile_app.bat`** file in your project folder (or run it from the terminal).

This script will:

1. **Build** the web application (creating the `dist` folder) with all your environment variables baked in.
2. **Sync** the changes to the Android project folder.

> **Important:** If you skip this step and just run "Play" in Android Studio, the app will **NOT** have the latest code or database settings!

## Step 2: Open Android Studio

Open the `android` folder in Android Studio as usual.

## Step 3: Run / Build APK

- Connect your device.
- Click the **Run** (Play) button.
- Or go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

---

### Troubleshooting

- If the app shows a white screen, check Logcat in Android Studio for errors.
- If data doesn't sync, ensure your phone has internet access initially to download the database schema.
