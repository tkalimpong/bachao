# Android で自分・家族が実際に使う

Bachao は **Vite + Capacitor** の Web アプリです。  
ブラウザで `npm run dev` の URL を開く方法は、PC と同じ Wi‑Fi がないと使えません。

**外出先や家族のスマホで使う**には、APK（単体アプリ）をビルドして各端末にインストールします。

---

## 使い方の2パターン

| 目的 | 設定 | 家族でデータ共有 |
|------|------|------------------|
| まず触ってみる | Firebase **なし** | ❌ 端末ごとにデモデータ（バラバラ） |
| 家族で本番利用 | Firebase **あり** | ✅ 同じ家計データをリアルタイム同期 |

---

## 家族で使う — 全体の流れ

1. **Firebase プロジェクトを1つ**用意する（代表者が1回だけ）
2. **Authentication で Google ログイン**を有効化し、**Firestore ルール**をデプロイ
3. **`.env.local`** に Firebase の設定を書く
4. PC で **APK をビルド**する（設定はビルド時に APK へ焼き込まれる）
5. できた APK を **家族全員の Android** に配布・インストールする
6. **代表者**が Google でサインイン → **Settings → Members** の招待コードを共有
7. **家族**は各自 Google でサインインし、Login 画面で **招待コード** を入力して参加

全員 **同じ `.env.local` でビルドした同じ APK** を入れ、**各自の Google アカウント**でログインします。

---

## 1. Firebase を用意する（家族共有のとき必須）

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** → Sign-in method → **Google** を有効化
3. **Firestore Database** を有効化
4. **Firestore セキュリティルールをデプロイ**（ログインに必須 — 下記「ルールのデプロイ」）
5. **プロジェクトの設定 → マイアプリ → ウェブアプリを追加**
6. 表示された設定値をコピー

リポジトリ直下で:

```powershell
copy .env.local.example .env.local
```

`.env.local` の各 `VITE_FIREBASE_*` を Firebase の値で埋める。

### ルールのデプロイ（ログインエラー `Firestore access denied` のとき必須）

**方法 A — Firebase CLI（推奨）**

```powershell
npm install -g firebase-tools
firebase login
firebase use hamromatka
firebase deploy --only firestore:rules
```

`hamromatka` は `.env.local` の `VITE_FIREBASE_PROJECT_ID` に合わせて変更。

**方法 B — コンソールに手動コピー**

1. Firebase Console → **Firestore Database** → **ルール**
2. リポジトリの [`firestore.rules`](../firestore.rules) をすべてコピーして貼り付け
3. **公開** をクリック

7. 動作確認（任意）:

```powershell
npm install
npm run dev
```

ブラウザで **Google サインイン** → 支出を追加し、Firestore コンソールにデータが出るか確認する。

### Android APK で Google ログイン

Capacitor APK では **リダイレクト方式** の Google サインインを使います。  
うまく戻ってこない場合は Firebase Console → Authentication → Settings →  
**Authorized domains** に `localhost` が含まれているか確認してください。

### セキュリティ

- **`firestore.rules`** により、ログイン済みメンバーだけが自分の家族グループを読み書きできます
- 招待コードは Settings → Members で Owner / Partner が確認・コピーできます

---

## 2. 必要なもの（APK ビルド）

1. **Node.js**（`npm install` 用）
2. **Android Studio**（JDK 込み）  
   https://developer.android.com/studio  
   インストール後、一度起動して SDK のセットアップを完了させる
3. **`.env.local`**（家族共有する場合は Firebase 設定済みのもの）

---

## 3. APK を作る

Firebase 設定を変えたあと、**必ずビルドし直す**（`npm run build` 時に `dist` → APK へ反映）。

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

## 4. 家族のスマホに入れる

1. `app-debug.apk` を **Google ドライブ / メール / USB** などで各端末へ送る
2. Android の設定で **「提供元不明のアプリ」** のインストールを許可（機種により名称が異なる）
3. APK をタップしてインストール

USB デバッグが有効な端末なら:

```powershell
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

**Google Play 公開は想定していません。** 個人・家族向けに APK を直接配る方法です。

---

## 5. 日常の使い方

- APK 内に Web アプリが同梱されるため、**PC の dev サーバーは不要**
- 初回起動時に **Google でサインイン**（家族参加時は招待コードを入力）
- 同期時は **Wi‑Fi またはモバイルデータ** が必要（Firestore のオフラインキャッシュで、一時的な圏外でも直近データは見られることが多い）
- 各端末は **自分の Google アカウント** でログインし、自分の名前で支出・収入を記録
- Owner / Partner は **Settings → Members** で他メンバーの役割を変更可能
- 誰かが入力すると、同じ家族グループに接続した全端末の画面が更新される

---

## 6. アプリを更新したあと

Web 部分（UI・機能）を変えたら、毎回:

```powershell
npm run cap:sync
```

そのあと **APK を再ビルド**し、家族の端末に **入れ直す**（上書きインストール可）。

Firebase の設定だけ変えた場合も、`.env.local` 反映のため **再ビルドが必要** です。

---

## ネットワーク・オフライン

| 状況 | 動き |
|------|------|
| Firebase 未設定 | 端末内のデモデータのみ（オフライン可・端末間非共有） |
| Firebase 設定済み | 同期にネットワークが必要。オフラインキャッシュあり |

開発用の `localhost:5173` は APK 利用時 **不要** です。

---

## EAS Build について

`eas build` は Expo プロジェクト向けのクラウドビルドです。  
このリポジトリは Capacitor 主体のため、**ローカル APK** が第一候補です。

クラウドで APK を作りたい場合は、[Expo + Capacitor の EAS 手順](https://docs.expo.dev/build-reference/build-with-capacitor/) を別途整える必要があります（`app.json` の `android.package` など）。

---

## クイックリファレンス（家族利用）

```powershell
# 初回
copy .env.local.example .env.local
# → Firebase の値を .env.local に記入

npm install
npm run android:apk
# → android\app\build\outputs\apk\debug\app-debug.apk を家族に配布

# コード更新後
npm run cap:sync
npm run android:apk
# → 各端末に再インストール
```
