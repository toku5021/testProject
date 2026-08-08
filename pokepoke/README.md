# ポケポケ カード管理 v3

複数アカウントのカード所持枚数を管理する、HTML/CSS/JavaScriptだけのWebアプリです。

## 主な機能

- 複数アカウントを追加・名前変更・削除
- アカウントを選択してカード枚数を + / - で管理
- 1枚でもいずれかのアカウントが持っていれば「所持」
- 全体・拡張・パック単位のコンプリート率
- 所持 / 未所持フィルター
- カード・パック検索
- カード画像表示
- localStorage保存
- 全アカウントのバックアップ / 復元
- スマホ対応
- 管理対象レアリティは◆1〜◆4のみ（☆1〜☆3・クラウン等を除外）
- GitHub Pages対応

## データ保存

所持情報はブラウザのlocalStorageに保存します。

PCとスマホは保存領域が別なので、現状では自動同期されません。
端末間で同期したい場合はFirebase/Supabase等の導入が必要です。

## カードデータ

以下の公開データをブラウザから取得します。

https://github.com/chase-mew/pokemon-tcg-pocket-cards

## ローカル起動

Pythonがある場合:

python -m http.server 8000

ブラウザ:

http://localhost:8000/

## GitHub Pages

このフォルダのファイルをGitHubリポジトリの公開対象フォルダに置き、
Settings → Pages → Deploy from a branch → main / root
で公開してください。

## アカウント別データの考え方

例えば「フシギダネ」を、

メイン: 2枚
サブ: 0枚
サブ2: 1枚

と登録した場合、

- メインの表示: 2枚
- サブの表示: 0枚
- サブ2の表示: 1枚
- 全アカウント合計: 3枚
- コレクション上の状態: 所持

となります。


## レアリティについて

管理対象は以下の4種類のみです。

- ◆1
- ◆2
- ◆3
- ◆4

カードデータ上ではそれぞれ `◊`, `◊◊`, `◊◊◊`, `◊◊◊◊` として登録されています。
☆1〜☆3、クラウンなど、それ以外のレアリティは一覧・コンプリート率の対象外です。


## v5 レアリティフィルター

管理対象は銀星に相当する以下の4段階のみです。

- ◆1（データ上 `◊`）
- ◆2（データ上 `◊◊`）
- ◆3（データ上 `◊◊◊`）
- ◆4（データ上 `◊◊◊◊`）

カード一覧では「すべて / ◆1 / ◆2 / ◆3 / ◆4」で絞り込めます。
☆1〜☆3、クラウンなどは管理対象外です。

\n## v6 データ取得先\n\nカードデータの取得先を `pokemon-tcg-pocket-database` に変更しています。\n\n- cards.json: https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/dist/cards.json\n- sets.json: https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/dist/sets.json\n- カード画像: https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/cards-by-set/{set}/{number}.webp\n\nこのデータベースはカード・セット・レアリティ等をJSONで提供しています。\n2026-07-29公開の2.9.1ではB4「Rulers of the Skies」が追加されています。\n\n## 費用\n\nこの構成では、GitHub Pagesと公開JSON/CDNを利用するだけなので、アプリ側で新たな有料サービスを契約する必要はありません。\n