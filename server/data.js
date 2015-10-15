const path   = require("path");
const pg     = require("pg");

const config = require("./config");
const util   = require("./utilities");
const Room   = require("./data/room");
// const Entity = require("./data/entity");

// Connect database
const db = new pg.Client(config.database || {});
db.connect();

// Load plugins
const drivers = {};
// const types   = {};

const pluginDirectory = path.join(path.dirname(module.filename), "plugins");

util.iterateFiles(pluginDirectory, function (file) {
	if (path.extname(file) != ".js")
		return;

	const fileIdentifier = path.relative(pluginDirectory, file);
	const mod = require(file);

	// Has backend drivers
	if (mod.drivers) {
		for (var id in mod.drivers) {
			const driver = mod.drivers[id];

			util.inform("plugin: " + fileIdentifier, "Loaded driver '" + driver.meta.name + "'");
			drivers[id] = driver;
		}
	}

	// // Has component types
	// if (mod.types) {
	// 	for (var id in mod.types) {
	// 		const type = mod.types[id];

	// 		util.inform("plugin: " + fileIdentifier, "Loaded type '" + type.meta.name + "'");
	// 		types[id] = type;
	// 	}
	// }
});

// Setup environment
const backends   = {};
const datapoints = {};
const rooms      = {};
const entities   = {};

// function configureEntity(row) {
// 	const tag = "entity: " + row.id;

// 	if (row.type in types) {
// 		const type = types[row.type];

// 		db.query(
// 			"SELECT * FROM slots WHERE entity = $1",
// 			[row.id],
// 			function (err2, result2) {
// 				if (err2) return util.abort(tag, "Failed to fetch slots");

// 				const slots = {};

// 				// Connect slots with their respective datapoints
// 				result2.rows.forEach(function (row2) {
// 					if (row2.value in datapoints) {
// 						slots[row2.name] = datapoints[row2.value];
// 					} else {
// 						util.warn("slot: " + row2.id, "Datapoint #" + row2.value + " does not exist");
// 					}
// 				});

// 				// Check if all mandatory slots have been assigned
// 				for (var key in type.meta.slots) {
// 					var slot = type.meta.slots[key];

// 					if (!slot.optional && !(key in slots)) {
// 						return util.error(tag, "Slot '" + key + "' is missing");
// 					}
// 				}

// 				const entity = new type(row, slots);
// 				entities[row.id] = entity;

// 				if (row.room in rooms)
// 					rooms[row.room].entities.push(entity);

// 				util.inform(tag, "Created '" + row.name + "'");
// 			}
// 		);
// 	} else {
// 		util.error(tag, "Type '" + row.type + "'' does not exist");
// 	}
// }

// function loadEntities() {
// 	db.query("SELECT * FROM entities", function (err, result) {
// 		if (err) return util.abort("entities", "Failed to fetch instances", err);

// 		result.rows.forEach(configureEntity);
// 	});
// }

function configureRoom(row) {
	var room = rooms[row.id] = new Room(row);
	util.inform("room: " + row.id, "Created '" + row.name + "'");
	return room;
}

function createRoom(name, callback) {
	db.query("INSERT INTO rooms (name) VALUES ($1) RETURNING *", [name], function (err, result) {
		if (err) {
			if (err.code == 23505)      callback("A room with that name already exists", null);
			else if (err.code == 22001) callback("Room name is too long", null);
			else                        callback("Unknown error, check logs", null);

			return util.error("rooms", "Failed to create room", err);
		}

		callback(null, result.rows.map(configureRoom));
	});
}

function loadRooms() {
	db.query("SELECT * FROM rooms", function (err, result) {
		if (err) return util.abort("rooms", "Failed to fetch instances", err);

		result.rows.forEach(configureRoom);

		// loadEntities();
	});
}

// function configureDatapoint(row) {
// 	const tag = "datapoint: " + row.id;

// 	if (row.backend in backends) {
// 		const dp = backends[row.backend].configureDatapoint(row.config, row.value);

// 		if (dp) {
// 			datapoints[row.id] = dp;

// 			// Register update handler
// 			dp.listen(function (newValue) {
// 				db.query("UPDATE datapoints SET value = $1 WHERE id = $2", [newValue, row.id]);
// 			});

// 			util.inform(tag, "Configured '" + row.name + "'");
// 		} else {
// 			util.abort(tag, "Failed to configure");
// 		}
// 	} else {
// 		util.abort(tag, "Backend #" + row.backend + " does not exist");
// 	}
// }

// function loadDatapoints() {
// 	db.query("SELECT * FROM datapoints", function (err, result) {
// 		if (err) return util.abort("datapoints", "Failed to fetch instances:", err);

// 		result.rows.forEach(configureDatapoint);
// 		loadRooms();
// 	});
// }

function configureBackend(row) {
	if (row.driver in drivers) {
		backends[row.id] = new drivers[row.driver](row.config);
		util.inform("backend: " + row.id, "Instantiated '" + row.name + "'");
	} else {
		util.abort("backend: " + row.id, "Driver '" + row.driver + "' does not exist");
	}
}

function loadBackends() {
	db.query("SELECT * FROM backends", function (err, result) {
		if (err) return util.abort("backends", "Failed to fetch instances:", err);

		result.rows.forEach(configureBackend);
		// loadDatapoints();
		loadRooms();
	});
}

loadBackends();

module.exports = {
	backends:   backends,
	datapoints: datapoints,
	rooms:      rooms,
	entities:   entities,

	createRoom: createRoom
};
