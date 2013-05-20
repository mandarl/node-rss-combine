var http = require("http")
    , xpath = require("xpath")
    , jsdom = require("jsdom")
    , async = require("async");
var RequestCaching = require("node-request-caching");
//require('nodetime').profile({
//    accountKey: 'f4c74c9e0d4b4e10c4005c48dc5651637995d078', 
//    appName: 'Node.js Application'
//  });


var rc = new RequestCaching();

function gNews () {
    this.url = "http://news.google.com/news?hl=en&ned=us&geo=new+york";
}

gNews.prototype.getHTML = function(callback) {
    //Get HTML
    var step1 = this.getArticleFragments;
    var step2 = this.getArticleProperties;
    rc.get(this.url, null, 3600, function(err,resp,body,cache) {
        console.log(cache);
        step1(body, callback, step2);
    });
}

gNews.prototype.getArticleProperties = function(fragmentHtmls, callback) {
    var i = 0;
    var articles = [];
    async.forEach(fragmentHtmls, function(fragmentHtml) {
        var article = {};
        jsdom.env(fragmentHtml.innerHTML, ["http://code.jquery.com/jquery.js"], {
            features: {
                FetchExternalResources: false,
                ProcessExternalResources: false
            }},
            function(err, window) {
                i++;
                var article = {};
                article.title = window.$("span").html();
                article.thumbnail = window.$("img").attr("imgsrc");
                article.link = window.$("a:has(span.titletext)").attr("href");
                article.snippet = window.$("div[class*='snippet']").html();
                article.pubdate = window.$("span.al-attribution-timestamp").html();
                articles.push(article);
                if(i == fragmentHtmls.length) {
                    callback(articles);
                }
            }
        );
        
    }, function(err) {
        console.log("ERROR: " + err.toString());
    });
}




gNews.prototype.getArticleFragments = function(html, callback, step2) {
    
    jsdom.env(html, ["http://code.jquery.com/jquery.js"], {
        features: {
            FetchExternalResources: false,
            ProcessExternalResources: false
        }},
        function(err, window) {
            step2(window.$("div.esc-has-thumbnail"), callback);
        }
    );
}

gNews.prototype.getArticles = function(callback) {
    this.getHTML(callback);
}
var start_time = Date.now();
var ny = new gNews();
ny.getArticles(function(articles) {
    console.log("Time1: " + (Date.now() - start_time));
        //console.log(articles);
});
setTimeout(function() {
    ny.getArticles(function(articles) {
        console.log("done");
        console.log("Time2: " + (Date.now() - start_time));
        process.exit(0);
    });
}, 4000);
