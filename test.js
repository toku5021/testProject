/**

 * 機能名  ：メールアドレス入力欄 QWERTY（email版）強制起動機能

 * 機能概要 ：property='iemail' を持つ要素のタップ（クリック）時に、

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



            // 対象の入力欄かつ、property='iemail' を持っているかチェック

            if (!target || target.tagName !== 'INPUT' || target.getAttribute('name') !== 'IEMAIL') {

                return;

            }



            // すでに文字が入っている、または処理中の場合はスキップ

            if ((target.value && target.value.length > 0) || target.getAttribute('data-switching') === 'true') {

                return;

            }



            target.setAttribute('data-switching', 'true');



            // --- 【ここが最重要トリック】 ---

            // スマホのキーボードエンジンに「完全に新しい未知の入力形式が来た」と錯覚させるため、

            // フォーカスが当たる前に、最も強制力の強い『password』と『number』を経由させます。

            // これにより、ブラウザが保持している「直前のかな入力」のキャッシュが内部で強制パージされます。

            target.type = 'password';

            target.inputmode = 'numeric';



            // 10ミリ秒（ブラウザが画面を描画する前の極小時間）だけ待つ

            setTimeout(function() {

                // 本命の『email』用のキーボード設定に書き戻す

                target.type = 'email';

                target.inputmode = 'email';



                // 完全にリフレッシュされた状態でフォーカスを当て、email用のQWERTYを呼び出す

                target.focus();



                // 最後に処理完了フラグを戻す

                target.setAttribute('data-switching', 'false');

            }, 10);

        }, true);

    });

});
