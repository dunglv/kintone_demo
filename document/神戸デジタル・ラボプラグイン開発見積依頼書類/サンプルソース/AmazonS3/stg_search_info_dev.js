// ライセンス認証結果の保存先 (デフォルトで認証OK)
var g_activated = true;
// プラグインの初期処理 (アプリのメイン画面が開かれる時に実行される)
function kdlSearchInfoOnload(config, event) {
    // 設定情報を読込
    if (!config) return false;
    // 検索窓のプレースホルダ
    var place_holder = config['placeholder'];
    // 検索文字列の桁の最大値 (デフォルトで50)
    var max_length = 50;
    if( config['maxlengthofkeyword'] ){
        max_length = config['maxlengthofkeyword'];
    }

    // 検索ボタンを作成
    var button = document.createElement('button');
    button.innerHTML = "検索";
    button.style.minWidth = "80px";

    // 検索窓を作成
    var text_area = document.createElement('input');
    text_area.id = 'text_area_search_name';
    text_area.maxLength = max_length;
    text_area.placeholder = place_holder;
    text_area.style.width = '430px';
    text_area.style.marginRight = '2px';

    // URLから前回の検索キーワードを取得
    text_area.value = loadKeywordToSearch(config);
    // 作成された検索窓とボタンを一つのDIVに追加
    var div = document.createElement('div');
    div.className = "kintoneplugin-input-outer-searchinfo";
    div.appendChild(text_area);
    div.appendChild(button);
    // kintoneメイン画面のヘッダスペース要素を取得
    var space = kintone.app.getHeaderMenuSpaceElement();
    // もし元の検索プラグインがヘッダに残っている場合は即削除
    for (var i = space.childNodes.length - 1; i >= 0; i--) {
        if( space.childNodes[i].className == "kintoneplugin-input-outer-searchinfo" ){
            space.removeChild(space.childNodes[i]);
        }
    }

    // 新規作成したDIVをヘッダに追加
    space.style.marginBottom = '2px';
    space.appendChild(div);
    // ボタンクリックイベントを設定
    button.onclick = function() {
        searchData(config, event);
    };

    // Enterキーが押下される時のイベントを設定
    text_area.onkeypress = function(e){
        if (!e) e = window.event;
        var key_code = e.keyCode || e.which;
        if( key_code == 13 ){
            // Enter pressed
            searchData(config, event);
        }
    }

    // ライセンス認証
    activation(false, config);
}

// ライセンス認証の入り口。認証済みの場合に再認識する必要がない
function activation(activated, config) {
    if (!activated) {
        authorize(config);
    }
}

// リモートライセンス認証
//stg_plugin_authのAPIGateway
function authorize(config) {
        var url = 'https://46jvka3y4g.execute-api.ap-northeast-1.amazonaws.com/stg/plugin-auth';

        var body = {
            "licensekey" : config['licensekey']
        };

        var headers = {'Content-Type':'application/json'};
        var status = "";
        kintone.plugin.app.proxy(config['pluginid'], url, 'POST', headers, body, function(body, status, headers) {
            //success
            var json_body = JSON.parse(body);
            // ライセンス認証が失敗した場合に、認証失敗のメッセージを表示される
            if (json_body.authority === false) {
                // 認証結果を保存する
                g_activated = false;
                // 認証失敗の時のプロンプトアップ
                promptModalMessage(false);
            }
        }, function(error) {
            //error
        });
}

// エラーメッセージを表示される
function promptModalMessage(authority) {
    swal({
        title: "警告！",
        text: '<html>ライセンスキーの認証に失敗しました。<br>プラグイン設定画面に正しいライセンスキーが入力されているか<br>アプリ管理者へご確認ください。</html>',
        html: true,
        width: '600px'
    });
}

// kintoneに所属するすべてのユーザを取得
function getUsersAPI(position, limit, users_map_all) {
    // 一時のハッシュマップ: "ユーザコード"→"ユーザ名"
    var users_map = {};

    var params = {
        // オフセット
        offset: position,
        // リミット
        size: limit
    };

    return kintone.api('/v1/users.json', 'GET', params).then(function(response) {
        // ユーザオブジェクトリスト
        var users = response["users"];

        // ハッシュマップに埋め込み
        for(var i = 0; i < users.length; i++){
            users_map[users[i]["code"]] = users[i]["name"];
        }

        // 入力ハッシュマップとのマージ
        users_map_all = Object.assign(users_map_all, users_map);

        // リクエスト一回は100件しか取れませんので、ユーザ情報の取得が未完了の場合は再帰
        if (Object.keys(users_map).length == limit) {
            return getUsersAPI(position + limit, limit, users_map_all);
        }

        // マージしたユーザオブジェクト一覧を返す
        return users_map_all;
    }, function(response) {
        // エラーの場合はメッセージを表示する (現在はしない)
        // エラーの場合は空のハッシュマップを返す
        return users_map;
    });
}

