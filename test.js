/**
 * 機能名  ：メールアドレス入力欄 QWERTY（email版）強制起動機能
 * 機能概要：
 * name='IEMAIL' を持つ入力欄にフォーカスされた際、
 * 一瞬だけ type=password を経由してキーボード状態のリフレッシュを試みる。
 *
 * 設計方針：
 * - password状態でユーザー入力させないことを最優先
 * - タイマー(setTimeout)に依存しない
 * - ハックが効かなくなっても通常のemail入力は保証する
 * - 例外発生時も必ずemailへ戻す
 */
document.addEventListener('DOMContentLoaded', function () {

    document.addEventListener('focus', function (event) {

        var target = event.target;

        // 対象チェック
        if (
            !target ||
            target.tagName !== 'INPUT' ||
            target.getAttribute('name') !== 'IEMAIL'
        ) {
            return;
        }

        // 入力済みの場合は何もしない
        if (target.value && target.value.length > 0) {
            return;
        }

        // 再入防止
        if (target.getAttribute('data-switching') === 'true') {
            return;
        }

        try {
            target.setAttribute('data-switching', 'true');

            // 現在状態を明示
            target.type = 'email';
            target.inputMode = 'email';

            // キーボードリフレッシュ試行
            target.type = 'password';

        } catch (error) {

            console.error('Keyboard hack failed:', error);

        } finally {

            // 何が起きてもemailへ戻す
            try {
                target.type = 'email';
                target.inputMode = 'email';
            } catch (restoreError) {
                console.error('Restore failed:', restoreError);
            }

            // フォーカス維持
            try {
                if (document.contains(target)) {
                    target.focus();
                }
            } catch (focusError) {
                console.error('Focus restore failed:', focusError);
            }

            target.setAttribute('data-switching', 'false');
        }

    }, true);

});
