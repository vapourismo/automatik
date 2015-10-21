const path     = require("path");
const db       = require("./database");
const util     = require("./utilities");
const groups   = require("./data/groups");
const backends = require("./data/backends");

// // Setup environment
// const datapoints = {};
// const entities   = {};

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

// 				if (row.group in groups)
// 					groups[row.group].entities.push(entity);

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
// 		loadGroups();
// 	});
// }

const load = function* () {
	backends.load();
	groups.load();
}.async();

load();

module.exports = {
	backends: backends,
	groups:   groups
};
