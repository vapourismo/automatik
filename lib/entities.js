var path = require("path");
var tpls = require("./templates");
var util = require("./utilities");
var db = require("./database");
var backends = require("./backends");

const classes = {};
const rooms = {};
const entities = {};

util.iterateFiles(path.join(path.dirname(module.filename), "classes"), function (file) {
	var mod = require(file);

	for (var id in mod) {
		console.log("Loaded class '" + mod[id].meta.name + "' (" + id + ")");
		classes[id] = mod[id];
	}
});

function Entity(entity, slots, comm) {
	this.id = entity.id;
	this.name = entity.name;
	this.instance = new classes[entity.type](entity.conf, slots);

	this.instance.listen(comm.updateEntity.bind(comm, this));
}

Entity.prototype = {
	render: function () {
		return this.instance.render();
	},

	renderBox: function () {
		return tpls.boxes.entity({
			id: this.id,
			name: this.name,
			value: this.instance.render()
		});
	},

	click: function (client) {
		this.instance.click(client, this);
	},

	inform: function (client, msg) {
		this.instance.inform(client, msg);
	}
};

function loadRooms(callback) {
	db.query("SELECT id, name FROM rooms", function (err, result) {
		if (err) {
			console.error("Failed to fetch room instances");
			process.exit(1);
			return;
		}

		result.rows.forEach(function (room) {
			room.entities = [];
			rooms[room.id] = room;
			console.log("Created room '" + room.name + "'");
		});

		if (callback)
			callback();
	});
}

function loadEntities(comm) {
	db.query("SELECT id, room, name, type, config FROM entities", function (err, result) {
		if (err) {
			console.error("Failed to fetch entity instances");
			process.exit(1);
			return;
		}

		result.rows.forEach(function (row) {
			if (row.type in classes) {
				db.query(
					"SELECT name, value FROM slots s WHERE entity = $1",
					[row.id],
					function (err2, result2) {
						if (err2) {
							console.warn("Entity '" + row.name + "': Failed to fetch slots");
							return;
						}

						var slots = {}, foundSlots = true;
						result2.rows.forEach(function (row2) {
							if (row2.value in backends.datapoints) {
								slots[row2.name] = backends.datapoints[row2.value];
							} else {
								console.warn("Entity '" + row.name + "': Slot '" + row2.name + "': Datapoint with ID " + row2.value + " does not exist");

								// TODO: Check whether slot is mandatory
								foundSlots = false;
							}
						});

						if (!foundSlots)
							return;

						var entity = new Entity(row, slots, comm);
						entities[row.id] = entity;

						if (row.room in rooms)
							rooms[row.room].entities.push(entity);

						console.log("Instantiated entity '" + row.name + "'");
					}
				);
			} else {
				console.warn("Entity '" + row.name + "': Type '" + row.type + "'' does not exist");
			}
		});
	});
}

function loadAll(comm, callback) {
	loadRooms(function () {
		loadEntities(comm);
		if (callback) callback();
	});
}

module.exports = {
	classes: classes,
	rooms: rooms,
	entities: entities,
	loadRooms: loadRooms,
	loadEntities: loadEntities,
	loadAll: loadAll
};
