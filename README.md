# Vole

[A Vole](http://en.wikipedia.org/wiki/Vole)

A very simple Redis backed key/value cache for Node.js.

`$ npm install vole`

## Methods

````javascript

var vole = require('vole');

/**
 *	Connect Vole to Redis
 *	These parameters are the same as the Redis module for node
 *	They will default to 6379 and localhost (default for redis)
 */
vole.connect([port], [host]);


/**
 *	Your Redis instance is behind auth
 *	Callback is fired when the connection is established
 */
vole.auth(pass, [cb]);


/**
 *	Listen for errors, these errors are coming from Redis' event emitter
 */
vole.on('error', function(e){
	console.log(e);
});


/**
 *	Set the default TTL for all of Vole
 *	@param {Number} ttl - TTL in seconds
 *		default TTL is one hour
 */
vole.setTTL(ttl);


/**
 *	Set data into Vole
 *	@param {String} key - the key name in which to save the data
 *		Vole is a thin wrapper around Redis,
 *		setting an existing key will overwrite it
 *	@param {Object || Array || String} val - the data to set the key value to
 *		Vole stringifies data sent to it and will return it back as an Object
 *	@param [{Number}] ttl - set the expire time on the key - optional
 *	@param [{Function}] cb - error first callback letting you know the data has been cached - optional
 */
vole.set(key, val, [[ttl], [cb]])


/**
 *	Get data from Vole
 *	@param {String || Array} key - a String or an Array of Strings of key names to get
 *	@param {Function} cb - error first callback to fire when the data has been retrieved
 */
vole.get(key, function(err, data, missing) {
	// if you used an Array for key, missing will be an array of keys that were missed by the cache
	console.log(typeof err) // Boolean
	console.log(data) // {}
	console.log(missing) // []
});


/**
 *	Remove data from Vole
 *	@param {String} key - remove the specified key from the cache
 */
vole.bust(key);


/**
 *	Log Vole information to disk as JSON
 *	@method logToFile
 *	@pararm {String} filePath
 */
vole.logToFile(filePath);

// logs
{"hit":true,"key":"foo","size":13,"time":1369065558590,"level":"info","message":"","timestamp":"2013-05-20T15:59:18.590Z"}
{"hit":false,"key":"foo2","size":0,"time":1369065559595,"level":"info","message":"","timestamp":"2013-05-20T15:59:19.596Z"}
{"hit":true,"key":"foo4","size":14,"time":1369065559598,"level":"info","message":"","timestamp":"2013-05-20T15:59:19.598Z"}
{"hit":true,"key":["foo3","foo4"],"size":31,"time":1369065559598,"level":"info","message":"","timestamp":"2013-05-20T15:59:19.598Z"}
{"hit":false,"key":"foo3","size":0,"time":1369065559600,"level":"info","message":"","timestamp":"2013-05-20T15:59:19.600Z"}


/**
 *	Log Vole information to the console	
 *	@method enableConsoleLogging
 */
vole.enableConsoleLogging();


/**
 *	Stop logging Vole information to the console	
 *	@method disableConsoleLogging
 */
vole.disableConsoleLogging();

````

## Examples

````javascript

var vole = require('vole');

/**
 *	Use vole in front of your database to speed things up
 */

User.get = function(userId, callback) {
	
	// see if vole has the user cached
	vole.get(userId, function(err, data){

		// vole will return null if it missed the key
		// otherwise it will return the value if it hits the key
		// lets make an early exit if we hit the key
		if (data) return callbak(false, data);

		// vole missed
		db.queryForUser(userId, function(err, data){
		
			// lets set the data so vole can help us on the next go around
			vole.set('users:'+userId, data);
			return callback(false, data);

		});
	});
};

User.create = function(userObject, callback) {

	// after we insert into the database, set data in vole
	db.insert(userObject, function(err, data){

		vole.set('users:'+data.id, data);
		return cb(false, data);

	});
};

````
## Running tests

`$ npm test`

The tests require [mocha](https://github.com/visionmedia/mocha) and assume that you have Redis running on `127.0.0.1:6379`

## License

(The MIT License)

Copyright (c) 2013 TJ Krusinski &lt;tj@shoflo.tv&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
