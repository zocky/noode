var url = require('url');
var fs = require('fs');

var shouldCache = false;

var server;

var files = {
	"/":  "core/client/index.html",
	"/robots.txt": "core/server/robots.txt",
};
var paths = {
	"/css/":  "core/client/css/",
	"/js/": "core/client/js/",
	"/static/": "local/static/"
};
var types = {
	html:	'text/html',
	css:	'text/css',
	js:		'application/javascript',
	png:	'application/png',
	gif:	'application/gif',
	jpeg:	'application/jpeg',
	woff:	'font/opentype',
	ttf:	'font/ttf'
};

function handleRequest (req,res) {
	var u = url.parse(req.url,true);
	var p = u.pathname;
	if (files[p]) {
		sendFile (res,files[p],req.headers['cache-control']=='no-cache');
		return;
	}
	var m = p.match(/^(\/\w+\/)(.*)$/);
	
	if (m && paths[m[1]]) {
		sendFile (res,paths[m[1]]+m[2],req.headers['cache-control']=='no-cache');
		return;
	} 
	res.writeHead(404);
	res.end('No such such.');
}

// send file from fs to http client
var fileCache = {};
function sendFile(res,filename,force) {
	var type = types[filename.match(/\w+$/)[0]] || 'text/plain';
	if (!force && fileCache[filename]) {
//		console.log('cache HIT:  '+filename+'\t'+type);
		res.writeHead(200, {
			'Content-Type': type
		});
		res.end(fileCache[filename]);
		return;
	}
//	console.log('cache MISS: '+filename+'\t'+type);
	fs.readFile(filename, function(err,data) {
		if (err) {
			res.writeHead(404);
			return res.end(String(err));
		} else {
			res.writeHead(200, {
				'Content-Type': type
			});
			res.end(data);
			fileCache[filename] = data;
		}
	})
}
var http=require('http');
exports.start = function ( opt ) {
	for(var i in opt.files) this.files[i] = opt.files[i];
	for(var i in opt.files) this.files[i] = opt.files[i];
	exports.server = http.createServer(handleRequest);
	return this;
}
