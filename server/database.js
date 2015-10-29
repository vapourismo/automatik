"use strict";

const EventEmitter = require("events");
const pg           = require("pg");
const config       = require("./config");
const util         = require("./utilities");

// Connect
const db = new pg.Client(config.database || {});
db.connect();

// Async query method
db.queryAsync = function (...args) {
	return new Promise(function (accept, reject) {
		this.query(...args, function (err, result) {
			if (err) reject(err);
			else     accept(result);
		});
	}.bind(this));
};

function sanitizeName(name) {
	return '"' + name.replace('"', "") + '"';
}

class Row {
	constructor(table, data) {
		this.table = table;
		this.data = data;
	}
}

Row.prototype.update = function* (data) {
	const key = this.data[this.table.key];

	if (key === undefined)
		throw new Error("Cannot update rows without a primary key");

	const values = [];
	const params = [key];

	this.table.columns.forEach(column => {
		if (!(column in data))
			return;

		params.push(data[column]);
		values.push(sanitizeName(column) + " = $" + params.length);
	});

	const results = yield db.queryAsync(
		"UPDATE " + sanitizeName(this.table.name) + " SET " + values.join(", ") + " WHERE " + sanitizeName(this.table.key) + " = $1 RETURNING *",
		params
	);

	Object.assign(this.data, results.rows.pop());
}.async;

Row.prototype.delete = function* () {
	const key = this.data[this.table.key];

	if (key === undefined)
		throw new Error("Cannot delete rows without a primary key");

	const results = yield db.queryAsync(
		"DELETE FROM " + sanitizeName(this.table.name) + " WHERE " + sanitizeName(this.table.key) + " = $1 RETURNING *",
		[key]
	);

	results.rows.forEach(row => {
		if (row[this.table.key] == key)
			delete this.data[this.table.key];
	});
}.async;

class Table {
	constructor(name, key, columns) {
		this.name = name;
		this.key = key;
		this.columns = columns;
	}
}

Table.prototype.load = function* () {
	const results = yield db.queryAsync("SELECT * FROM " + sanitizeName(this.name));
	return results.rows.map(row => new Row(this, row));
}.async;

Table.prototype.insert = function* (data) {
	const columns = [];
	const values = [];
	const params = [];

	this.columns.forEach(function (column) {
		if (!(column in data))
			return;

		columns.push(sanitizeName(column));
		params.push(data[column]);
		values.push("$" + params.length);
	});

	const results = yield db.queryAsync(
		"INSERT INTO " + sanitizeName(this.name) + " (" + columns.join(", ") + ") VALUES (" + values.join(", ") + ") RETURNING *",
		params
	);

	return new Row(this, results.rows.pop());
}.async;

Table.prototype.find = function* (criteria) {
	const clauses = [];
	const params = [];

	this.columns.forEach(function (column) {
		if (!(column in criteria))
			return;

		params.push(criteria[column]);
		clauses.push(sanitizeName(column) + " = $" + params.length);
	});

	const result = yield db.queryAsync(
		"SELECT * FROM " + sanitizeName(this.name) + " WHERE " + clauses.join(", "),
		params
	);

	return result.rows.map(row => new Row(this, row));
}.async;

db.Row = Row;
db.Table = Table;

module.exports = db;
