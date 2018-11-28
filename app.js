var createError = require('http-errors');
var express = require('express');
var path = require('path');
var request = require('request');
var app = express();
var debug = require('debug')('myapp:server');
var http = require('http');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//FINISHED, SEARCH GAME, SEE GAMES AND RESPECTIVE REVIEWS
app.use('/games/search', function(req, res) {
  var page = 1
  if(req.query.pageid)
    page = parseInt(req.query.pageid)
  
  request({ url: "https://beta.5colorcombo.com/api/search?name=" + req.query.gamename + "&limit=10&skip=" + (page-1)*10} , function(err, response, jsonString) {
    var json = JSON.parse(jsonString)
    var gameNameList = json.games.map(function(e) {
        var discountPerc = parseFloat(Math.round(100*(1.0 - e.price/e.msrp))).toFixed(0);
        var over = discountPerc < 0;
        var ndiscountPerc = Math.abs(discountPerc);
        var res = {id : e.id, name : e.name, price : e.price, msrp : e.msrp, url : e.url, image : e.image_url, over : over, discountPerc : ndiscountPerc}
        
        return res;
    });

    var externalsToFetchLength = gameNameList.length;
    var fetchedExternals = function() {
      externalsToFetchLength--;
      if (externalsToFetchLength == 0) {        
        res.render('gamesearch', {page : page, title: "Bob's Alphasite", gameNameList: gameNameList, name : req.query.gamename});
      }
    }

    gameNameList.map(function(e) {
      request({ url: "https://beta.5colorcombo.com/api/game/reviews?game-id=" + e.id}, function(err, response, jsonString) {
        var json2 = JSON.parse(jsonString);
        var reviewList = json2.reviews.map(function(f) {
          var res = {icon : f.icon_url, site : f.site_name, url : f.url};
          return res;
        });
        e.reviewList = reviewList;
        request({ url: "https://beta.5colorcombo.com/api/game/videos?game-id=" + e.id}, function(err, response, jsonString) {
          var json = JSON.parse(jsonString);
          var vidList = json.videos.map(function(i) {
            var res = {icon : i.thumb_url, title : i.title, url : i.url};
            return res;
          });
          e.vidList = vidList;
          fetchedExternals();
        });
      });
    })
  });
});

//NOT FINISHED, browse latest videos with next/prev.  NEEDS order by and ascend/descend options
app.use('/videos/browse/:pageid', function(req, res) {  
  var page = parseInt(req.params.pageid, 10)
  request({ url: "https://beta.5colorcombo.com/api/game/videos?limit=10&include-game=true&skip=" + ((page-1)*10) } , function(err, response, jsonString) {
  
    var json = JSON.parse(jsonString)
    var videoList = json.videos.map(function(e) {
      var res = {title : e.title, url : e.url, channel : e.channel_name, image : e.image_url, views : e.views, game : e.game.name, created : e.created_at.substring(0, 10), published : e.published_date.substring(0, 10), gameid : e.game.id}
      return res;
    });
    res.render('videos', { page: page, title : "The Latest Video Reviews!", videoList: videoList})
  });
});

//NOT FINISHED, view all videos by a specific video creator.  NEEDS order by and ascend/descend options
app.use('/videos/creator/:creator/:pageid', function(req, res) {  
  var page = parseInt(req.params.pageid, 10)
  request({ url: "https://beta.5colorcombo.com/api/game/videos?limit=10&include-game=true&skip=" + ((page-1)*10) + "&channel-name=" + req.params.creator } , function(err, response, jsonString) {
  
    var json = JSON.parse(jsonString)
    var videoList = json.videos.map(function(e) {
      var res = {title : e.title, url : e.url, channel : e.channel_name, image : e.image_url, views : e.views, game : e.game.name, created : e.created_at.substring(0, 10), published : e.published_date.substring(0, 10), gameid : e.game.id}
      return res;
    });
    
    res.render('creator', {page: page, title : "Video Reviews from '" + req.params.creator + "'", name: videoList[0].channel, videoList: videoList})
  });
});

//FINISHED, browse latest reviews with next/prev
app.use('/reviews/browse/:pageid', function(req, res) {  
  var page = parseInt(req.params.pageid, 10)
  request({ url: "https://beta.5colorcombo.com/api/game/reviews?limit=10&include-game=true&skip=" + ((page-1)*10) } , function(err, response, jsonString) {
  
    var json = JSON.parse(jsonString)
    var reviewList = json.reviews.map(function(e) {
      var res = {id : e.id, title : e.title, url : e.url, image : e.image_url, icon : e.icon_url, desc : e.description, sname : e.site_name, created : e.created_at.substring(0, 10), game : e.game.name, gameid : e.game.id}
      return res;
    });
    
    res.render('reviews', {page: page, title : "The Latest Game Reviews!", reviewList: reviewList})
  });
});

//FINISHED, view all reviews by a specific reviewer
app.use('/reviews/reviewer/:sitename/:pageid', function(req, res) {  
  var page = parseInt(req.params.pageid, 10)
  request({ url: "https://beta.5colorcombo.com/api/game/reviews?limit=10&include-game=true&skip=" + ((page-1)*10) + "&site-name=" + req.params.sitename } , function(err, response, jsonString) {
  
    var json = JSON.parse(jsonString)
    var reviewList = json.reviews.map(function(e) {
      var res = {id : e.id, title : e.title, url : e.url, image : e.image_url, icon : e.icon_url, desc : e.description, sname : e.site_name, created : e.created_at, game : e.game.name, gameid : e.game.id}
      return res;
    });
    
    res.render('reviewer', {page: page, title : "Game Reviews from " + req.params.sitename, name: reviewList[0].sname, reviewList: reviewList})
  });
});

