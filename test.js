/**
 * 機能名  ：メールアドレス入力欄 email用QWERTYキーボード強制起動機能（Vanilla JS版）
 * 機能概要 ：property='iemail' を持つ要素の初回フォーカス時に一瞬 url/search タイプを経由させ、
 *       直前のかな入力の記憶を上書きして「email専用」のQWERTY配列キーボードを強制します。
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

        // すでに文字が入力されている場合は、ユーザーが編集中のためハックを行わない
        if (target.value && target.value.length > 0) {
            return;
        }

        // 属性変更時のイベント無限ループ（チャタリング）を防止
        if (target.getAttribute('data-switching') === 'true') {
            return;
        }
        target.setAttribute('data-switching', 'true');

        /* 【ここを修正】
           password ではなく 'url' (または 'search') に一瞬変更します。
           これにより、かな入力を強制解除しつつ、パスワードマネージャーの誤作動を完全に防ぎます。
        */
        target.type = 'url';

        // タイマーで即座に email タイプへ戻す
        setTimeout(function() {
            // 本命の email に戻すことで、@ や . が付いた正規のemail用QWERTYを起動させます
            target.type = 'email';
            target.setAttribute('data-switching', 'false');

            // type変更によって一部ブラウザでフォーカスが外れる現象への対策
            target.focus();
        }, 10);
    }, true); // キャプチャリングフェーズでイベントを確実に捕捉
});