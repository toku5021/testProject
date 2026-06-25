/**
 * 機能名  ：メールアドレス入力欄 QWERTY（email版）強制起動機能
 * 機能概要 ：name='IEMAIL' を持つ要素のタップ（クリック）時に、
 * 一瞬だけ異なるtypeを高速で切り替えることにより、
 * 直前のかな入力の記憶を完全にクリアして「メール用のQWERTY」を強制します。
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // タップ・クリックされた瞬間（フォーカスが当たる直前）をキャッチ
    // スマホ対応のため touchstart、PCでの検証用に mousedown を両方セット
    var triggerEvents = ['touchstart', 'mousedown'];

    triggerEvents.forEach(function(eventType) {
        document.addEventListener(eventType, function(event) {
            var target = event.target;

            // 対象の入力欄かつ、name='IEMAIL' を持っているかチェック（大文字に修正）
            if (!target || target.tagName !== 'INPUT' || target.getAttribute('name') !== 'IEMAIL') {
                return;
            }

            // すでに文字が入っている、または処理中の場合はスキップ
            if ((target.value && target.value.length > 0) || target.getAttribute('data-switching') === 'true') {
                return;
            }

            // 最初の切り替え処理全体をガード
            try {
                target.setAttribute('data-switching', 'true');

                // --- 【最重要トリック】 ---
                // スマホのキーボードエンジンに「完全に新しい未知の入力形式が来た」と錯覚させる
                target.type = 'password';
                target.inputmode = 'numeric';

            } catch (error) {
                console.error("First hack phase error:", error);
                // 万が一ここでエラーが起きたら即座に安全な設定へ退避
                target.type = 'email';
                target.inputmode = 'email';
                target.setAttribute('data-switching', 'false');
                return; // タイマーに進まず終了
            }

            // 10ミリ秒（ブラウザが画面を描画する前の極小時間）だけ待つ
            setTimeout(function() {
                // 10ミリ秒後の書き戻し処理をガード
                try {
                    // 本命の『email』用のキーボード設定に書き戻す
                    target.type = 'email';
                    target.inputmode = 'email';
                    
                    // 完全にリフレッシュされた状態でフォーカスを当て、email用のQWERTYを呼び出す
                    target.focus();

                } catch (timeoutError) {
                    console.error("Timeout phase error:", timeoutError);
                    // ここでエラーが起きても強制的に戻す
                    target.type = 'email';
                    target.inputmode = 'email';
                } finally {
                    // 【最重要】何が起きても、最後の「リセットスイッチ」だけは絶対に強制実行する
                    target.setAttribute('data-switching', 'false');
                }
            }, 10);
            
        }, true);
    });
});
