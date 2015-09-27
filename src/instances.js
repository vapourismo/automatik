var tpls = require("../lib/templates");
var classes = require("../lib/classes");
var db = require("../lib/database");

var Entity = require("../lib/entity");

var roomInstances = {};
var entityInstances = {};

function loadInstances(datapoints, comm) {
	db.query("SELECT id, name FROM rooms", function (err, result) {
		if (err) {
			console.error("Failed to fetch room instances");
			process.exit(1);
			return;
		}

		result.rows.forEach(function (room) {
			room.entities = [];
			roomInstances[room.id] = room;
			console.log("Created room '" + room.name + "'");
		});
	});

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
							if (row2.value in datapoints) {
								slots[row2.name] = datapoints[row2.value];
							} else {
								console.warn("Entity '" + row.name + "': Slot '" + row2.name + "': Datapoint with ID " + row2.value + " does not exist");

								// TODO: Check whether slot is mandatory
								foundSlots = false;
							}
						});

						if (!foundSlots)
							return;

						var entity = new Entity(row, slots, comm);
						entityInstances[row.id] = entity;

						if (row.room in roomInstances)
							roomInstances[row.room].entities.push(entity);

						console.log("Instantiated entity '" + row.name + "'");
					}
				);
			} else {
				console.warn("Entity '" + row.name + "': Type '" + row.type + "'' does not exist");
			}
		});
	});
}

module.exports = {
	entities: entityInstances,
	rooms: roomInstances,
	loadInstances: loadInstances
};
