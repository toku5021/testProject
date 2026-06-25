document.addEventListener('DOMContentLoaded', function() {

    // ページ全体のフォーカスイベントをキャッチ
    document.addEventListener('focus', function(event) {
        var target = event.target;

        // name属性が 'IEMAIL' であるinputタグ以外は無視
        if (!target || target.tagName !== 'INPUT' || target.getAttribute('name') !== 'IEMAIL') {
            return;
        }

        // すでに文字が入っている場合は処理しない
        if (target.value && target.value.length > 0) {
            return;
        }

        // 無限ループ（チャタリング）防止
        if (target.getAttribute('data-switching') === 'true') {
            return;
        }
        
        try {
            // 切り替え中フラグをON
            target.setAttribute('data-switching', 'true');
            
            // 1. まずはパスワードタイプにする（OSにキーボード変更を認識させる）
            target.type = 'password';

            // 2. 【修正ポイント】OSが認識できるよう、10ミリ秒だけ「待ち時間」を作る
            // ※元のbbb.txt[cite: 50, 51]の仕組みを、安全性を高めた形で復活させました
            setTimeout(function() {
                try {
                    // 10ミリ秒後に、確実にemailタイプへ戻す
                    target.type = 'email';
                } catch (e) {
                    console.error("Failed to revert input type:", e);
                } finally {
                    // 何が起きても必ず無限ループ防止フラグを解除し、再フォーカスする
                    target.setAttribute('data-switching', 'false'); // [cite: 51]
                    target.focus(); // [cite: 51]
                }
            }, 10); // [cite: 51]

        } catch (error) {
            console.error("Keyboard hack critical error:", error);
            // 万が一メイン処理で想定外のエラーが出た場合も、安全のため即座に戻す
            target.type = 'email';
            target.setAttribute('data-switching', 'false');
            target.focus();
        }
        
    }, true);
});
