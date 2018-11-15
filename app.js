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



app.use('/posts/', function(req, res) {

  request({ url: "https://beta.5colorcombo.com/api/game/reviews?limit=10" } , function(err, response, jsonString) {
    
      var json = JSON.parse(jsonString)
      var reviewList = json.reviews.map(function(e) {
          var res = {id : e.id, title : e.title, url : e.url, image : e.image_url, icon : e.icon_url, desc : e.description, sname : site_name, created : created_at}
          return res;
      });
      console.log('gen reviews done')
      res.render('reviews', {title : "The Latest Game Reviews!", reviewList: reviewList})
    });
});

app.use('/game/:gameid', function(req, res) {

  request({ url: "https://beta.5colorcombo.com/api/search?ids=" + req.params.gameid} , function(err, response, jsonString) {
    
      var json = JSON.parse(jsonString)
      var gameDeets = json.games.map(function(e) {
          var res = {id : e.id, name : e.name, price : e.price, msrp : e.msrp, url : e.url, image : e.image_url, year : e.year_published, minplayers : e.min_players, maxplayers : e.max_players, minplaytime : e.min_playtime, maxplaytime : e.max_playtime, age : e.min_age, desc : e.description_preview}
          return res;
      });
      console.log('deets done')
      res.render('deets', {title: gameDeets.name, game: gameDeets[0]})
    });
});

app.use('/', function(req, res) {
  
  request({ url: "https://beta.5colorcombo.com/api/search?order-by=reddit-day-count&lt-price=20&gt-price=0" } , function(err, response, jsonString) {
      var json = JSON.parse(jsonString)
      var gameNameList = json.games.map(function(e) {
          var discountPerc = parseFloat(Math.round(100*(1.0 - e.price/e.msrp))).toFixed(0);
          var over = discountPerc < 0;
          var ndiscountPerc = Math.abs(discountPerc);
          var res = {id : e.id, name : e.name, price : e.price, msrp : e.msrp, url : e.url, image : e.image_url, over : over, discountPerc : ndiscountPerc}
          return res;
          
      });
      console.log('index done')

      res.render('index', {title: "Bob's Alphasite", gameNameList: gameNameList })
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

