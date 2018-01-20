var resizing = false;
$('.resizer').mousedown(function(e){
	e.preventDefault();

	resizing = true;
});
$('.page-simulations').mouseup(function(e){
	resizing = false;
});

$(document).mousemove(function(e){
	var width = e.pageX;

	if(!resizing) {
		return true;
	}

	if(width < 220) {
		width = 220;
	}
	if(width > 500) {
		width = 500;
	}

	var windowsWidth = window.innerWidth;

	$('.sidebar').css('width', width + 'px');
	$('.resizer').css('left', (width-2.5) + 'px');
	$('.main').css('width', (windowsWidth - width) + 'px');
    

});

$(".on-off").bootstrapSwitch({
    onText: "TAK",
    offText: "NIE"
});

$('[data-toggle="collapse"]').click(function(e){
	$(this).find('.collapse-icon').toggleClass('ion-ios-minus-empty');
	$(this).find('.collapse-icon').toggleClass('ion-ios-plus-empty');
});