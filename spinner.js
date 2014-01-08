var hovering = false;

function show_next_spinner_image(num_images, current_image, container) {
	if(hovering) {
		setTimeout("show_next_spinner_image(" + num_images + ", " + current_image + ", \""  + container + "\")", 5000);
		return;
	}
	
	current_image--;
	
	if(current_image < 0)
		current_image = num_images - 1;
	
	var spinner_image = $(container + ' div').eq(current_image);
	
	$(container + ' div').hide();
	spinner_image.show();
	
	setTimeout("show_next_spinner_image(" + num_images + ", " + current_image + ", \""  + container + "\")", 5000);
}

function start_spinner(container) {
	$(container).mouseenter(function() {
		hovering = true;
	});
	
	$(container).mouseleave(function() {
		hovering = false;
	});

	var spinner_images = $(container + ' div');
	var num_images = spinner_images.size();

	var spinner_image = $(container + ' div').eq(0);
	$(container + ' div').hide();
	spinner_image.show();
	
	show_next_spinner_image(num_images, 0, container);
}