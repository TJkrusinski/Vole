'use strict';

var colors = require('cli-color'), 
	fs = require('fs'),
	winston = require('winston'),
	green = colors.green,
	yellow = colors.yellow,
	blue = colors.blue,
	CONSOLE,
	FILE,
	filePath,
	logger;


/**
 *	Enable console output
 */
exports.toConsole = function(bool) {
	CONSOLE = bool;
};

/**
 *	The cache was hit
 *	@param {String} key
 *	@param {String} val
 */
exports.cacheHit = function(key, val) {
	if (CONSOLE)
	console.log(green('√ - HIT ')+' Cache hit for key '+blue(key)+' with '+val.length+' bytes');

	if (FILE)
		_pushToFile('hit', key, val);
};

/**
 *	The cache was hit a few times
 *	@param {String} key
 *	@param {String} val
 */
exports.cacheHitMulti = function(key, val) {
	key.pop();
	val = val.join('');

	if (CONSOLE)
	console.log(green('√ - HIT ')+' Cache hit for key '+blue(key.join(', '))+' with '+val.length+' bytes');

	if (FILE)
		_pushToFile('hit', key, val);
};

/**
 *	The cache missed
 *	@param {String} key
 */
exports.cacheMiss = function(key) {
	if (CONSOLE)
		console.log(yellow('¿ - MISS')+' Cache missed for key '+blue(key));

	if (FILE)
		_pushToFile('miss', key);
};

/**
 *	Log to a file
 *	@param {String} file
 */
exports.logToFile = function(file) {
	filePath = file;
	FILE = true;

	logger = new (winston.Logger)({
		transports: [
			new (winston.transports.File)({
				filename:filePath,
				raw: true
			})
		]
	});

	logger.on('error', function(err){
		console.log(err);
	});
};

/**
 *	Push onto the file
 */
var _pushToFile = function(hit, key, val) {
	var obj = {
		hit: hit == 'hit' ? true : false,
		key: key,
		size: val ? val.length : 0,
	};
	logger.info(obj);
};