// アップのフィールド情報を取得
function getFieldInfo() {
    // フィールドオブジェクトリスト
    var list_fields = [];

    return kintone.api(
        kintone.api.url('/k/v1/form', true),
        'GET', {
            app: kintone.app.getId(),
        }).then(
            function (response) {
                list_fields = response['properties'];

                return list_fields;
            },
            function (response) {
                // エラーの場合はメッセージを表示する (現在はしない)
                // エラーの場合は空のリストを返す
                return list_fields;
            }
        );
}

// 検索条件を生成する
function generateParams(search_word, list_fields, user_map, search_pattern) {
    var parameter_map = {};
    for(var i = 0; i < list_fields.length; i++){
        var field = list_fields[i];
        // 異常状況への処理
        if (field['code'] == undefined) {
            continue;
        }

        if( field['type'] == 'USER_SELECT' ) {
            // フィールドタイプ=ユーザ選択の時の処理
            // 検索条件文字列の初期化
            var query_string = "";

            // 検索キーワードを含められるユーザのユーザコード一覧を生成
            Object.keys(user_map).forEach(function(key) {
                if (user_map[key].indexOf(search_word) != -1) {
                    if (!query_string || !query_string.length) {
                        query_string = '"' + key + '"';
                    } else {
                        query_string += ', "' + key + '"';
                    }
                }
            });

            if (!query_string || !query_string.length) {
                // 検索対象フィールドはユーザ選択がだけ存在している場合に
                // 「フィールドコード in ("") and フィールドコード not in ("")」を適用
                if (search_pattern == 1) {
                    parameter_map[field['code']] = '( ' + field['code'] + ' in ("")' + ' and ' + field['code'] + ' not in ("")' + ')';
                }
            } else {
                // 通常の場合に、「フィールドコード in ("")」を適用
                parameter_map[field['code']] = field['code'] + ' in (' + query_string + ')';
            }
        } else if ( field['type'] == 'NUMBER' || field['type'] == 'CALC' ) {
            // フィールドタイプ=数字(ルックアップ)や計算の時の処理
            parameter_map[field['code']] = field['code'] + ' = "' + search_word + '"';
        } else {
            // フィールドタイプ=文字列一行(ルックアップ)、文字列複数行、リッチエディトやリンクの時の処理
            parameter_map[field['code']] = field['code'] + ' like "' + search_word + '"';
        }
    }

    return parameter_map;
}

// 検索用URLを作成し、そのURLにリダイレクトする
function redirectUrl(config, event, search_word, parameter_map) {
    // 設定の検索対象フィールドを取得
    var field_codes = config['fieldcodes'].split('@^@');
    // 現在のURLを取得
    var url_load = document.URL;
    // 古いクエリの初期化
    var old_query_string = "";
    // 「?view=」と「#sort」が囲まれた部分を旧クエリとして抜き出す
    if( url_load.indexOf('#sort') == -1){
        old_query_string = url_load.substring(url_load.indexOf('?view='));
    } else {
        old_query_string = url_load.substring(url_load.indexOf('?view='), url_load.indexOf('#sort'));
    }

    // 新しいクエリの初期化
    var new_query_string = '';
    new_query_string += '?view=';
    new_query_string += event.viewId;

    // キーワードが存在するかつ検索条件が存在する場合
    if( search_word != '' && Object.keys(parameter_map).length){
        new_query_string += '&query=';
        var strwhere = '';

        // すべての検索条件をエンコードし、繋ぐ
        for(var i = 0; i < field_codes.length; i++){
            if (parameter_map[field_codes[i]] != undefined) {
                if( strwhere == '' ){
                    strwhere += encodeURIComponent(parameter_map[field_codes[i]]);
                } else {
                    strwhere += encodeURIComponent(' or '+ parameter_map[field_codes[i]]);
                }
            }
        }

        // 検索条件をクエリと連結する
        new_query_string += strwhere;
    }

    // URLにクエリの部分を新しくする
    url_load = url_load.replace(old_query_string,new_query_string);

    // 新しいURLにリダイレクトする
    window.location = url_load;
}

