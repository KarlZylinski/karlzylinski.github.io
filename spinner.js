

function start_spinner(name, container) {
	var current_timeout = null;

	function show_next_spinner_image(name, num_images, current_image, container, override_hover) {
		clearTimeout(current_timeout);

		if(window[name + "_hovering"] && !override_hover) {
			current_timeout = setTimeout(function() { show_next_spinner_image(name, num_images, current_image, container, false); }, 5000);
			return;
		}
		
		current_image++;
		
		if(current_image >= num_images)
			current_image = 0;
		
		var spinner_image = $(container + ' .item').eq(current_image);
		
		$(container + ' .item').hide();
		spinner_image.show();

		var selectors = $(container + " .selectors div");
		selectors.removeClass("current");
		selectors.eq(current_image).addClass("current");
		
		current_timeout = setTimeout(function() { show_next_spinner_image(name, num_images, current_image, container, false); }, 5000);
	}

	var container_dom = $(container);

	window[name + "_hovering"] = false;

	container_dom.mouseenter(function() {
		window[name + "_hovering"] = true;
	});
	
	container_dom.mouseleave(function() {
		window[name + "_hovering"] = false;
	});

	var spinner_images = $(container + ' .item');
	var num_images = spinner_images.size();
	var selectors = $('<div class="selectors"></div>');
	container_dom.append(selectors);

	for (var i = 0; i < num_images; ++i)
	{
		var selector = $('<div></div>');
		selectors.append(selector);
	}

	$(container + " .selectors div").each(function(index) {
		$(this).click(function() {
			show_next_spinner_image(name, num_images, index - 1 >= 0 ? index - 1 : num_images - 1, container, true);
		});
	});

	var spinner_image = $(container + ' .item').eq(0);
	$(container + ' .item').hide();
	spinner_image.show();
	$(container + " .selectors div").eq(0).addClass("current");

	function get_random_int(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}

	current_timeout = setTimeout(function() { show_next_spinner_image(name, num_images, 0, container, false); }, get_random_int(2000,7000));
}