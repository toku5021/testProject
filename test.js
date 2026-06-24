/**
 * 機能名  ：メールアドレス入力欄 QWERTYキーボード強制起動機能（決定版）
 * 機能概要 ：property='iemail' を持つ要素の初回フォーカス時に一瞬 password 化し、
 *       直前のかな入力の記憶を完全に上書きしてQWERTY配列キーボードを強制します。
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // ページ全体のフォーカスイベントを監視（イベントデリゲーション）
    document.addEventListener('focus', function(event) {
        var target = event.target;

        // フォーカスされた要素が input かつ property='iemail' 属性を持っているかチェック
        if (!target || target.tagName !== 'INPUT' || !target.hasAttribute('property')) {
            return;
        }

        // 大文字・小文字（IEMAIL, Iemail 等）の表記揺れをすべて小文字に統一して安全に判定
        var propertyValue = target.getAttribute('property').toLowerCase();
        if (propertyValue !== 'iemail') {
            return;
        }

        // 【防衛策1】すでに文字が入っている場合はハックを完全にスルーする
        // これにより、タップするたびに入力済みの文字が「全選択されて消える」バグや、
        // カーソルが勝手に末尾や先頭にジャンプする実用上のバグを100%防ぎます。
        if (target.value && target.value.length > 0) {
            return;
        }

        // 属性変更時のイベント無限ループ（チャタリング）を防止
        if (target.getAttribute('data-switching') === 'true') {
            return;
        }
        target.setAttribute('data-switching', 'true');

        // 最も強力にQWERTYを強制起動できる password タイプへ一瞬だけ切り替える
        target.type = 'password';

        // タイマーで即座に email タイプへ戻す
        setTimeout(function() {
            // 本命の email に戻す
            target.type = 'email';
            target.setAttribute('data-switching', 'false');

            // type変更によって一部ブラウザでフォーカスが外れる現象への対策
            target.focus();
        }, 10);
    }, true); // キャプチャリングフェーズでイベントを確実に捕捉
});