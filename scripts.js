var upgradeData = {};
var globalCards = {};
var currentCardList = {};
var globalMaps = {};
var deckList = {};
var selectedDeck = null;

var documentRoot = window.location.href;
documentRoot = documentRoot.substring(0, documentRoot.lastIndexOf("/") + 1);
var domain = window.location.hostname;

// Load or Store Data to HTML5 storage
function SaveData(){
	var name = $("#deckListSelect").val();
	localStorage.setItem('deckList', JSON.stringify(deckList));
	localStorage.setItem('selectedDeckName', JSON.stringify(name));
}
function LoadData(){
	deckList = JSON.parse(localStorage.getItem('deckList')) || {};
	var selectedDeckName = JSON.parse(localStorage.getItem('selectedDeckName'));
	selectedDeck = deckList[selectedDeckName];
	ShowDeckList();
	$("#deckListSelect option[value='"+selectedDeckName+"']").attr('selected',true);
	ShowSelectedDeck();
}



// --- HELPER FUNCTIONS ---
function refineURL()
{
    var currURL= window.location.href;
    var afterDomain= currURL.substring(currURL.indexOf('/') + 1);
    var beforeQueryString= afterDomain.split("?")[0];
    return beforeQueryString;
}

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

function getGlobalCardIndex(card){
	var ind = -1;
	$.each(globalCards, function(index, x){
		var val = globalCards[index];
		var valName = fixName(val.Name) + cardAffinityToString(val.Affinity);
		var cardName = fixName(card.Name) + cardAffinityToString(card.Affinity);
		if(valName == cardName){ind = index;}
	});
	return ind;
}

function getUpgradeData(cardName, cardLevel){
	return upgradeData[cardName + cardLevel];
}

$.urlParam = function(name)  
{  
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href); 
	if(results == null){return "";}
    return results[1] || 0;  
}


// --- SORTING FUNCTIONS ---

function getCardsThatFitOrbCode(code, cards){
	var n = {};
	$.each(cards, function(index, card){

		for(var i = 1; i < code.length+1; i++){
			if(card.OrbInfo.OrbCode.length == i){
				var countR = (card.OrbInfo.OrbCode.match(/R/g) || []).length;
				var countB = (card.OrbInfo.OrbCode.match(/B/g) || []).length;
				var countN = (card.OrbInfo.OrbCode.match(/N/g) || []).length;
				var countS = (card.OrbInfo.OrbCode.match(/S/g) || []).length;
				var codeSub = code.substr(0, i);

				var codecountR = (codeSub.match(/R/g) || []).length;
				var codecountB = (codeSub.match(/B/g) || []).length;
				var codecountN = (codeSub.match(/N/g) || []).length;
				var codecountS = (codeSub.match(/S/g) || []).length;

				if(countR <= codecountR && countB <= codecountB && countN <= codecountN && countS <= codecountS){
					n[index] = index;
				}
			}
		}
	}); 
	return n;
}

function getCardsSortedAlphabetically(asc, cards){
	if(asc){
		return Object.keys(cards).sort(function(a,b){
			var compA = cards[a].Name.toUpperCase();
			var compB = cards[b].Name.toUpperCase();
			return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
		});
	}else{
		return Object.keys(cards).sort(function(a,b){
			var compA = cards[b].Name.toUpperCase();
			var compB = cards[a].Name.toUpperCase();
			return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
		});
	}
}

function getAllCardsWithUnitRange(isRanged, cards){
	var n = {}; $.each(cards, function(index, card){
		if(isRanged == 1 && (card.IsRanged || card.OffenseType == 4)){n[index] = index;return true;}
		if(isRanged == 0 && !card.IsRanged && card.OffenseType != 4){n[index] = index;return true;}
	});return n;
}
function getAllCardsWithUnitSize(size, cards){
	var n = {}; $.each(cards, function(index, card){if(card.Type != 2 || card.DefenseType == size){n[index] = index;}}); return n;
}
function getAllCardsWithUnitStrongAgainst(size, cards){
	var n = {}; $.each(cards, function(index, card){if(card.Type != 2 || card.OffenseType == size){n[index] = index;}}); return n;
}

