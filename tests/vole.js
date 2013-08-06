'use strict';

var assert = require('chai').assert,
	vole = require(__dirname+'/../index.js');

describe('vole', function(){

	// existance
	describe('the existance of vole', function(){
		it('checks for existance', function(d){
			assert.ok(vole);
			assert.ok(vole.get);
			assert.ok(vole.set);
			assert.ok(vole.bust);
			assert.ok(vole.auth);
			d();
		});
	});

	vole.on('hit', function(key, val){
		describe('vole#on(\'hit\')', function(){
			it('is fired after the cache is hit', function(d){
				assert.ok(key);
				d();
			});
		});
	});

	vole.on('miss', function(key, val){
		describe('vole#on(\'hit\')', function(){
			it('is fired after the cache is missed', function(d){
				assert.ok(key);
				d();
			});
		});
	});

	// connection
	describe('vole#connect()', function(){
		it('connects to the redis server', function(d){
			vole.connect();

			vole.on('ready', function(){
				assert.ok(true);
				d();
			});

			vole.on('error', function(e){
				assert.isTrue(false);
				d();
			});
		});
	});

	// methods
	describe('vole#set()', function(){
		it('sets data into vole with the default ttl', function(d){
			vole.set('foo', {foo:'bar'}, function(err){
				assert.isFalse(err);
				d();
			});
		});
	});

	describe('vole#set()', function(){
		it('sets data into vole with the default ttl', function(d){
			vole.set('fooarray', [{foo:'bar'}], function(err){
				assert.isFalse(err);
				d();
			});
		});
	});

	describe('vole#set()', function(){
		it('sets data into vole with a different ttl', function(d){
			vole.set('foo2', {foo:'bar'}, 1, function(err){
				assert.isFalse(err);
				d();
			}); 
		});
	});

	// key exists
	describe('vole#get()', function(){
		it('gets a key from vole successfully', function(d){
			vole.get('foo', function(err, data){
				assert.isFalse(err);
				assert.isObject(data);
				assert.equal(data.foo, 'bar');
				d();
			});
		});
	});
	
	// key will timeout
	describe('vole#get()', function(){
		it('waits for key to expire and then misses the cache', function(d){
			setTimeout(function(){
				vole.get('foo2', function(err, data){
					assert.isFalse(err);
					assert.isNull(data);
					d();
				});
			}, 1001);
		});
	});

	var keys = ['foo3', 'foo4'],
		objs = [{foo:'bar3  s'}, {foo:'bar4'}];
	// array keys
	describe('vole#set()', function(){
		it('sets data for mget later on', function(d){
			vole.set(keys[0], objs[0], function(err){
				assert.isFalse(err);
				d();
			});
		});
	});
	// array keys
	describe('vole#set()', function(){
		it('sets another key for an mget later on', function(d){
			vole.set(keys[1], objs[1], function(err){
				assert.isFalse(err);
				d();
			});
		});
	});

	describe('vole#get()', function(){
		it('gets a key from vole successfully', function(d){
			vole.get('foo4', function(err, data){
				assert.isFalse(err);
				assert.isObject(data);
				assert.equal(data.foo, 'bar4');
				d();
			});
		});
	});

	describe('vole#get()', function(){
		it('gets an array of keys', function(d){
			vole.get(keys, function(err, data){
				assert.isFalse(err);
				assert.isArray(data);
				assert.isObject(data[0]);
				d();
			});
		});
	});

	// remove a key
	describe('vole#bust()', function(){
		it('removes a key from vole', function(d){
			vole.bust('foo3');
			vole.get('foo3', function(err, data){
				assert.isFalse(err);
				assert.isNull(data);
				d();
			});
		});
	});

	var keys2 = ['2foo0', '2foo1'],
		objs2 = [{foo:'2foo0 vall'}, {foo:'2foo1 vall'}];
	// array keys
	describe('vole#set()', function(){
		it('sets data for mget later on', function(d){
			vole.set(keys2[0], objs2[0], function(err){
				assert.isFalse(err);
				d();
			});
		});
	});
	// array keys
	describe('vole#set()', function(){
		it('sets another key for an mget later on', function(d){
			vole.set(keys2[1], objs2[1], function(err){
				assert.isFalse(err);
				d();
			});
		});
	});

	// gets an array but with sparse keys
	describe('vole#get()', function(){
		var sparseKeys = keys2;
			sparseKeys.push('missing');
		it('gets keys that are in the cache and returns keys that are not', function(d){
			vole.get(keys2, function(err, data, missing){
				assert.isFalse(err);
				assert.isArray(data);
				assert.isArray(missing);
				d();
			});
		});
	});

	// delete an array of keys
	describe('vole#del()', function(){
		it('removes an array of keys', function(d){
			vole.set('foo8', ['boo'], function(err, data){
				vole.set('foo9', ['boo'], function(err, data){
					vole.bust(['foo8', 'foo9'], function(err, data){
						vole.get(['foo8', 'foo9'], function(err, data){
							assert.isFalse(err);
							assert.isNull(data[0]);
							assert.isNull(data[1]);
							d();
						});
					});
				});
			});
		});
	});

	// delete an array of keys
	describe('vole#del()', function(){
		it('removes an array of keys without cb', function(d){
			vole.set('foo5', ['boo'], function(err, data){
				vole.set('foo5', ['boo'], function(err, data){
					vole.bust(['foo5', 'foo6']);
					setTimeout(function(){
						vole.get(['foo5', 'foo6'], function(err, data){
							assert.isFalse(err);
							assert.isNull(data[0]);
							assert.isNull(data[1]);
							d();
						});
					}, 50);
				});
			});
		});
	});

	describe('vole#set()', function(){
		it('does not set an expire on a key', function(d){
			vole.set('foobarbz', ['Stephen Rivas'], 0, function(err, data){
				assert.isFalse(err);
				d();
			});
		});
	});

	describe('vole#set()', function(){
		it('sets a key with an EXPIRE of 0 and a ttl of 0', function(d){
			vole.setTTL(0);
			vole.set('foobarbzzz', ['Stephen Rivas'], 0, function(err, data){
				vole.get('foobarbzzz', function(err, data){
					assert.isFalse(err);
					assert.ok(data);
					d();
				});
			});
		});
	});

	describe('vole#set()', function(){
		it('sets a key with an EXPIRE of 0 and a ttl of 0', function(d){
			vole.setTTL(100);
			vole.set('foobarbzzzss', ['Stephen Rivas'], function(err, data){
				vole.get('foobarbzzzss', function(err, data){
					assert.isFalse(err);
					assert.ok(data);
					d();
				});
			});
		});
	});

});
