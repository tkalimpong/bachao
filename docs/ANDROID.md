# Android で外出先から使う

Bachao は **Vite + Capacitor** の Web アプリです。  
`npm run dev` の URL をスマホで開く方法は、PC と同じ Wi‑Fi がないと使えません。

**外出先で使う**には、スマホに入れる **APK（単体アプリ）** を作ってインストールします。

EAS Build は Expo 向けの仕組みが中心で、この構成では **Capacitor + Android Studio（または Gradle）** の方が素直です。

---

## 必要なもの（初回だけ）

1. **Android Studio**（JDK 込み）  
   https://developer.android.com/studio  
   インストール後、一度起動して SDK のセットアップを完了させる。

2. **`.env.local`**（Firebase 同期を使う場合）  
   ```powershell
   copy .env.local.example .env.local
   ```  
   Firebase の値を入れてからビルドする（`npm run build` 時に `dist` に焼き込まれます）。

---

## APK を作る（おすすめ）

### 方法 A: Android Studio（GUI）

```powershell
npm run cap:sync
npm run cap:open
```

Android Studio が開いたら:

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. 完了後 **Locate** から APK を取り出す  
   通常: `android\app\build\outputs\apk\debug\app-debug.apk`

### 方法 B: コマンド（JAVA_HOME が通っている場合）

```powershell
npm run android:apk
```

同じく `android\app\build\outputs\apk\debug\app-debug.apk` ができます。

---

## スマホに入れる

1. APK を Google ドライブ / メール / USB で端末へ送る  
2. 設定で「提供元不明のアプリ」のインストールを許可（機種により名称が異なります）  
3. APK をタップしてインストール  

USB デバッグが有効なら:

```powershell
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

---

## コードを直したあと

Web 部分を変えたら、毎回:

```powershell
npm run cap:sync
```

そのあと APK を再ビルドして、スマホに入れ直します。

---

## ネットワークについて

| 状況 | 動き |
|------|------|
| Firebase 未設定 | 端末内のデモデータのみ（オフライン可） |
| Firebase 設定済み | 同期には **モバイルデータ / Wi‑Fi** が必要。Firestore のオフラインキャッシュで、一時的な圏外でも直近データは見られることが多い |

開発用の `localhost:5173` は **不要** です。APK 内に `dist` が同梱されます。

---

## EAS Build について

`eas build` は Expo プロジェクト向けのクラウドビルドです。  
このリポジトリは Capacitor 主体のため、外出先利用の第一候補は **上記のローカル APK** です。

クラウドで APK を作りたい場合は、[Expo + Capacitor の EAS 手順](https://docs.expo.dev/build-reference/build-with-capacitor/) を別途整える必要があります（`app.json` の `android.package` など）。