function getCardsSortedByCost(asc, cards){
	if(!asc){return Object.keys(cards).sort(function(a,b){return cards[b].Cost-cards[a].Cost});}else{return Object.keys(cards).sort(function(a,b){return cards[a].Cost-cards[b].Cost});}
}
function getCardsSortedByOrbs(asc, cards){
	if(!asc){return Object.keys(cards).sort(function(a,b){return cards[b].OrbInfo.OrbCode.length-cards[a].OrbInfo.OrbCode.length});}else{return Object.keys(cards).sort(function(a,b){return cards[a].OrbInfo.OrbCode.length-cards[b].OrbInfo.OrbCode.length});}
}
function getAllCardsInTier(tier, cards){
	var n = {}; $.each(cards, function(index, card){if(card.OrbInfo.OrbCode.length == tier){n[index] = index;}}); return n;
}
function getAllCardsWithType(type, cards){
	var n = {}; $.each(cards, function(index, card){if(card.Type == type){n[index] = index;}}); return n;
}
function getAllCardsWithColor(color, cards){
	var n = {}; $.each(cards, function(index, card){if(card.Color == color){n[index] = index;}}); return n;
}
function getAllCardsWithRarity(rarity, cards){
	var n = {}; $.each(cards, function(index, card){if(card.Rarity == rarity){n[index] = index;}}); return n;
}
function getAllCardsWithEdition(edition, cards){
	var n = {}; $.each(cards, function(index, card){if(card.Edition == edition){n[index] = index;}}); return n;
}
function getAllCardsWithAffinity(affinity, cards){
	var n = {}; $.each(cards, function(index, card){if(card.Affinity == affinity){n[index] = index;}}); return n;
}

function getAllCardsWithNameLike(name, cards){
	var n = {}; $.each(cards, function(index, card){if(card.Name.toLowerCase().indexOf(name.toLowerCase()) >= 0){n[index] = index;}}); return n;
}
function getAllCards(){
	var n = {}; $.each(globalCards, function(index, card){n[index] = index;}); return n;
}

function getUpgradeKeys(upgrades){
	return Object.keys(upgrades).sort(function(a,b){return upgrades[a].Era-upgrades[b].Era});
}

function getAllMapsWithPlayerCount(count, maps){
	var n = {}; $.each(maps, function(index, map){if(map.Players == count){n[index] = index;}}); return n;
}


function cardsFromKeys(sortedKeys){
	var n = {};
	$.each(sortedKeys, function(index, key){
		n[index] = globalCards[key];
	});
	return n;
}

function mapsFromKeys(sortedKeys){
	var n = {};
	$.each(sortedKeys, function(index, key){
		n[index] = globalMaps[key];
	});
	return n;
}

// Renders a list of cards to the GUI
function displayCardList(cardList){
	currentCardList = cardList;
	$(".cardList").empty();
	$.each(cardList, function(index, card){
		var html = "<div class='cardDiv' data-id='" + index + "'>"
		+ "<img class='cardImg' alt='" + card.Name + "' src='https://api.skylords.eu" + card.Image.Url + "'>"
		+ "</div>";
		$(".cardList").append(html);
	});
	
	var newWidth = $("#cardSizeSlider").val();
	var newHeight = newWidth * 1.36363;
	$(".cardDiv").css("width", newWidth);
	$(".cardDiv").css("height", newHeight);
}

// Shows popup with decklink
function shareDeck(){
	if(selectedDeck == null){alert("No Deck Selected."); return;}
	if(Object.keys(selectedDeck).length < 1){alert("No Deck Selected."); return;}

	var deckData = $("#deckListSelect").val() + ">";
	$.each(selectedDeck, function(index, card){
		deckData += getGlobalCardIndex(card) + "|";
	});
	var encodedDeck = btoa(deckData);
	window.prompt("Press Ctrl+C to copy!", documentRoot + "cards.html?d=" + encodedDeck);
}


function SwapCardAndMapFilters(showCards){
	if(showCards){
		$(".mapSettings").hide();
		$(".cardSettings").show();
	}else{
		$(".cardSettings").hide();
		$(".mapSettings").show();
	}
}

