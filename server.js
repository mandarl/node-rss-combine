//var agent = require('webkit-devtools-agent');
var http = require('http');
var zlib = require('zlib');
var url = require('url');
var IP = "0.0.0.0";
var PORT = 80;
var DEBUG_HOST = "0.0.0.0";;
var DEBUG_PORT = 9999;

if(process.env.IP && process.env.PORT) {
	IP = process.env.IP;
    
	PORT = process.env.PORT;
} 
var topics = { "l":Date.now(), "w":Date.now(), "t":Date.now(), "p":Date.now(), "b":Date.now(), "n":Date.now(), "e":Date.now(), "s":Date.now(), "m":Date.now() };

//http://dipoletech.com/GAE/RSS/controller.php?hl=en&ned=us&topic=w&geo=new+york&debug=false
http.globalAgent.maxSockets = 10000;
http.Agent.defaultMaxSockets = 10000;

http.createServer(function (req, res) {
    var start_time = new Date().getTime() / 1000;    
    var queryData = url.parse(req.url, true).query;
    
    var acceptEncoding = req.headers['accept-encoding'];
    if (!acceptEncoding) {
        acceptEncoding = '';
    }
    
    var geo = 'new+york',
        ret = '',
        debug = 'true';
    if (queryData.geo) {
        geo = queryData.geo;
        geo = geo.replace(' ', '+');
    }
    if (queryData.debug) {
        debug = queryData.debug;
    }
    
    if (acceptEncoding.match(/\bgzip\b/)) {
        res.writeHead(200, { 'Content-Encoding': 'gzip', 'Content-Type': debug == 'true' ? 'text/html; charset=UTF-8': 'text/xml; charset=UTF-8' });
    } else {
        res.writeHead(200, {'Content-Type': debug == 'true' ? 'text/html': 'text/xml'});
    }

    
    if(debug === 'false') {
        ret += '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>News</title><description>fdssd</description>';
    }
    else {
        ret += '<html><body style="font-face:Arial;"><script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js" type="text/javascript"></script>';
    }
    
    var j = 0;
    for (var topic in topics) {
        var feed_url = 'http://dipoletech.com/GAE/RSS/controller.php?hl=en&ned=us&topic=' 
                    + topic + '&geo=' + geo + '&debug=' + debug;
        console.log("Start: " + topic + " " + feed_url);
        
        topics[topic] = Date.now();
        
        var clientRequest = http.get(feed_url, function(resp) {
            resp.body = '';
            resp.geo = this._header.match(/geo=(.*?)\&/)[1];
            resp.topic = this._header.match(/topic=(.)/)[1];
            resp.start_time = new Date().getTime() / 1000;
            resp.on('data', function (chunk) {
                var tmp = '';
                tmp = chunk.toString();
                if(debug === 'false') {
                    chunk = tmp.replace(/<\?xml[\s\S]*?\/generator>/gim, '')
                        .replace(/<\/channel>[\s\S]*?<\/rss>/gim, '');
                }
                else {
                    chunk = tmp.replace(/<html[\s\S]*?\/script>/gim, '')
                        .replace('</body></html>', '');
                }
                resp.body += chunk;
            });
            resp.on('end', function (chunk) {
                //console.log("End: " + j);
                ret += resp.body.replace(/<\/channel>[\s\S]*?<\/rss>/gim, '');
                resp.end_time = new Date().getTime() / 1000;
                console.log(resp.geo + " Time: " + resp.topic + ": " + (Date.now() - topics[resp.topic]));
                j++;
                if(j == Object.keys(topics).length) {
                    var end_time = new Date().getTime() / 1000;    
                    var time_taken = end_time - start_time;
                    var local_time = new Date(Date.now() - (8 * 3600000));
                    console.log(local_time.toString() + " Time taken:" + time_taken.toFixed(2));
                    if(debug === 'false')
                        ret += '</channel></rss>';
                    else
                        ret += '</body></html>';
                        
                    if (acceptEncoding.match(/\bgzip\b/)) {
                        zlib.gzip(ret, function(err, result){
                            if(!err) {
                                res.end(result);
                            }
                        });
                    } else {
                        res.end(ret);
                    }
                }
            });
        });
        
        // clientRequest.topic = topic;
        // clientRequest.geo = geo;
        // clientRequest.on('socket', function (socket) {
        //     socket.setTimeout(5000);  
        //     socket.clientReq = clientRequest;
        //     socket.on('timeout', function() {
        //         this.clientReq.abort();
        //         this.end();
        //         j++;
        //         console.log("TIMEOUT: " + this.clientReq.topic);
        //         console.log('j is:' + j + ' objects is:' + Object.keys(topics).length);
        //         if(j == Object.keys(topics).length) {
        //             var end_time = new Date().getTime() / 1000;    
        //             var time_taken = end_time - start_time;
        //             var local_time = new Date(Date.now() - (8 * 3600000));
        //             console.log(local_time.toString() + " Time taken:" + time_taken.toFixed(2));
        //             if(debug === 'false')
        //                 res.end(ret + '</channel></rss>');
        //             else
        //                 res.end(ret + '</body></html>');
        //         }
        //     });
        // });
        // clientRequest.on('error', function () {
        //     console.log("Error on req level: ");
        // });

    }
    
    
   
    
}).listen(PORT, IP);

/*
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(9999, IP);
console.log('[%s] Server running at http://[%s]:9999/', process.pid, IP);
*/
