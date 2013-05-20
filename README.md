# Vole

[A Vole](http://en.wikipedia.org/wiki/Vole)

A very simple Redis backed key/value cache for Node.js.

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