// Render Map Data
function ShowMaps(maps){
	$(".cardList").empty();

	$.each(maps, function(index, map){

		var html = "<div class='mapDiv' style='background-image: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://api.skylords.eu" + map.Image.Url + ")' data-id='" + index + "'>"
		+ "<p class='mText'>" + map.Name + " - <span class='blue'>" + map.Players + " Players</span></p>"
		+ "<p class='sText'>" + map.SubTitle + "</p>"
		//+ "<p class='sText'>" + map.Description + "</p>"
	    + "<img class='mapPreview' src='https://api.skylords.eu" + map.Map.Url + "'>"

		+ "</div>";

		$(".cardList").append(html);
	});


	$(".mapDiv").hover(
		function() {
			$("#tooltip").css("display", "block");
			$("#tooltip").css("top", $(this).position().top);
			$("#tooltip").css("left", $(this).position().left + $(this).width());
			$("#tooltip").empty();

			var html = "";
			var index = $(this).attr("data-id");
		    var map = globalMaps[index];

		
			html += "<p class='mText'>Loot:</p>";
			$.each(map.Difficulties, function(index2, diff){

				html += "<div class='thirdDiv'>";
				html += "<p class='sText'><span class='blue'>" + diff + "</span></p>";
				$.each(map[diff], function(index3, card){
					html += "<p class='miniText'>" + card.CardName + "</p>";
				});
				html += "</div>";
			});

	
			html += "<br/><br/><div class='halfDiv'>"
			
			+ "<p class='sText'><span class='blue'>Unlocks:</span></p>";
			$.each(map.Unlocks, function(i, m){
				html += "<p class='miniText'>" + m + "</p>";
			});
			html += "</div>"

			+ "<div class='halfDiv'>"
			+ "<p class='sText'><span class='blue'>Requires:</span></p>";
			$.each(map.Prerequisite, function(i, m){
				html += "<p class='miniText'>" + m + "</p>";
			});
			html += "</div>";



			$("#tooltip").append(html);

			if($("#tooltip").position().left + $("#tooltip").width() > $("body").width()){
				$("#tooltip").css("left", $(this).position().left - $("#tooltip").width());
			}
			if($("#tooltip").position().top + $("#tooltip").height() + 20 > $("body").height()){
				$("#tooltip").css("top", $(this).position().top + $(this).height() - $("#tooltip").height());
			}

			return false;
		}, function() {
			$("#tooltip").css("display", "none");
			return false;
		}
	);
}

// Render Selected Deck
function ShowSelectedDeck(){
	$("#currentDeckDiv").empty();
	if(selectedDeck != null){

		// render card divs
		$.each(selectedDeck, function(index, val){
			var card = selectedDeck[index];
			var html = "<div class='deckCard' data-id='" + index + "' style='background-image: url(https://api.skylords.eu" + card.Image.Url + ");'></div>";
			$("#currentDeckDiv").append(html);
		});


		// search for on shift click
		$(".deckCard").click(function(e) {
			if (e.shiftKey){
				var index = $(this).attr("data-id");
				var card = selectedDeck[index];
				$("#resetAllButton").trigger("click");
				$("#nameTextbox").val(card.Name);
				applyAllSorting();
			}
		});

		// remove from deck on double click
		$(".deckCard").dblclick(function() {
			var index = $(this).attr("data-id");
			var card = selectedDeck[index];
			
			if(selectedDeck != null){
				var namestring = fixName(card.Name) + cardAffinityToString(card.Affinity);
				delete selectedDeck[namestring];
				ShowSelectedDeck();
			}
		});

		// show bigger version on hover
		$(".deckCard").hover(
			function() {
				$("#tooltip").css("display", "block");
				$("#tooltip").addClass("deckCardTip");
				$("#tooltip").css("top", $(this).position().top);
				$("#tooltip").css("left", $(this).position().left + $(this).width());
				$("#tooltip").empty();
	
				var index = $(this).attr("data-id");
				var card = selectedDeck[index];

				var html = "";
				html += '<img style="height: 250px;" src="https://api.skylords.eu' + card.Image.Url + '">';
	
				$("#tooltip").append(html);
	
				if($("#tooltip").position().left + $("#tooltip").width() > $("body").width()){
					$("#tooltip").css("left", $(this).position().left - $("#tooltip").width());
				}
				if($("#tooltip").position().top + $("#tooltip").height() + 20 > $("body").height()){
					$("#tooltip").css("top", $(this).position().top + $(this).height() - $("#tooltip").height());
				}
	
				return false;
			}, function() {
				$("#tooltip").removeClass("deckCardTip");
				$("#tooltip").css("display", "none");
				return false;
			}
		);

	}
	
	SaveData();
}

