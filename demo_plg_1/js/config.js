(function () {
    "use strict";

    kintone.events.on('app.record.index.show', function(event){
    	var btn = document.createElement('button');
    	btn.innerHTML = 'Add 10 record with random data';
    	btn.className = 'btn btnRandom';

    	btn.onclick = function(){

    	}

    	kintone.app.getHeaderMenuSpaceElement().appendChild(btn);

    });

    
})();