# GitHub Pages デプロイメント手順

## 1. GitHubリポジトリにプッシュ済み

✅ リポジトリURL: https://github.com/junjun7613/llm_epigraphy

## 2. GitHub Pagesの有効化

### 手順:

1. **GitHubリポジトリページにアクセス**
   - https://github.com/junjun7613/llm_epigraphy にアクセス

2. **Settings タブをクリック**
   - ページ上部のタブから「Settings」を選択

3. **Pages セクションに移動**
   - 左サイドバーから「Pages」を選択

4. **Source（ソース）を設定**
   - "Source" のドロップダウンから `main` ブランチを選択
   - フォルダは `/ (root)` を選択
   - 「Save」ボタンをクリック

5. **デプロイを待つ**
   - 数分後、ページ上部に公開URLが表示されます
   - URL: `https://junjun7613.github.io/llm_epigraphy/`

## 3. エディタへのアクセス

デプロイ後、以下のURLでアクセス可能:

- **トップページ**: https://junjun7613.github.io/llm_epigraphy/
- **SPARQLエディタ**: https://junjun7613.github.io/llm_epigraphy/editor/gold_standard_editor_sparql.html

## 4. 動作確認

エディタで以下を確認:
- [ ] 地名のドロップダウンが表示される
- [ ] 地名を選択して「地名データ読込」が機能する
- [ ] SPARQLエンドポイントからデータが取得できる
- [ ] 民族性、神格タイプ、職位の選択肢が表示される

## トラブルシューティング

### CORSエラーが発生する場合
SPARQLエンドポイント (https://dydra.com/junjun7613/inscriptions_llm/sparql) が、
GitHub Pagesからのアクセスを許可しているか確認してください。

### 更新が反映されない場合
1. ブラウザのキャッシュをクリア (Ctrl+Shift+R / Cmd+Shift+R)
2. GitHub Actionsタブでデプロイの状態を確認
3. 数分待ってから再度アクセス

## 今後の更新手順

ファイルを更新した後:

```bash
git add .
git commit -m "Update editor functionality"
git push origin main
```

GitHub Actionsが自動的にGitHub Pagesへデプロイします（数分かかります）。