// Render Deck List
function ShowDeckList(){
	$("#deckListSelect").empty();
	$("#deckListSelect").append('<option value="" disabled selected hidden>No Deck Selected</option>');

	$.each(deckList, function(index, deck){
		$("#deckListSelect").append("<option value='" + index + "'>" + index + "</option>");
	});
}


// Adds Hover + Click handlers to Cards
function AddCardHovers(){

	// Show link popup on shift-click
	$(".cardDiv").click(function(e) {
		if (e.shiftKey){
			var index = $(this).attr("data-id");
			var card = currentCardList[index];
			window.prompt("Press Ctrl+C to copy the link!", documentRoot.replace(/\/[^\/]+$/,"/") + "cards.html?c=" + encodeURIComponent(card.Name));
		}
	});

	// Add to current deck on double click
	$(".cardDiv").dblclick(function() {
		var index = $(this).attr("data-id");
		var card = currentCardList[index];
		
		if(selectedDeck != null){
			if(Object.keys(selectedDeck).length < 20){
				var namestring = fixName(card.Name) + cardAffinityToString(card.Affinity);
				selectedDeck[namestring] = card;
				SaveData();
				ShowSelectedDeck();
			}
		}
	});

	// Display full info tooltip on hover
	$(".cardDiv").hover(
		function() {
			$("#tooltip").css("display", "block");
			$("#tooltip").css("top", $(this).position().top);
			$("#tooltip").css("left", $(this).position().left + $(this).width());
			$("#tooltip").empty();

			var html = "";
			var index = $(this).attr("data-id");
		    var card = currentCardList[index];

			$.each(card.Abilities, function(index, val){
				html += "<p>" + val.Name;
				if(val.Power > 0){html += " <span class='blue'>(Cost: " + val.Power + ")</span>";}
				html += "</p>";
				html += "<p class='small'>" + val.Description + "</p><br/>";
			});

			if(html.length < 15){html = "<p>No Data for this Card from Skylords.eu API</p>";}
			html += "<p>Upgrades:</p>";

			var upKeys = getUpgradeKeys(card.Upgrades);
			$.each(upKeys, function(index, key){
				var val = card.Upgrades[key];
				var namestring = card.Name + cardAffinityToString(card.Affinity);
				var upgrade = getUpgradeData(namestring, val.Era);
				if(val.Description == null){
					html += "<p class='small'>No Upgrade Data Available</p>";
				}else{
					html += "<p class='small'><span class='blue'>Level " + val.Era + ":</span> " + val.Description + "</p>";
					if(!!upgrade){html += "<p class='small'><span class='blue'>Drops on Map: </span>" + upgrade.mapName + " - " + upgrade.mapLevel + "</p><br/>";}
				}
			});
			

			$("#tooltip").append(html);

			if($("#tooltip").position().left + $("#tooltip").width() > $("body").width()){
				$("#tooltip").css("left", $(this).position().left - $("#tooltip").width());
			}
			if($("#tooltip").position().top + $("#tooltip").height() + 20 > $("body").height()){
				$("#tooltip").css("top", $(this).position().top + $(this).height() - $("#tooltip").height());
			}

			return false;
		}, function() {
			$("#tooltip").css("display", "none");
			return false;
		}
	);
}

