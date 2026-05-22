# iPhone・PC ブラウザ — Web 版（Firebase Hosting）

Hamro Gullak は **同じ Web アプリ** を Android APK にも、インターネット上にも載せられます。

| 端末 | 使い方 |
|------|--------|
| **Android** | APK（[docs/ANDROID.md](./ANDROID.md)） |
| **iPhone / iPad** | この Web 版 URL を Safari で開く |
| **PC ブラウザ** | 同じ URL（開発時は `npm run dev`） |

**Android と iPhone は同じ Firebase プロジェクト・同じ招待コード** で、家計データを共有できます。

---

## 家族で使う — 全体の流れ

1. 代表者が **Firebase プロジェクトを 1 つ**用意（Android と共通）
2. `.env.local` に Firebase 設定を書く（Android APK と **同じ内容**）
3. PC で **Hosting にデプロイ** → URL ができる（例: `https://your-project-id.web.app`）
4. **Android 家族** … 同じ Firebase 設定でビルドした APK をインストール
5. **iPhone 家族** … 上記 URL を Safari で開く（必要なら「ホーム画面に追加」）
6. 代表者が Google サインイン → **Settings → Members** の招待コードを共有
7. 家族は各自 Google でサインイン + 招待コードで参加

---

## 1. 前提（Android 手順と共通）

Web 版も **Firebase Auth + Firestore** が必須です。まだの場合は [docs/ANDROID.md](./ANDROID.md) の「1. Firebase を用意する」を先に完了してください。

- Google ログイン有効
- Firestore 有効
- `firestore.rules` デプロイ済み
- `.env.local` の `VITE_FIREBASE_*` が実際の値

---

## 2. Firebase CLI の準備（1 回）

プロジェクトに同梱されている CLI を使います（グローバル install 不要）:

```powershell
npm install
npx firebase login
```

プロジェクトを紐付け（`your-project-id` は `.env.local` の `VITE_FIREBASE_PROJECT_ID`）:

```powershell
cd C:\Users\tsuyo\hamro-gullak
npx firebase use your-project-id
```

初回は `.firebaserc` が自動作成されます。

---

## 3. Hosting を有効化（1 回）

1. [Firebase Console](https://console.firebase.google.com/) → 対象プロジェクト
2. 左メニュー **Hosting** → **始める**
3. ウィザードはスキップしてよい（CLI からデプロイする）

---

## 4. 認証まわりの確認（1 回）

### 承認済みドメイン

Firebase Console → **Authentication** → **Settings** → **Authorized domains**

次が含まれていることを確認（Hosting 有効化後、通常は自動追加）:

- `localhost`
- `your-project-id.web.app`
- `your-project-id.firebaseapp.com`

### Google Drive バックアップ（Plus・任意）

Android と同様、Google Cloud Console で **Google Drive API** を有効化。  
詳細は [docs/ANDROID.md](./ANDROID.md) の「Google Drive バックアップ」を参照。

---

## 5. ビルドしてデプロイ

リポジトリ直下で:

```powershell
npm install
npm run web:deploy
```

内部では `npm run build` のあと **Hosting + Firestore ルール** をデプロイします。

初回デプロイ後、CLI または Firebase Console → Hosting に表示される URL を控えます:

```text
https://your-project-id.web.app
```

（`firebaseapp.com` ドメインでも同じ内容が開きます）

---

## 6. iPhone 家族への渡し方

1. URL を LINE / メールなどで送る
2. **Safari** で開く（Chrome でも可。ホーム画面追加は Safari が簡単）
3. **Google でサインイン**
4. 2 人目以降 … Login 画面で **招待コード** を入力

### ホーム画面に追加（任意）

Safari で URL を開いた状態 → 共有ボタン → **ホーム画面に追加**  
アイコンから起動でき、ほぼアプリのように使えます。

---

## 7. 動作確認チェックリスト

代表者 PC で:

- [ ] `npm run build` がエラーなく終わる
- [ ] `npm run web:deploy` が成功する
- [ ] 公開 URL で Google サインインできる
- [ ] 支出を 1 件追加 → Firestore コンソールに反映

iPhone で:

- [ ] 同じ URL を Safari で開ける
- [ ] Google サインインできる
- [ ] 招待コードで家族に参加できる
- [ ] Android 端末と **同じ家計データ** が見える

---

## 8. 更新のしかた

UI や機能を変えたあと:

```powershell
npm run web:deploy
```

- **Web 版** … デプロイ後、Safari でページを再読み込み（キャッシュが残る場合はタブを閉じて開き直す）
- **Android APK** … 別途 `npm run android:apk` で再ビルド・配布（[docs/ANDROID.md](./ANDROID.md)）

Firebase 設定（`.env.local`）を変えた場合も、**Web は再デプロイ、Android は APK 再ビルド** が必要です。

---

## トラブルシューティング

### Google サインインが開かない / すぐ閉じる（iPhone Safari）

- ポップアップブロックをオフにする
- プライベートブラウズをやめて通常タブで試す
- それでもダメな場合 … 一度ログアウトし、URL を開き直してから再サインイン

### `Firestore access denied` / ログイン後にエラー

Firestore ルール未デプロイの可能性:

```powershell
firebase deploy --only firestore:rules
```

### 白い画面・404

`firebase.json` の Hosting 設定で `dist` を公開し、SPA 用 rewrite があることを確認（リポジトリに含まれています）。  
`npm run build` 後に `dist/index.html` があるか確認。

### Android とデータが一致しない

- 両方とも **同じ Firebase プロジェクト**（同じ `.env.local`）か確認
- 別々にサインインして **別家族** になっていないか（招待コード）確認

---

## コマンド早見表

```powershell
# 開発（PC ローカル）
npm run dev

# 本番ビルドだけ
npm run build

# Hosting + Firestore ルールをデプロイ
npm run web:deploy

# Hosting だけ更新
npm run web:hosting

# ビルド結果をローカルで確認
npm run preview
```

---

## Android との役割分担（まとめ）

| | Android | iPhone |
|---|---------|--------|
| 配布 | APK ファイル | URL |
| オフライン | キャッシュあり | ブラウザ依存 |
| ストア公開 | 不要 | 不要 |
| データ共有 | 同じ Firebase | 同じ Firebase |

家族内で **Android は APK、iPhone は Web URL** という組み合わせで問題ありません。
