'use strict';

var logging = require(__dirname+'/lib/logging.js');
var redis = require('redis');
var events = require('events');
var client;
var offline = true;
var EXPIRE = 60 * 60;

/**
 *  No operation
 */

function noop () {
  
};

/**
 *  Convert a value to string
 *
 *  @param {String || Object} val
 */

var toString = function(val) {
  if (type(val) === 'String') return val;
  return JSON.stringify(val);
};

/**
 *  Convert a value to string
 *
 *  @param {String || Object} val
 */

var toObj = function(val) {
  if (type(val) === 'Object') return val;
  return JSON.parse(val);
};

/**
 *  Find an objects primitive type
 *
 *  @param {Object} o
 *  @return {String}
 */

var type = function(o) {
  return !!o && Object.prototype.toString.call(o).match(/(\w+)\]/)[1];
};

/**
 *  Inherit an event emitter to exports
 */

var emitter = new events.EventEmitter();
exports.on = emitter.on;
exports.emit = emitter.emit;

/**
 *  Log the cache resutls
 */

exports.enableConsoleLogging = function() {
  logging.toConsole(true);
};

/**
 *  Don't log the cache resutls
 */

exports.disableConsoleLogging = function() {
  logging.toConsole(false);
};
  
/**
 *  Connect to the redis instance
 *
 *  @param {String} port
 *  @param {String}  host
 */

exports.connect = function(port, host, opts) {
  
  if (typeof port == 'object') {
    opts = port;
    port = null;
  };

  if (typeof host == 'object') {
    opts = host;
    host = null;
  };

  client = redis.createClient(port, host, opts);

  /**
   *  Tell the client that redis is connected
   */

  client.on('ready', function(){
    offline = false;
    exports.emit('ready');
  });

  /**
   *  Tell the client there was an issue
   */

  client.on('error', function(e){
    offline = true;
    exports.emit('error', e);
  });

  /**
   *  Tell the client that vole is connected
   */

  client.on('connect', function(e){
    offline = false;
    exports.emit('connect', e);
  });
  
  /**
   *  When the connection closes, tell someone
   */

  client.on('end', function(e){
    offline = true;
    exports.emit('end', e);
  });

  return exports;
};

/**
 *  Set the default time to live
 *
 *  @param {Number} ttl
 */

exports.setTTL = function(ttl) {
  EXPIRE = ttl || EXPIRE;
  if (ttl == 0) EXPIRE = 0;
  return EXPIRE;
};

/**
 *  Auth the server
 *
 *  @param {String} pass
 *  @param [{Function}] cb
 */

exports.auth = function(pass, cb) {
  cb = cb || noop;
  if (!pass) return;

  client.auth(pass, function(){
    return cb();
  });
};

/**
 *  Set data to vole
 *  @param {String} key
 *  @param {Object} val
 *  @param {Number || Function} ttl
 *  @param [{Function}] cb
 */

exports.set = function(key, val, ttl, cb) {
  var usettl = false;

  if (ttl && !cb && type(ttl) === 'Function') cb = ttl;
  if (type(ttl) === 'Number' || ttl == 0) usettl = true;

  cb = cb || noop;

  if (offline) return cb(false, null);
  if (!key || !val) return cb(true, 'Set requires a key and a val');

  /**
   *  `key` must be String
   */

  if (type(key) !== 'String') return cb(true, 'Keys must be a String');

  /**
   *  `val` must be Object
   */

  if (type(val) !== 'Object' && type(val) !== 'Array')
    return cb(true, 'Val must be an object or an array');

  client.set(key, toString(val), function(err){
    if (err) return cb(true, null);
    if (!err) exports.emit('set', key, toString(val));
    return cb(false, null);
  });

  // user did not set a ttl of 0 and EXPIRE is truthy
  // if EXPIRE is set to 0, it will override any ttl
  if (!(usettl && ttl == 0) && EXPIRE) {
    client.expire(key, usettl ? ttl : EXPIRE);
  };
};

/**
 *  Get a key from the cache
 *
 *  @param {String} key
 *  @param {Function} cb
 */

exports.get = function(key, cb) {
  if (!key) return cb(true, 'No key specified');
  if (!cb) return; // k bye

  if (offline) return cb(false, null);
  if (type(key) === 'Array') multiGet(key, cb);
  if (type(key) === 'String') singleGet(key, cb);
};

/**
 *  Bust the cache for a given key
 *
 *  @method bust
 *  @param {String || Array} key
 *  @param {Function} cb
 */

exports.bust = function(key, cb) {
  cb = cb || noop;
  if (offline) return cb(false, null);
  key = key instanceof Array ? key : [key];
  client.send_command('DEL', key, cb);
};


/**
 *  Get a single key
 */

var singleGet = function(key, cb) {
  client.get(key, function(err, data){
    if (err) return cb(true, null, 'There was an error getting the data');
    returnData(key, data, cb);
  });
};

/**
 *  Get a multi key
 */

var multiGet = function(key, cb) {
  key.push(function(err, data){
    if (err) return cb(true, null, 'There was an error getting the data');
    returnDataMulti(key, data, cb);
  });
  client.mget.apply(client, key);
};

/**
 *  Return data from the cache
 *
 *  @param {String} key
 *  @param {String} val
 *  @param {Function} cb
 */

var returnData = function(key, val, cb) {
  if (val) {
    logging.cacheHit(key, val);  
    exports.emit('hit', key, val);
    return cb(false, toObj(val));
  } else {
    logging.cacheMiss(key);
    exports.emit('miss', key);
    return cb(false, null);
  };
};

/**
 *  Return data from the cache
 *
 *  @param {String} key
 *  @param {String} val
 *  @param {Function} cb
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
    exports.emit('hit', key, val);
    return cb(false, val, missing);
  } else {
    cacheMiss(key);
    exports.emit('miss', key);
    return cb(false, null);
  };
};
