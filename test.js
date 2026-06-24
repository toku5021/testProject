/**
 * 機能名  ：メールアドレス入力欄 QWERTYキーボード強制起動機能（Vanilla JS版）
 * 機能概要 ：property='iemail' を持つ要素の初回フォーカス時に一瞬 password 化し、
 *       直前のかな入力の記憶を上書きして英語配列キーボードを強制します。
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // ページ全体のフォーカスイベントをキャッチ（イベントデリゲーション）
    document.addEventListener('focus', function(event) {
        var target = event.target;

        // フォーカスされた要素が input かつ property='iemail' 属性を持っているかチェック
        if (!target || target.tagName !== 'INPUT' || target.getAttribute('property') !== 'iemail') {
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

        // 一瞬だけ password にしてOSにQWERTYキーボードを強制起動させる
        target.type = 'password';

        // タイマーで即座に email タイプへ戻す
        setTimeout(function() {
            // 正規の email に戻す（失敗してもベースが email なので安全）
            target.type = 'email';
            target.setAttribute('data-switching', 'false');

            // type変更によって一部ブラウザでフォーカスが外れる現象への対策
            target.focus();
        }, 10);
    }, true); // キャプチャリングフェーズでイベントを確実に補足
});