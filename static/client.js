function updateClock() {
	$("#clock").html(new Data().toLocaleString());
}

window.setInterval(updateClock, 1000);
$(document).ready(updateClock);
