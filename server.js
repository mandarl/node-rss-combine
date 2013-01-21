var http = require('http');
var url = require('url');
var IP = "0.0.0.0";
var PORT = 80;

if(process.env.IP && process.env.PORT) {

console.log(process.env.IP);
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
    res.writeHead(200, {'Content-Type': 'text/html'});
    
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
    
    if(debug === 'false') {
        res.writeHead(200, {'Content-Type': 'text/xml'});
        res.write('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>News</title><description>fdssd</description>');
    }
    else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<html><body style="font-face:Arial;"><script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js" type="text/javascript"></script>');
    }
    
    var j = 0;
    for (var topic in topics) {
        var feed_url = 'http://dipoletech.com/GAE/RSS/controller.php?hl=en&ned=us&topic=' 
                    + topic + '&geo=' + geo + '&debug=' + debug;
        console.log("Start: " + topic + " " + feed_url);
	topics[topic] = Date.now();
        
        http.get(feed_url, function(resp) {
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
                    time_taken = end_time - start_time;
		    var local_time = new Date(Date.now() - (8 * 3600000));
                    console.log(local_time.toString() + " Time taken:" + time_taken.toFixed(2));
                    if(debug === 'false')
                        res.end(ret + '</channel></rss>');
                    else
                        res.end(ret + '</body></html>');
                }
            });
        });
    }
    
    
   
    
}).listen(PORT, IP);
