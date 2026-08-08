# ポケポケ カード管理

HTML / CSS / JavaScriptだけで動くカード所持管理ページです。

## 機能

- 拡張パック → ブースターパック → カードの順に表示
- カード画像表示
- 所持枚数を + / - で管理
- 全体 / パック単位のコンプリート率
- 所持 / 未所持フィルター
- カード検索
- パック検索
- localStorage保存
- 所持情報のJSONバックアップ / 復元
- スマホ対応
- GitHub Pages対応

## データ

カード一覧とパック一覧は、以下の公開データをブラウザから直接取得します。

https://github.com/chase-manning/pokemon-tcg-pocket-cards

カード:
https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/v4.json

拡張・パック:
https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/expansions.json

そのため、このプロジェクトには巨大なcards.jsonを同梱していません。
データ提供元が更新されると、ページを再読み込みした際に新しいデータを取得できます。

## ローカル起動

### Pythonがある場合

このフォルダで:

python -m http.server 8000

ブラウザ:
http://localhost:8000/

### VS Codeの場合

Live Serverを使ってindex.htmlを開いてください。

## GitHub Pages

このフォルダの4ファイルをGitHubリポジトリへpushし、
Settings → Pages → Deploy from a branch → main / root
を選択してください。

## 注意

所持情報はブラウザのlocalStorageに保存されます。
PCとスマホでは別々の保存領域です。

端末間で同期したい場合は、次の段階でFirebase / Supabase等を追加してください。
