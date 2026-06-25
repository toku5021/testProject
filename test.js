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

            // 【追加】タップされた「現在の時刻」をミリ秒で記憶
            var startTime = Date.now();

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
                
                // 【追加】実際にタイマーが呼ばれるまでに経過した時間を計算
                var timePassed = Date.now() - startTime;

                // 10ミリ秒後の書き戻し処理をガード
                try {
                    // 本命の『email』用のキーボード設定に書き戻す（★ここで必ずemailに戻る）
                    target.type = 'email';
                    target.inputmode = 'email';
                    
                    // 【追加】タイマー遅延対策の判定
                    // 通常10msの予定が、端末の負荷で「50ms以上」遅延して呼ばれた場合
                    // ユーザーがすでに文字入力を開始している、または別操作に移っているリスクがあるため、
                    // あえて target.focus() を実行せず、ハックを無効化して安全なemailのまま着地させます。
                    if (timePassed < 50) {
                        // 完全にリフレッシュされた状態でフォーカスを当て、email用のQWERTYを呼び出す
                        target.focus();
                    } else {
                        console.warn("端末負荷によるタイマー遅延（" + timePassed + "ms）を検知。安全のためフォーカスをスキップしました。");
                    }

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
