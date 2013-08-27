'use strict';

var colors = require('cli-color'), 
	green = colors.green,
	yellow = colors.yellow,
	blue = colors.blue,
	CONSOLE;

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
};

/**
 *	The cache missed
 *	@param {String} key
 */
exports.cacheMiss = function(key) {
	if (CONSOLE)
		console.log(yellow('¿ - MISS')+' Cache missed for key '+blue(key));
};
