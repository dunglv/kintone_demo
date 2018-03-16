(function (PLUGIN_ID) {

    'use strict';

    function loadUrl(url, config, event, callbackSuccess, callbackFailed) {
        $.ajax(url, {
            dataType: 'script',
            crossDomain: true
        })
            .done(function () {
            // 成功
            callbackSuccess(config, event);
        })
            .fail(function () {
            // 失敗
            callbackFailed();
        })
            .always(function () {
            // 完成
        });
    }

    function callbackSuccess(config, event) {
        try {
            // リファレンスしたJSスクリプトの初期化
            kdlSearchInfoOnload(config, event);
        } catch (e) {
            messageBox('警告！', '<html>エラーが発生しました。<br>プラグイン提供元へご連絡ください。<br>エラーコード：001</html>');
        }
    }

    function callbackFailed() {
        messageBox('警告！', '<html>エラーが発生しました。<br>プラグイン提供元へご連絡ください。<br>エラーコード：002</html>');
    }

    function messageBox(titleText, htmlText) {
        swal({
            title: titleText,
            text: htmlText,
            html: true
        });
    }

    function showButtonSearch(event){
        // 設定情報を取得
        var config = kintone.plugin.app.getConfig(PLUGIN_ID);
        // リモートJSスクリプトのURLS3stg
        var url = "https://s3-ap-northeast-1.amazonaws.com/plugins.kintone.cloudcollection.jp/stg/SearchInfo/stg_search_info_dev.js";
        try {
            // リモートJSスクリプトの取得と読込
            loadUrl(url, config, event, callbackSuccess, callbackFailed);
        } catch (e) {
            messageBox('警告！', '<html>エラーが発生しました。<br>プラグイン提供元へご連絡ください。<br>エラーコード：003</html>');
        }
    }
    // アプリメイン画面が開かれる時のイベント設定
    kintone.events.on(['app.record.index.show'], showButtonSearch);

})(kintone.$PLUGIN_ID);
