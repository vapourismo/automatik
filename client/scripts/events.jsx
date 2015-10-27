function emit(tag, ...args) {
	window.dispatchEvent(new CustomEvent("user/" + tag, {detail: args}));
};

function on(tag, callback) {
	tag = "user/" + tag;

	const listener = function (ev) {
		callback(...ev.detail);
	};

	if (!callback._userListeners)
		callback._userListeners = {};

	if (tag in callback._userListeners)
		window.removeEventListener(tag, callback._userListeners[tag]);

	callback._userListeners[tag] = listener;

	window.addEventListener(tag, listener);
};

function off(tag, callback) {
	tag = "user/" + tag;

	if (!callback._userListeners || !(tag in callback._userListeners))
		return;

	window.removeEventListener(tag, callback._userListeners[tag]);
	delete callback._userListeners[tag];
}

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27) emit("Escape");
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body) emit("Escape");
});

module.exports = {
	emit: emit,
	on: on,
	off: off
};
