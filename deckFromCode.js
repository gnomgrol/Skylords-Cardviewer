var globalCards = {};

function fixName(name){
	return name.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
}

function cardAffinityToString(aff){
	if(aff == 0){return " (Frost)";}
	if(aff == 1){return " (Fire)";}
	if(aff == 2){return " (Nature)";}
	if(aff == 3){return " (Shadow)";}
	return "";
}

$.urlParam = function(name)  
{  
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href); 
	if(results == null){return "";}
    return results[1] || 0;
}



$(document).ready(function(){

    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', 895);
    canvas.setAttribute('height', 1000);
    canvas.setAttribute('id', 'canvas');
    var ctx = canvas.getContext("2d");
    canvas.style.display = "none";


    var canvas2 = document.createElement('canvas');
    canvas2.setAttribute('width', 1200);
    canvas2.setAttribute('height', 84);
    canvas2.setAttribute('id', 'canvas2');
    var ctx2 = canvas2.getContext("2d");
    canvas2.style.display = "none";


    function loadImage(src) {
        var img = new Image();
        img.onload = loadFinished;
        img.src = src;
        return img;
    }

    var imagesLoaded = 0;
    var cardCount = 0;
    var images = [];

    function loadFinished() {
        imagesLoaded += 1;
        if (imagesLoaded == cardCount) {
    
            var counter = 0;
            $.each(images, function(index){
                var row = (index - (index % 5)) / 5;
                if((index % 5) == 0){
                    counter = 0;
                }
                var width = 179;
                var height = 250;
                ctx.drawImage(images[index], counter*width, row*height, width, height);
                counter++;
            });

            var r = canvas.toDataURL('image/png');
            document.getElementById("display").src = r;



            $.each(images, function(index){
                var width = 60;
                var height = 84;
                ctx2.drawImage(images[index], index*width, 0, width, height);
            });
            var r2 = canvas2.toDataURL('image/png');
            document.getElementById("display2").src = r2;

            $("#linkLabel").text("Big Image:");
            //$("#linkLabel").text(window.location.href.replace("deck.html", "cards.html"));
            $("#headerLabel").html("Right Click <br/> Copy Image <br/> Ctrl-V in Forum Post");
        }
    }


    var globalCards = {};
    
    var proxy = "proxy.php?url=";
    var imgProxy = "imgProxy.php?url=";
	if(domain.indexOf("skylords.eu") > -1){proxy = "";imgProxy ="";}

    
    var xmlhttpSB = new XMLHttpRequest();
    xmlhttpSB.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            
            globalCards = JSON.parse(this.responseText).Result;
            $.each(globalCards, function(index, card){
                if(card.OrbInfo == null || card.OrbInfo == undefined){
                    globalCards[index].OrbInfo = {};
                    globalCards[index].OrbInfo.OrbCode = "?????";
                }
            });	
            
    
            var deckFromUrl = $.urlParam("d");
            if(deckFromUrl.length > 1){
                var decodedDeck = atob(deckFromUrl);
    
                var deckName = decodedDeck.split('>')[0];
    
                var data = decodedDeck.split('>')[1];
                var cards = data.split('|');
                cardCount = cards.length-1;
    
                $.each(cards, function(ind){
                    var gIndex = parseInt(cards[ind], 10);
                    if(gIndex > -1){
                        var gCard = globalCards[gIndex];
                        var namestring = fixName(gCard.Name) + cardAffinityToString(gCard.Affinity);
                        
    
                        var img = loadImage(imgProxy + "https://cardbase.skylords.eu" + gCard.Image.Url);
                        images.push(img);
    
    
                    }
                });
            }
        }
    };
    
    xmlhttpSB.open("GET", "proxy.php?url=https://cardbase.skylords.eu/Cards/GetCards", true);
    xmlhttpSB.send();

});
