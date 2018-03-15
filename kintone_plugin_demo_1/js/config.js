(function() {
// 	var config = {
//     "Number Field Code": "number_field",
//     "Font Color": "#8bc534"
// };
// kintone.plugin.app.setConfig(config);
	// var d = kintone.plugin.app.getConfig(PLUGIN_ID);
	// console.log(d);
  // let PLUGIN_ID = 'kefondkobbnnkoaebhngjbplpjbhonnd';
    var CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);

      kintone.events.on('app.record.index.show', function(event){
    var body = {
        "app": kintone.app.getId()
    };
    var hb = [];
    kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET', body, function(resp) {
        // success
        var dd = resp.properties.choice_hobbies.options;
        for (var key in dd) {
          hb.push(key);
        }
        
    }, function(error) {
        // error
        console.log(error);
    });
      
      // Create button
      var elBtn = document.createElement('button');
      var maxNum = CONFIG.NUMBER_RECORD || 1;
      elBtn.innerHTML = 'Create '+ maxNum +' record';
      elBtn.className = 'classButton';

      
  //    var ls = document.querySelector('.list-group table tbody');
    // var html = '';
  //    event.records.forEach(function(e, i){
  //      html += '<tr><td>'+e.Record_number.value+'</td><td>'+e.txt_name.value+'</td><td>'+e.choice_hobbies.value.join(', ')+'</td></tr>';
  //    });

  //    ls.innerHTML = html;
      
      elBtn.onclick = function(ev){
        var fconfirm = confirm('Do you want to add '+maxNum+ ' record?');
        if(!fconfirm) return false;

        var records = [];
        for (var i = 0; i < maxNum; i++) {
          records.push({
            "txt_name": {
              "value": makeString()
            }, 
            "choice_hobbies": {
              "value": [hb[Math.floor(Math.random() * hb.length)]]
            }
          });
        }
        
        var data = {
          "app": kintone.app.getId(),
          "records": records
        };
        kintone.api(kintone.api.url('/k/v1/records', true), 'POST', data, function(resp){
          console.log(resp);
          alert("Success");
          window.location.reload();
          
        });
        
      }

      kintone.app.getHeaderMenuSpaceElement().appendChild(elBtn);

      
    });

   


	var config_number = document.querySelector('.config_number_record');
  	var btn_submit = document.querySelector('.submit_config');

	// var CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
	if(typeof CONFIG != typeof undefined && typeof CONFIG.NUMBER_RECORD != "undefined"){
		config_number.value = CONFIG.NUMBER_RECORD;
	}

  	
  	btn_submit.onclick = function(e){
  		if(config_number.value > 100) {
  			alert("Maximum is 100"); return;
  		}
  		
  		kintone.plugin.app.setConfig({"NUMBER_RECORD": config_number.value});
  	};

console.log(PLUGIN_ID, kintone.plugin.app.getConfig(PLUGIN_ID));
 
 function makeString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
})(kintone.$PLUGIN_ID);