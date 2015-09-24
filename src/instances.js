var tpls = require("../lib/templates");
var backends = require("../lib/backends");
var classes = require("../lib/classes");

function Entity(entity, slots, comm) {
	this.id = entity.id;
	this.name = entity.name;
	this.instance = new classes[entity.type](entity.conf, slots);

	this.instance.listen(comm.updateEntity.bind(comm, this));
}

Entity.prototype = {
	renderValue: function () {
		return this.instance.render();
	},

	renderBox: function () {
		return tpls.boxes.entity({
			id: this.id,
			name: this.name,
			value: this.instance.render()
		});
	},

	onClick: function (client) {
		this.instance.click(client);
	}
};

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
					});
				} else {
					console.warn("Datapoint '" + row.name + "': Failed to configure");
				}
			} else {
				console.warn("Datapoint '" + row.name + "': Backend instance with ID " + row.backend + " does not exist");
			}
		});
	});

	db.query("SELECT id, name, type, config FROM entities", function (err, result) {
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

						entityInstances[row.id] = new Entity(row, slots, comm);
						console.log("Instantiated entity '" + row.name + "'");
					}
				);
			} else {
				console.warn("Entity '" + row.name + "': Type '" + row.type + "'' does not exist");
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
			db.query("SELECT id FROM entities WHERE room = $1", [room.id], function (err2, result2) {
				if (err2) {
					console.warn("Room '" + room.name + "': Failed to fetch entities");
					return;
				}

				room.entities = [];

				result2.rows.forEach(function (entity) {
					if (entity.id in entityInstances) {
						room.entities.push(entityInstances[entity.id]);
					} else {
						console.warn("Room '" + room.name + "': Entity with ID " + entity.id + " does not exist");
					}
				});

				roomInstances[room.id] = room;
				console.log("Created room '" + room.name + "'");
			});
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