// Render Card list with all sorting applied
function applyAllSorting(){

	var sortByCost = $("#sortByCostCheckbox").is(':checked') ? 1 : 0;
	var sortByOrbs = $("#sortByOrbsCheckbox").is(':checked') ? 1 : 0;
	var sortByAlphabet = $("#sortByAlphabetCheckbox").is(':checked') ? 1 : 0;
	var useOrbList = $("#showPlayableCheckbox").is(":checked") ? 1 : 0;
	var sortAsc = $("#sortAscCheckbox").is(':checked') ? true : false;
	var name = $("#nameTextbox").val();

	var currentCards = cardsFromKeys(getAllCards());
	if(name != ""){
		currentCards = cardsFromKeys(getAllCardsWithNameLike(name, currentCards));
	}

	if(useOrbList == 1){
		var orbCode = "";
		orbCode += $('input[name=orbst1]:checked').val();
		orbCode += $('input[name=orbst2]:checked').val();
		orbCode += $('input[name=orbst3]:checked').val();
		orbCode += $('input[name=orbst4]:checked').val();

		currentCards = cardsFromKeys(getCardsThatFitOrbCode(orbCode, currentCards));
	}

	// Each of these blocks applies one filter block
	var finCards = {};
	$( ".colorCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsWithColor($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;


	var finCards = {};
	$( ".tierCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsInTier($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;


	finCards = {};
	$( ".typeCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsWithType($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;


	finCards = {};
	$( ".rarityCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsWithRarity($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;


	finCards = {};
	$( ".editionCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsWithEdition($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;

	
	finCards = {};
	$( ".affinityCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsWithAffinity($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;


	finCards = {};
	$( ".unitRangedCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsWithUnitRange($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;

	finCards = {};
	$( ".unitSizeCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsWithUnitSize($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;

	finCards = {};
	$( ".unitCountersCheckBox" ).each(function(index) {
		if($(this).is(":checked")){
			$.extend(finCards, cardsFromKeys(getAllCardsWithUnitStrongAgainst($(this).val(), currentCards)));
		}
	});
	currentCards = finCards;
	


	if(sortByCost == 1){
		currentCards = cardsFromKeys(getCardsSortedByCost(sortAsc, currentCards));
	}
	if(sortByOrbs == 1){
		currentCards = cardsFromKeys(getCardsSortedByOrbs(sortAsc, currentCards));
	}
	if(sortByAlphabet == 1){
		currentCards = cardsFromKeys(getCardsSortedAlphabetically(sortAsc, currentCards));
	}
	displayCardList(currentCards);


	AddCardHovers();

	
	// Clean URL if it had a card or deck link added
	var nameFromUrl = $.urlParam("c");
	if(nameFromUrl.length > 1){
		var myNewURL = refineURL();
		window.history.pushState({}, document.title, "/" + myNewURL );
	}	
	var nameFromUrl = $.urlParam("d");
	if(nameFromUrl.length > 1){
		var myNewURL = refineURL();
		window.history.pushState({}, document.title, "/" + myNewURL );
	}
}


$(document).ready(function(){
	

	// All onclick etc handler get added here

	// Switch Views Maps/Cards
	$("#showMapsButton").click(function(){
		if($(this).text() != "Show Maps"){
			$(this).text("Show Maps");
			SwapCardAndMapFilters(true);
			applyAllSorting();
		}else{
			$(this).text("Show Cards");
			
			var finMaps = {};
			$( ".mapPlayerCountCheckBox" ).each(function(index) {
				if($(this).is(":checked")){
					$.extend(finMaps, mapsFromKeys(getAllMapsWithPlayerCount($(this).val(), globalMaps)));
				}
			});

			SwapCardAndMapFilters(false);
			ShowMaps(finMaps);
		}
	});
	$(".mapSettings").hide();



	// Sorting Handlers
	$("#nameTextbox").on('input propertychange paste', function(){applyAllSorting();});
	$(".colorCheckBox").change(function(){applyAllSorting();});
	$(".tierCheckBox").change(function(){applyAllSorting();});
	$(".typeCheckBox").change(function(){applyAllSorting();});
	$(".rarityCheckBox").change(function(){applyAllSorting();});
	$(".editionCheckBox").change(function(){applyAllSorting();});
	$(".affinityCheckBox").change(function(){applyAllSorting();});
	$(".unitRangedCheckBox").change(function(){applyAllSorting();});
	$(".unitSizeCheckBox").change(function(){applyAllSorting();});
	$(".unitCountersCheckBox").change(function(){applyAllSorting();});
	$("#showPlayableCheckbox").change(function(){applyAllSorting();});
	$(".orbSelecterRadio").change(function(){applyAllSorting();});

	$("#sortByCostCheckbox").change(function(){
		if($("#sortByCostCheckbox").is(":checked")){$("#sortByOrbsCheckbox").prop( "checked", false );$("#sortByAlphabetCheckbox").prop( "checked", false );}applyAllSorting();
	});
	$("#sortByOrbsCheckbox").change(function(){
		if($("#sortByOrbsCheckbox").is(":checked")){$("#sortByCostCheckbox").prop( "checked", false );$("#sortByAlphabetCheckbox").prop( "checked", false );}applyAllSorting();
	});
	$("#sortByAlphabetCheckbox").change(function(){
		if($("#sortByAlphabetCheckbox").is(":checked")){$("#sortByCostCheckbox").prop( "checked", false );$("#sortByOrbsCheckbox").prop( "checked", false );}applyAllSorting();
	});
	$("#sortAscCheckbox").change(function(){applyAllSorting();});

	// Sort maps by player count
	$(".mapPlayerCountCheckBox").change(function(){
		var finMaps = {};
		$( ".mapPlayerCountCheckBox" ).each(function(index) {
			if($(this).is(":checked")){
				$.extend(finMaps, mapsFromKeys(getAllMapsWithPlayerCount($(this).val(), globalMaps)));
			}
		});
		ShowMaps(finMaps);
	});


	// Card size slider
	$("#cardSizeSlider").on('input', function(){
		var newWidth = $(this).val();
		var newHeight = newWidth * 1.36363;
		$(".cardDiv").css("width", newWidth);
		$(".cardDiv").css("height", newHeight);
	});

	// Check/Uncheck all Color sorting
	$("#checkColorsButton").click(function(){
		if($(this).text() != "All"){
			$(this).text("All");
			$(".colorCheckBox").prop( "checked", false );
		}else{
			$(this).text("None");
			$(".colorCheckBox").prop( "checked", true );
		}
		applyAllSorting();
	});

	// Reset All Sorting
	$("#resetAllButton").click(function(){
		SwapCardAndMapFilters(false);
		$('input[type=checkbox]').prop('checked', true);
		$('#sortByCostCheckbox').prop('checked', false);
		$('#sortByAlphabetCheckbox').prop('checked', false);
		$('#showPlayableCheckbox').prop('checked', false);
		$("#nameTextbox").val("");
		$("#showMapsButton").text("Show Maps");
		SwapCardAndMapFilters(true);
		applyAllSorting();
	});

	// Share deck link
	$("#shareDeckButton").click(function(){
		shareDeck();
	});

	// Open deck.html with the encoded deck data
	$("#saveDeckImageButton").click(function(){
		if(selectedDeck == null){alert("No Deck Selected."); return;}
		if(Object.keys(selectedDeck).length < 1){alert("No Cards in Deck..."); return;}

		var deckData = $("#deckListSelect").val() + ">";
		$.each(selectedDeck, function(index, card){
			deckData += getGlobalCardIndex(card) + "|";
		});
		var encodedDeck = btoa(deckData);

		window.open(documentRoot.replace(/\/[^\/]+$/,"/") + "deck.html?d=" + encodedDeck, '_blank');
	});
	

	// Changes selected deck
	$("#deckListSelect").change(function(){
		var name = $("#deckListSelect").val();
		selectedDeck = deckList[name];
		ShowSelectedDeck();
	});

	// Creates new deck
	$("#newDeckButton").click(function(){
		var name = $("#newDeckTextBox").val();
		name = name.trim();
		if(name.length > 0){
			deckList[name] = {};
			$("#newDeckTextBox").val("");
			ShowDeckList();
			$("#deckListSelect option[value='"+name+"']").attr('selected',true);
			selectedDeck = deckList[name];
			ShowSelectedDeck();
		}
	});

	// Deletes current deck
	$("#deleteDeckButton").click(function(){
		var name = $("#deckListSelect").val();
		name = name.trim();
		if(name.length > 0){
			delete deckList[name];
			selectedDeck = null;
			ShowDeckList();
			if(Object.keys(deckList).length > 0){		
				var newName = $("#deckListSelect").val();
				selectedDeck = deckList[newName];
			}
			ShowSelectedDeck();
		}
	});

	// Add explaining tooltip 
	$(".infoBox").hover(
		function() {
			$("#tooltip").css("display", "block");
			$("#tooltip").css("top", $(this).position().top);
			$("#tooltip").css("left", $(this).position().left + $(this).width());
			$("#tooltip").empty();

			var html = "";
			html += '<p class="textboxText">'
				+ 'Deckbuilder<br/><br/>- Create a deck by choosing a name and pressing NEW<br/>'
				+ '- Add cards by double-clicking them in the Cardviewer<br/>'
				+ '- Remove cards by double-clicking them inside the deck<br/>'
				+ '- Change your active deck with the drop-down menu<br/>'
				+ '- Delete a deck by selecting it and pressing DEL<br/>'
				+ '- Shift-clicking a card in your deck searches for the card<br/>'
				+ '- Your decks are saved inside your browser with HTML5 storage<br/><br/>'
				+ 'Sharing<br/><br/>- Shift Click a card to get a permanent link<br/>'
				+ '- You can share your deck either as a deck-link or as an image<br/>'
				+ '- Clicking on a deck-link will add the deck to your decklist<br/>'
				+'</p>';

			$("#tooltip").append(html);

			if($("#tooltip").position().left + $("#tooltip").width() > $("body").width()){
				$("#tooltip").css("left", $(this).position().left - $("#tooltip").width());
			}
			if($("#tooltip").position().top + $("#tooltip").height() + 20 > $("body").height()){
				$("#tooltip").css("top", $(this).position().top + $(this).height() - $("#tooltip").height());
			}

			return false;
		}, function() {
			$("#tooltip").css("display", "none");
			return false;
		}
	);


	// Request Card Data from Skylords API
	var xmlhttpSB = new XMLHttpRequest();
	xmlhttpSB.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			// Parse the card data from .json
			globalCards = JSON.parse(this.responseText).Result;

			// Fix missing OrbInfo - cards will be concidered to be T4 all neutral
			$.each(globalCards, function(index, card){
				if(card.OrbInfo == null || card.OrbInfo == undefined){
					globalCards[index].OrbInfo = {};
					globalCards[index].OrbInfo.OrbCode = "1111";
					//console.log(card.Name + " has no orb info"); // This line will display all cards with missing OrbInfo
				}
			});	
			
			LoadData();


			// Parse url data for card link
			var nameFromUrl = $.urlParam("c");
			if(nameFromUrl.length > 1){
				$("#nameTextbox").val(decodeURIComponent(nameFromUrl));
			}

			// Parse url data for deck link, create a new one and add it
			var deckFromUrl = $.urlParam("d");
			if(deckFromUrl.length > 1){
				var decodedDeck = atob(deckFromUrl);

				var deckName = decodedDeck.split('>')[0];
				var r = 1;
				while(deckList[deckName] != undefined){
					deckName = deckName+""+r;
					r++;
				}
				var newDeck = {};

				var data = decodedDeck.split('>')[1];
				var cards = data.split('|');
				$.each(cards, function(ind){
					var gIndex = parseInt(cards[ind], 10);
					if(gIndex > -1){
						var gCard = globalCards[gIndex];
						var namestring = fixName(gCard.Name) + cardAffinityToString(gCard.Affinity);
						newDeck[namestring] = gCard;
					}
				});
				deckList[deckName] = newDeck;
				selectedDeck = deckList[deckName];

				ShowDeckList();
				$("#deckListSelect option[value='"+deckName+"']").attr('selected',true);
				ShowSelectedDeck();
			}

			applyAllSorting();
		}
	};


	var proxy = "proxy.php?url=";
	if(domain.indexOf("skylords.eu") > -1){proxy = "";}

	xmlhttpSB.open("GET", proxy + "https://api.skylords.eu/Cards/GetCards", true);
	xmlhttpSB.send();


	// Request Map Data from Skylords API
	var xmlhttpMaps = new XMLHttpRequest();
	xmlhttpMaps.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			globalMaps = JSON.parse(this.responseText).Result;
			
			// Copy upgrade data into own structure
			$.each(globalMaps, function(index1, map){
				$.each(map.Difficulties, function(index2, diff){
					$.each(map[diff], function(index3, card){
						var u = {};
						u.mapName = map.Name;
						u.cardName = card.CardName;
						u.cardLevel = card.Era;
						u.mapLevel = diff;
						upgradeData[card.CardName + card.Era] = u;
					});
				});
			});
		}
	};

	xmlhttpMaps.open("GET", proxy + "https://api.skylords.eu/Maps/GetMaps", true);
	xmlhttpMaps.send();

});