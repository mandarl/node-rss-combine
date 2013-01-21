var http = require('http');
var url = require('url');
var parasite = require('parasite'),
sites = {
  "dipoletech.com" : [ "l", "w", "p", "b", "t", "n", "e", "s", "m" ]
};

//http://dipoletech.com/GAE/RSS/controller.php?hl=en&ned=us&topic=w&geo=new+york&debug=false

http.globalAgent.maxSockets = 10000;


var requestGroup = parasite(sites);

http.createServer(function (req, res) {
    var start_time = new Date().getTime() / 1000;    
    var queryData = url.parse(req.url, true).query;
    
    var geo = 'new+york';
    var debug = 'true';
    if (queryData.geo) {
        geo = queryData.geo;
        geo = geo.replace(' ', '+');
    }
    if (queryData.debug) {
        debug = queryData.debug;
    }
    
    if(debug === 'false')
        res.writeHead(200, {'Content-Type': 'text/xml'});
    else
        res.writeHead(200, {'Content-Type': 'text/html'});

    for (var i = 0; i < sites["dipoletech.com"].length; i++) {
        sites["dipoletech.com"][i] = '/GAE/RSS/controller.php?hl=en&ned=us&topic=' +
                        sites["dipoletech.com"][i] + '&geo=' + geo + '&debug=' + debug;
        console.log(i + ': ' + sites["dipoletech.com"][i]);
    }
    
    if(debug === 'false') {
        res.write('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>News</title><description>fdssd</description>');
    }
    else {
        res.write('<html><body style="font-face:Arial;"><script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js" type="text/javascript"></script>');
    }

    requestGroup = parasite(sites);
    
    var ret = '';
    var j = 0;
    requestGroup.addListener('response', function(response){
        var ret1 = '';
        if(debug === 'false') {
            ret1 = response.body.replace(/<\?xml[\s\S]*?\/generator>/gim, '')
                    .replace(/<\/channel>[\s\S]*?<\/rss>/gim, '');
        }
        else {
            ret1 = response.body.replace(/<html[\s\S]*?\/script>/gim, '')
                    .replace(/<\/body>[\s\S]*?<\/html>/gim, '');
        }
	res.write(ret1);
        
        j++;
        console.log(j);
        if(j == sites["dipoletech.com"].length) {
            if(debug === 'false') {
            ret += '</channel></rss>';
            }
            else {
            ret += '</body></html>';
            }
            var end_time = new Date().getTime() / 1000;    
            var time_taken = end_time - start_time;
            console.log("Time taken:" + time_taken);

            res.end(ret);
        }
    });

    requestGroup.addListener('error', function(error){
       console.log('Error occurred:' + error.toString()); 
    });
}).listen(80);