//FINISHED, browse DAY COUNT games with next/prev
app.use('/games/top/browse/:pageid', function(req, res) {
  var page = parseInt(req.params.pageid, 10)
  request({ url: "https://beta.5colorcombo.com/api/search?order-by=reddit-day-count&limit=28&skip=" + (page-1)*28} , function(err, response, jsonString) {
    var json = JSON.parse(jsonString)
    var gameNameList = json.games.map(function(e) {
        var discountPerc = parseFloat(Math.round(100*(1.0 - e.price/e.msrp))).toFixed(0);
        var over = discountPerc < 0;
        var ndiscountPerc = Math.abs(discountPerc);
        var res = {id : e.id, name : e.name, price : e.price, msrp : e.msrp, url : e.url, image : e.image_url, over : over, discountPerc : ndiscountPerc}
        return res;
    });

    res.render('index', {page : page, title: "Bob's Alphasite", gameNameList: gameNameList })
  });
});

//FINISHED, browse ALL TIME games with next/prev
app.use('/games/browse/:pageid', function(req, res) {
  var page = parseInt(req.params.pageid, 10)
  request({ url: "https://beta.5colorcombo.com/api/search?limit=28&skip=" + (page-1)*28} , function(err, response, jsonString) {
    var json = JSON.parse(jsonString)
    var gameNameList = json.games.map(function(e) {
        var discountPerc = parseFloat(Math.round(100*(1.0 - e.price/e.msrp))).toFixed(0);
        var over = discountPerc < 0;
        var ndiscountPerc = Math.abs(discountPerc);
        var res = {id : e.id, name : e.name, price : e.price, msrp : e.msrp, url : e.url, image : e.image_url, over : over, discountPerc : ndiscountPerc}
        return res;
    });

    res.render('games', {page : page, title: "Bob's Alphasite", gameNameList: gameNameList })
  });
});

//FINISHED, game details
app.use('/games/:gameid', function(req, res) {

  request({ url: "https://beta.5colorcombo.com/api/search?ids=" + req.params.gameid} , function(err, response, jsonString) {
    var json = JSON.parse(jsonString)
    var gameDeets = json.games.map(function(e) {
        var res = {id : e.id, name : e.name, price : e.price, msrp : e.msrp, url : e.url, image : e.image_url, year : e.year_published, minplayers : e.min_players, maxplayers : e.max_players, minplaytime : e.min_playtime, maxplaytime : e.max_playtime, age : e.min_age, desc : e.description_preview}
        return res;
    });
    
    var desc1 = gameDeets[0].desc;
    var desc2 = "";
    var more = false;
    if(gameDeets[0].desc.length > 490) {
      more = true;
      desc1 = gameDeets[0].desc.substring(0,490);
      desc2 = gameDeets[0].desc;
    }

    request({ url: "https://beta.5colorcombo.com/api/game/reviews?game-id=" + req.params.gameid}, function(err, response, jsonString) {
      var json = JSON.parse(jsonString);
      var reviewList = json.reviews.map(function(f) {
        var res = {icon : f.icon_url, site : f.site_name, url : f.url};
        return res;
      });

      request({ url: "https://beta.5colorcombo.com/api/game/images?game-id=" + req.params.gameid}, function(err, response, jsonString) {
        var json = JSON.parse(jsonString);
        var imageList = json.images.map(function(g) {
          var res = {url : g.url};
          return res;
        });
        request({ url: "https://beta.5colorcombo.com/api/game/prices?game-id=" + req.params.gameid}, function(err, response, jsonString) {
          var json = JSON.parse(jsonString);
          var priceList = json.prices.map(function(h) {
            var res = {price : h.price_text, url : h.url, site : h.store_name, country : h.country};
            return res;
          });
          request({ url: "https://beta.5colorcombo.com/api/game/videos?game-id=" + req.params.gameid}, function(err, response, jsonString) {
            var json = JSON.parse(jsonString);
            var vidList = json.videos.map(function(i) {
              var res = {icon : i.thumb_url, title : i.title, url : i.url};
              return res;
            });
            res.render('deets', {title: gameDeets[0].name, game: gameDeets[0], reviews : reviewList, videos: vidList, desc1: desc1, desc2: desc2, more: more, images : imageList, prices : priceList});
          });
        });
      });
    });
  });
});

//ONGOING, homepage subject to change
app.use('/', function(req, res) {
  
  request({ url: "https://beta.5colorcombo.com/api/search?order-by=reddit-day-count&limit=28" } , function(err, response, jsonString) {
    var json = JSON.parse(jsonString)
    var gameNameList = json.games.map(function(e) {
        var discountPerc = parseFloat(Math.round(100*(1.0 - e.price/e.msrp))).toFixed(0);
        var over = discountPerc < 0;
        var ndiscountPerc = Math.abs(discountPerc);
        var res = {id : e.id, name : e.name, price : e.price, msrp : e.msrp, url : e.url, image : e.image_url, over : over, discountPerc : ndiscountPerc}
        return res;
        
    });

    res.render('index', {page : 1, title: "Bob's Alphasite", gameNameList: gameNameList })
  });
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

