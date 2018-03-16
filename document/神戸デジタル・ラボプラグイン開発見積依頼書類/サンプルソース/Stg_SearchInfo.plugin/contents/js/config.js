jQuery.noConflict();

(function($,PLUGIN_ID) {
    "use strict";
    
    $(document).ready(function(){
        // プラグインIDの設定
        var KEY = PLUGIN_ID;
        // 前回の設定情報を取得
        var config = kintone.plugin.app.getConfig(KEY);
        // フィールドコードのセパレータ
        var str_field_codes = '@^@';
        // 既に値が設定されている場合はフィールドに値を設定する
        // フィールドコードの一覧
        if ( config['fieldcodes'] ){
            str_field_codes = config['fieldcodes'];
        }
        // 検索窓の背景テキスト
        if ( config['placeholder'] ){
            $('#searchinfo-plugin-place-holder').val(config['placeholder']);
        }
        // 検索文字列の桁の最大値 (デフォルトで50)
        if ( config['maxlengthofkeyword'] ){
            $('#searchinfo-plugin-max-length').val(config['maxlengthofkeyword']);
        } else {
            $('#searchinfo-plugin-max-length').val(50);
        }
        // ライセンスキー
        if ( config['licensekey'] ) {
            $('#searchinfo-plugin-license-key').val(config['licensekey']);
        }
        
        var removeSpace = function(str) {
            var zenkakuSpace = '\u3000';
            str = str.replace(new RegExp(zenkakuSpace, 'g')," ");
            str = str.replace(/ /g,"");
            return str;
        }
        
        // アプリのフィールド一覧を取得する
        kintone.api(
            kintone.api.url('/k/v1/form', true),
            'GET', {
                app: kintone.app.getId(),
            }
            , function (response) {
                var list_fields = response['properties'];

                for(var i = 0; i < list_fields.length; i++){
                    var field = list_fields[i];
                    // 検索対象フィールドは文字列一行、文字列複数行、リッチエディット、リンク、ユーザ選択、数値と計算となる
                    if( field['type'] == 'SINGLE_LINE_TEXT' ||
                        field['type'] == 'MULTI_LINE_TEXT' ||
                        field['type'] == 'RICH_TEXT' ||
                        field['type'] == 'LINK' ||
                        field['type'] == 'USER_SELECT' ||
                        field['type'] == 'NUMBER' ||
                        field['type'] == 'CALC'
                        ){
                        var option = '';
                        var field_codes = str_field_codes.split('@^@');
                        // オプションリストアイテムの作成
                        for(var j = 0; j < field_codes.length; j++) {
                            if (field_codes[j] == field['code']) {
                                option = '<option selected value="' + field['code'] + '">' + field['code'] + '-' + field['label'] + '</option> ';
                                break;
                            }
                        }
                        if (option == '') {
                            option = '<option value="' + field['code'] + '">' + field['code'] + '-' + field['label'] + '</option> ';
                        }
                        // オプションの追加
                        $('#searchinfo-plugin-field-code').append(option);
                    }
                }

                $("#searchinfo-plugin-field-code").chosen();
            }
            , function (response) {
                
            });

        //「保存する」ボタン押下時に入力情報を設定する
        $('#searchinfo-plugin-submit').click(function() {
            var config = [];
            var field_codes = $('#searchinfo-plugin-field-code').val();
            var str_place_holder = $('#searchinfo-plugin-place-holder').val();
            var str_max_length = $('#searchinfo-plugin-max-length').val();
            var str_license_key = $('#searchinfo-plugin-license-key').val();
            
            // 半角、全角スペースの組む合わせを空と判断する
            var test_license_key = removeSpace(str_license_key);
            if (test_license_key.length == 0) {
                alert("必須項目が入力されていません");
                str_license_key = "";
                // ライセンスキーの入力窓を空にする
                $('#searchinfo-plugin-license-key').val("");
                $('#searchinfo-plugin-license-key').focus();
                return;
            }
            
            // 入力できる文字数の入力チェック
            if (/^\d+$/.test(str_max_length) == false) {
                alert("入力できる文字数は正整数ではありません");
                $('#searchinfo-plugin-max-length').focus();
                return;
            }

            if ((field_codes == null) || (field_codes == "") || (str_license_key == "")){
                alert("必須項目が入力されていません");
                return;
            }
            // フィールドコードの連結
            var str_field_codes = '';
            for(var i = 0; i < field_codes.length; i++){
                if( str_field_codes == '' ){
                    str_field_codes = field_codes[i];
                } else{
                    str_field_codes += '@^@'+ field_codes[i];
                }
            }
            config['fieldcodes'] = str_field_codes;
            config['placeholder'] = str_place_holder;
            config['maxlengthofkeyword'] = str_max_length;
            config['licensekey'] = str_license_key;
            config['pluginid'] = PLUGIN_ID;

            // 設定を保存する
            kintone.plugin.app.setConfig(config);
        });

        //「キャンセル」ボタン押下時の処理
        $('#searchinfo-plugin-cancel').click(function() {
                history.back();
        });
    });
    
})(jQuery,kintone.$PLUGIN_ID);