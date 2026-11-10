2026-11-10 ギア5速：テストもコードもAIが書く。人間は最初の設計に関わるだけで、コードレビューはしない

# plans

## flatmarkdown 0.5.0のASTに合わせる

描画するHTMLの形は、Rustの`flatmarkdown`クレートの`html.rs`に合わせる。

- [x] `embed`を`<img>`にする（`image`はなくなった）
- [x] 型パッケージ`flatmarkdown-ast` 0.5.0に依存する
- [x] パーサーが出さなくなったノードを消す
- [x] `hashtag`をリンクにする。wikilinkの`hrefPrefix`と`linkComponent`を使う
- [x] `footnote_reference`は名前を表示する。インライン脚注は番号を表示する。参照ごとに一意のidを付ける
- [x] `footnote_definition`に、参照へ戻るラベルを置く
- [x] `subtext`を`<p><sub>`にする
- [x] `math`を`<span class="math">`にする
- [x] `alert`を、タイトル付きの`<blockquote>`にする
- [x] `code_block`のinfoが`text`のときは、言語のクラスを付けない
- [x] `table`の行を`<thead>`と`<tbody>`に入れる
- [x] `task_item`の`<p>`は、リストがtightのときだけ外す
- [x] 未知のノードは、子だけを描画する
- [x] `embed`のaltに、コード、ハッシュタグ、改行、生のHTMLを含める
- [x] ノードの属性を、型を通して読む（`as`のキャストをなくす）
- [x] READMEを直す
- [ ] `flatmarkdown-ast` 0.5.0がnpmに公開されたら、`package-lock.json`を更新する
