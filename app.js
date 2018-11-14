var createError = require('http-errors');
var express = require('express');
var path = require('path');
var request = require('request');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

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

      res.render('index', {title: "Bob", gameNameList: gameNameList })
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

module.exports = app;
