var http = require("http")
    , xpath = require("xpath")
    , jsdom = require("jsdom")
    , async = require("async");
var cheerio = require('cheerio');
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
//        console.log(fragmentHtml);
        var $ = cheerio.load(fragmentHtml);
//        
        i++;
        var article = {};
        article.title = $("span").text();
        article.thumbnail = $(".esc-thumbnail").toString().replace(/.*imgsrc=\"(.*?)\".*/,"http:$1");
        article.link = $("a").attr("href");
        article.snippet = $("div[class*='snippet']").html();
        article.pubdate = $("span.al-attribution-timestamp").html();
        articles.push(article);
        if(i == fragmentHtmls.length) {
            callback(articles);
        }
        
    }, function(err) {
        console.log("ERROR: " + err.toString());
    });
}

function getMethods(obj) {
  var result = [];
  for (var id in obj) {
    try {
      if (typeof(obj[id]) == "function") {
        result.push(id + ": " + obj[id].toString());
      }
    } catch (err) {
      result.push(id + ": inaccessible");
    }
  }
  return result;
}


gNews.prototype.getArticleFragments = function(html, callback, step2) {

    var $ = cheerio.load(html);
    var fragmentsHtmls = [];
    $("div.esc-has-thumbnail").each(function(i, elem) {
        fragmentsHtmls.push($(elem).html());
    });
    step2(fragmentsHtmls, callback);
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
setInterval(function() {
start_time = Date.now();
    ny.getArticles(function(articles) {
            console.log("done");
            console.log("Time2: " + (Date.now() - start_time));
    });
}, 4000);
