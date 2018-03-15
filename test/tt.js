(function () {
    "use strict";
    kintone.events.on('app.record.index.show', function(event){
    	var ls = document.querySelector('.list-group table tbody');
		var html = '';
    	event.records.forEach(function(e, i){
    		html += '<tr><td>'+e.Record_number.value+'</td><td>'+e.txt_name.value+'</td><td>'+e.choice_hobbies.value.join(', ')+'</td></tr>';
    	});

    	ls.innerHTML = html;

    	var btn = document.getElementById('randCreate');
    	var input = document.getElementById('inputNumber');
    	var hb = ["IT", "Football", "Eat", "Volleyball"];
    	
    	btn.onclick = function(ev){
    		var records = [];
    		for (var i = 0; i < input.value; i++) {
    			records.push({
    				"txt_name": {
    					"value": makeString()
    				}, 
    				"choice_hobbies": {
    					"value": [hb[Math.floor(Math.random() * hb.length)]]
    				}
    			});
    		}
    		console.log(records);
    		var data = {
    			"app": kintone.app.getId(),
    			"records": records
    		};
    		kintone.api(kintone.api.url('/k/v1/records', true), 'POST', data, function(resp){
    			console.log(resp);
    		});
    		
    	}
    	
    });

    function makeString() {
	  var text = "";
	  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	  for (var i = 0; i < 5; i++)
	    text += possible.charAt(Math.floor(Math.random() * possible.length));

	  return text;
	}

})();