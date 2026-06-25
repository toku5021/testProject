// タップされた瞬間の時刻をミリ秒で記録
var startTime = Date.now();

target.type = 'password';
target.inputmode = 'numeric';

setTimeout(function() {
    // タイマーが呼ばれた時の時刻と、タップされた時刻の差を計算
    var timePassed = Date.now() - startTime;

    try {
        // 本命の『email』用のキーボード設定に書き戻す
        target.type = 'email';
        target.inputmode = 'email';
        
        // 【ここがポイント】
        // 10msの予定が、端末の負荷で「50ms以上」大幅に遅延していた場合
        // ユーザーは既に文字を打ち始めている可能性（または別の場所を触っている可能性）があるため、
        // あえて target.focus() を実行せず、ハックをなかったことにしてそのまま終了する。
        if (timePassed < 50) { 
            target.focus();
        } else {
            console.warn("端末の負荷によるタイマー遅延を検知したため、安全のためにハックをスキップしました。");
        }

    } catch (timeoutError) {
        target.type = 'email';
    } finally {
        target.setAttribute('data-switching', 'false');
    }
}, 10);
