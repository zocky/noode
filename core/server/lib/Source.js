var url = require('url');
var http = require('http');
var querystring = require('querystring');
var spawn = require('child_process').spawn;

function wget( options , onSuccess , onFail ) {
	//console.log( options.host , options.port , options.path );
	http.get( options, function( res ) {
		res.setEncoding( 'utf8' );
		var data = '';
		res.on( 'data', function( chunk ) { data += chunk; } );
		res.on( 'end' , function( ) {
			onSuccess( data );
		});
	} ).on( 'error' , function( ) {
		console.log( options );
		onFail( );
	} );
}

Source = function Source( id , opt , tmpl) {
	tmpl = tmpl || {};
	this.conf = {};
	for (var i in tmpl) {
		this.conf[i] = opt[i] || String(tmpl[i]).replace(/{{{id}}}/g,id);
	}
	var u = url.parse( this.conf.url );
	this.host = u.host;
	this.port = u.port || 80;
	this.path = u.pathname;
	this.id = id;
	this.info = {
		id: id,
		cli: opt.cli,
		name: opt.name,
		home: opt.home,
		shorter: opt.shorter || opt.name
	}
}

Source.prototype = {
	search: function( args , cb1 , cb2 ) {
		if (this.info.cli) {
			var cmd = './scrapers/php/' + this.info.id + '.php ' + querystring.stringify( args );
			var src = spawn( '/usr/bin/php', [this.info.id + '.php', querystring.stringify( args )], {cwd:'./scrapers/php'});
			src.stdout.on('data', function (data) {
				try {
					data = JSON.parse( data );
					data.info.cli = 'true';
					cb1( data );
				} catch ( e ) {
					cb2 ( e );
				} 
			});
			src.on('exit', function (code) {
			  if (code !== 0) cb2({'number':code,'message':'cmd ' + cmd + "\n external jexit code " + code})
			});
		} else {
			wget ( {
				host: this.host,
				port: this.port,
				path: this.path + '?' + querystring.stringify( args )
			}, function( data ) {
				try {
					data = JSON.parse( data );
					data.info.cli = 'false';
					cb1( data );
				} catch ( e ) {
					cb2 ( e );
				} 
			} , cb2 );
		}
	}
}
module.exports = Source;
