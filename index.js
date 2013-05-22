'use strict';

var logging = require(__dirname+'/lib/logging.js'),
	redis = require('redis'),
	events = require('events'),
	client,
	EXPIRE = 60 * 60;

/**
 *	Convert a value to string
 *	@param {String || Object} val
 */
var toString = function(val) {
	if (type(val) === 'String') return val;
	return JSON.stringify(val);
};

/**
 *	Convert a value to string
 *	@param {String || Object} val
 */
var toObj = function(val) {
	if (type(val) === 'Object') return val;
	return JSON.parse(val);
};

/**
 *	Find an objects primitive type
 *	@param {Object} o
 *	@return {String}
 */
var type = function(o) {
    return !!o && Object.prototype.toString.call(o).match(/(\w+)\]/)[1];
};

/**
 *	Inherit an event emitter to exports
 */
var emitter = new events.EventEmitter();
exports.on = emitter.on;
exports.emit = emitter.emit;

/**
 *	Log the cache resutls
 */
exports.enableConsoleLogging = function() {
	logging.toConsole(true);
};

/**
 *	Don't log the cache resutls
 */
exports.disableConsoleLogging = function() {
	logging.toConsole(false);
};

/**
 *	Log to a file
 */
exports.logToFile = logging.logToFile;
	
/**
 *	Connect to the redis instance
 *	@param {String} port
 *	@param {String}	host
 */
exports.connect = function(port, host) {
	client = redis.createClient(port, host);

	/**
	 *	Tell the client that redis is connected
	 */
	client.on('ready', function(){
		exports.emit('ready');
	});

	/**
	 *	Tell the client there was an issue
	 */
	client.on('error', function(e){
		exports.emit('error', e);
	});

	/**
	 *	Tell the client that vole is connected
	 */
	client.on('connect', function(e){
		exports.emit('connect', e);
	});

	return exports;
};

/**
 *	Set the default time to live
 *	@param {Number} ttl
 */
exports.setTTL = function(ttl) {
	EXPIRE = ttl || EXPIRE;
	return EXPIRE;
};

/**
 *	Auth the server
 *	@param {String} pass
 *	@param [{Function}] cb
 */
exports.auth = function(pass, cb) {
	if (!pass) return;

	client.auth(pass, function(){
		if (cb) return cb();
	});
};

/**
 *	Set data to vole
 *	@param {String} key
 *	@param {Object} val
 *	@param {Number || Function} ttl
 *	@param [{Function}] cb
 */
exports.set = function(key, val, ttl, cb) {
	var usettl = false;

	if (ttl && !cb && type(ttl) === 'Function') cb = ttl;
	if (type(ttl) === 'Number') usettl = true;
	
	if (!key || !val)
		return cb ? cb(true, 'Set requires a key and a val') : false;

	/**
	 *	`key` must be String
	 */
	if (type(key) !== 'String')
		return cb ? cb(true, 'Keys must be a String') : false;

	/**
	 *	`val` must be Object
	 */
	if (type(val) !== 'Object')
		return cb ? cb(true, 'Val must be an object') : false;

	client.set(key, toString(val), function(err){
		if (err) return cb ? cb(true, null) : false;
		return cb ? cb(false, null) : true;
	});

	client.expire(key, usettl ? ttl : EXPIRE);
};

/**
 *	Get a key from the cache
 *	@param {String} key
 *	@param {Function} cb
 */
exports.get = function(key, cb) {
	if (!key) return cb(true, 'No key specified');
	if (!cb) return; // k bye

	if (type(key) === 'Array') multiGet(key, cb);
	if (type(key) === 'String') singleGet(key, cb);
};

/**
 *	Bust the cache for a given key
 *	@method bust
 *	@param {String} key
 */
exports.bust = function(key) {
	client.del(key);
};

/**
 *	Get a single key
 */
var singleGet = function(key, cb) {
	client.get(key, function(err, data){
		if (err) return cb(true, null, 'There was an error getting the data');
		returnData(key, data, cb);
	});
};

/**
 *	Get a multi key
 */
var multiGet = function(key, cb) {
	key.push(function(err, data){
		if (err) return cb(true, null, 'There was an error getting the data');
		returnDataMulti(key, data, cb);
	});
	client.mget.apply(client, key);
};

/**
 *	Return data from the cache
 *	@param {String} key
 *	@param {String} val
 *	@param {Function} cb
 */
var returnData = function(key, val, cb) {
	if (val) {
		logging.cacheHit(key, val);	
		return cb(false, toObj(val));
	} else {
		logging.cacheMiss(key);
		return cb(false, null);
	};
};

/**
 *	Return data from the cache
 *	@param {String} key
 *	@param {String} val
 *	@param {Function} cb
 */
var returnDataMulti = function(key, val, cb) {
	var missing = [];

	if (val) {
		logging.cacheHitMulti(key, val);	
		
		val.forEach(function(e, i){
			var parsed = JSON.parse(val[i]);
			if (!parsed) missing.push(key[i]);
			val[i] = parsed;
		});

		return cb(false, val, missing);
	} else {
		cacheMiss(key);
		return cb(false, null);
	};
};
