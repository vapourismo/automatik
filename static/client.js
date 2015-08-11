$(document).ready(function() {
	$(".box").hover(
		function() {
			$(this).stop().animate({backgroundColor: "#963"}, 200);
		},
		function() {
			$(this).stop().animate({backgroundColor: "#369"}, 200);
		}
	);
});
