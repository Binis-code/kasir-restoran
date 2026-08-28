# Persiapan Capacitor — KASA Sistem Kasir

Fondasi pembungkusan APK Android. **Toolchain Android sengaja belum dipasang** (fase stabilitas). Ikuti langkah ini saat siap build APK.

## Prasyarat (saat eksekusi nanti)
1. Node 20+ (sudah ada)
2. JDK 21 + Android Studio (SDK 34+)

## Langkah
```bash
cd client
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android
npx cap init "KASA" "id.kasa.kasir" --web-dir=dist
npx cap add android
pnpm build
npx cap sync android
npx cap open android   # build APK dari Android Studio
```

## Config
Salin `capacitor.config.example.ts` → `client/capacitor.config.ts` (sudah disesuaikan webDir + appId).

## Catatan
- Kamera barcode butuh secure context — di WebView Capacitor berjalan `https://localhost` default ✓
- Printer thermal Bluetooth (ESC/POS) menyusul via plugin BLE (`@capacitor-community/bluetooth-le`) — interface `EscPosBluetoothDriver` sudah disiapkan
- Service worker PWA tidak perlu aktif di dalam WebView (offline dijamin storage native)
