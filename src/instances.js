var tpls = require("../lib/templates");
var backends = require("../lib/backends");
var classes = require("../lib/classes");

var Entity = require("../lib/entity");

var backendInstances = {};
var datapointInstances = {};
var roomInstances = {};
var entityInstances = {};

function loadInstances(db, comm) {
	db.query("SELECT id, name, driver, config FROM backends", function (err, result) {
		if (err) {
			console.error("Failed to fetch backend instances");
			process.exit(1);
			return;
		}

		result.rows.forEach(function (row) {
			if (row.driver in backends) {
				backendInstances[row.id] = new backends[row.driver](row.config);
				console.log("Instantiated backend '" + row.name + "'");
			} else {
				console.warn("Backend '" + row.name + "': Driver '" + row.driver + "' does not exist");
			}
		});
	});

	db.query("SELECT id, name, backend, config, value FROM datapoints", function (err, result) {
		if (err) {
			console.error("Failed to fetch datapoint instances");
			process.exit(1);
			return;
		}

		result.rows.forEach(function (row) {
			if (row.backend in backendInstances) {
				var dp = backendInstances[row.backend].configureDatapoint(row.config, row.value);

				if (dp) {
					datapointInstances[row.id] = dp;
					console.log("Configured datapoint '" + row.name + "'");

					dp.listen(function (newValue) {
						db.query("UPDATE datapoints SET value = $1 WHERE id = $2", [newValue, row.id]);
						db.query("INSERT INTO datapoints_log (datapoint, value) VALUES ($1, $2)", [row.id, newValue]);
					});
				} else {
					console.warn("Datapoint '" + row.name + "': Failed to configure");
				}
			} else {
				console.warn("Datapoint '" + row.name + "': Backend instance with ID " + row.backend + " does not exist");
			}
		});
	});

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

						var slots = {};
						result2.rows.forEach(function (row2) {
							if (row2.value in datapointInstances) {
								slots[row2.name] = datapointInstances[row2.value];
							} else {
								console.warn("Entity '" + row.name + "': Slot '" + row2.name + "': Datapoint with ID " + row2.value + " does not exist");
							}
						});

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
	backends: backendInstances,
	datapoints: datapointInstances,
	entities: entityInstances,
	rooms: roomInstances,
	loadInstances: loadInstances
};