// 検索オペレーションを行う
function searchData(config, event){
    // 前回認証失敗の場合にプロンプトメッセージ
    if (g_activated == false) {
        promptModalMessage(false);
        return;
    }
    // 検索キーワードを取得
    var search_word = document.getElementById('text_area_search_name').value;

    // フィールド情報を取得し、検索条件を作成する
    getFieldInfo().then( function (list_fields) {
        // search_patternの値の範囲:　-1：初期値、0 : 通常、1 : ユーザ選択のみ、2 : ユーザ選択とその他
        // 違うフィールドの組み合わせに違う対応をする。ルールは以下となる。
        // a. 検索対象がユーザ選択のみの場合に、
        // ユーザが存在しない場合の処理
        // 　(1)フィールドコード in ("") and フィールドコード not in ("")
        // ユーザが存在する時
        // 　(0)通常で検索
        // b. 検索対象がユーザ選択のみではない（ex.ユーザと文字列）場合
        // ユーザが存在しない場合の処理
        // 　(2)文字列を検索
        // ユーザが存在する時
        // 　(0)文字列を検索 or ユーザを通常で検索
        var search_pattern = -1;
        var use_user_api = false;
        var field_codes = config['fieldcodes'].split('@^@');
        // search_patternを決めて、検索対象フィールドにユーザ選択はあるかどうかをチャックする
        for(var i = 0; i < field_codes.length; i++){
            for(var j = 0; j < list_fields.length; j++){
                var field = list_fields[j];
                if (field['code'] == undefined) {
                    continue;
                }
                if (field['code'] == field_codes[i]) {
                    if( field['type'] == 'USER_SELECT' ) {
                        use_user_api = true;
                        if (search_pattern == -1) {
                            search_pattern = 1;
                        } else if (search_pattern == 0) {
                            search_pattern = 2;
                        }
                    } else {
                        if (search_pattern == -1) {
                            search_pattern = 0;
                        } else if (search_pattern == 1) {
                            search_pattern = 2;
                        }
                    }
                    break;
                }
            }
        }
        if (search_pattern == -1) {
            search_pattern = 0;
        }
        // 検索対象フィールドにユーザ選択はある場合にまずユーザAPIを呼び出し、逆にない場合にAPIをコールしない。
        if (!use_user_api) {
            // 検索条件を作成
            var parameter_map = generateParams(search_word, list_fields, {});
            // 検索のリクエストURLにリダイレクト
            redirectUrl(config, event, search_word, parameter_map);
        } else {
            // オフセットの初期値
            var offset = 0;
            // リミットの初期値、最大値の100を設定
            var limit = 100;
            // 再帰用レコードリスト
            var user_map_all = {}

            getUsersAPI(offset, limit, user_map_all).then(function(user_map) {
                // 検索条件を作成
                var parameter_map = generateParams(search_word, list_fields, user_map, search_pattern);
                // 検索のリクエストURLにリダイレクト
                redirectUrl(config, event, search_word, parameter_map);
            });
        }
    });
}

// URLから検索キーワードを求める
function loadKeywordToSearch(config){
    // 設定の検索対象フィールドを取得
    var field_codes = config['fieldcodes'].split('@^@');
    // フラッグ：検索キーワードを検索窓に戻せる必要があるかどうか
    var check = false;
    // 現在のURLを取得
    var url_query = document.URL;
    for(var i = 0; i < field_codes.length; i++){
        // エンコードされたURLからフィールドコードを検索するため、検索対象のフィールドコードをエンコードして比較する
        var target_field_code = encodeURIComponent(field_codes[i]);
        // フィールドコードがURLに存在する場合はフラッグON、手でURLが修正された場合にフラッグOFF
        if( url_query.indexOf(target_field_code) != -1 ){
            check = true;
            break;
        }
    }

    var rs = '';
    if( check ){
        // クエリー条件を取得
        var condition = kintone.app.getQueryCondition();
        var str_find = '';
        // 「フィールドコード like "」と 「フィールドコード = "」のパターンを探す
        // もし成功すれば位置を取得する
        for (var i = 0; i < field_codes.length; i++) {
            var str_find = field_codes[i] + ' like "';
            if (condition.indexOf(str_find) == -1) {
                str_find = field_codes[i] + ' = "';
                if (condition.indexOf(str_find) == -1) {
                    str_find = '';
                    continue;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        // パターンを見つけた場合に、パターン後ろの""の間の文字列を前回の検索キーワードに
        if (str_find != '') {
            found = condition.substring(condition.indexOf(str_find));
            var keyword = found.substring(str_find.length);

            rs = keyword.substring(0,keyword.indexOf('"'));
        }
    }
    return rs;
}
