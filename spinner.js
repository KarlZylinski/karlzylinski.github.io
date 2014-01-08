var current_image = 0;
var num_images = 0;
var spinner_id = 0;
var aborted = false;
var hovering = false;

function show_next_spinner_image(sid, container) {
	if(hovering) {
		setTimeout("show_next_spinner_image(" + sid + ", \"" + container + "\")", 5000);
		return;
	}

	if(sid != spinner_id) {
		return;
	}
	
	current_image--;
	
	if(current_image < 0)
		current_image = num_images - 1;
	
	var spinner_image = $(container + ' img').eq(current_image);
	
	$(container + ' img').hide();
	spinner_image.show();
	
	setTimeout("show_next_spinner_image(" + sid + ", \""  + container + "\")", 5000);
}

function start_spinner(container) {
	$(container).mouseenter(function() {
		hovering = true;
	});
	
	$(container).mouseleave(function() {
		hovering = false;
	});

	var spinner_images = $(container + ' img');
	num_images = spinner_images.size();
	
	show_next_spinner_image(0, container);
}