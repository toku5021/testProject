document.addEventListener('DOMContentLoaded', function() {

    // ページ全体のフォーカスイベントをキャッチ（イベントデリゲーション）
    document.addEventListener('focus', function(event) {
        var target = event.target;

        // 【対象制限】name属性が 'IEMAIL' であるinputタグ以外はすべて無視して即終了
        if (!target || target.tagName !== 'INPUT' || target.getAttribute('name') !== 'IEMAIL') {
            return;
        }

        // すでに文字が入力されている場合は、ユーザーが編集中のためハックを行わない
        if (target.value && target.value.length > 0) {
            return;
        }

        // 属性変更時のイベント無限ループ（チャタリング）を防止
        // 既に切り替え中（true）であれば処理をスキップ
        if (target.getAttribute('data-switching') === 'true') {
            return;
        }
        
        // 堅牢性を高めるため、ここからの処理を try-catch-finally で囲む
        try {
            // ループ防止フラグを「切り替え中（true）」にする
            target.setAttribute('data-switching', 'true');
            
            // 1. パスワードにしてOSにQWERTYキーボードを強制起動させる
            target.type = 'password';

        } catch (error) {
            // 万が一ブラウザの仕様変更などでエラーが出た場合はログに出力
            console.error("Keyboard hack failed:", error);
            
        } finally {
            // 途中でどんなエラーが起きても、この finally ブロックは絶対に強制実行されます
            
            // 2. 即座に email に戻す（タイマーを排除し、フリーズのリスクを無くす）
            target.type = 'email';
            
            // 【重要】処理が終わったので、無限ループ防止用のスイッチを「false」にリセット
            target.setAttribute('data-switching', 'false');

            // type変更によってフォーカスが外れる現象への対策として再フォーカス
            target.focus();
        }
        
    }, true); // キャプチャリングフェーズでイベントを確実に捕捉
});
