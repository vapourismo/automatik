function Room(info) {
	this.info = info;
	this.entities = [];
}

// Room.prototype = {
// 	renderBox: function () {
// 		return tpls.boxes.single({
// 			label: this.info.name,
// 			href: "/rooms/" + this.info.id
// 		});
// 	}
// };

module.exports = Room;
