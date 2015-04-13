var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var async = require('async');
var request = require('request');
var xml2js = require('xml2js');
var _ = require('lodash');
var LastfmAPI = require('lastfmapi');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var showSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  album: String,
  artist:String,
  genre: [String],
  length: Number,
  playcount: String,
  overview:String,
  poster: String
});
var lfm = new LastfmAPI({
    'api_key' : '7b3e1e72b5e06503e298ce018c407cc5',
    'secret' : 'c70ed618aee236131ec5b58d5abafcb5'
});



var userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

var User = mongoose.model('User', userSchema);
var Show = mongoose.model('Show', showSchema);
mongoose.connect('mongodb://karan:karan@ds061721.mongolab.com:61721/musicfav');
var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

app.get('/api/shows', function(req, res, next) {
  var query = Show.find();
  if (req.query.genre) {
    query.where({ genre: req.query.genre });
  } else if (req.query.alphabet) {
    query.where({ name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i') });
  } 
  query.exec(function(err, shows) {
    if (err) return next(err);
    res.send(shows);
  });
});
app.get('/api/shows/:id', function(req, res, next) {
  Show.findById(req.params.id, function(err, show) {
    if (err) return next(err);
    res.send(show);
  });
});

app.get('*', function(req, res) {
  res.redirect('/#' + req.originalUrl);
});


app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, { message: err.message });
});

app.post('/api/shows', function(req, res, next) {
    var artistName = req.body.artistName;
     var seriesName = req.body.showName;
lfm.track.getInfo({
    'artist' : artistName,
    'track' : seriesName
}, function (err, track) {
       if(!track.album.title)
{
              return res.send(404, { message: req.body.showName + ' was not found.' });

}
    console.log("Found");


  var show = new Show({
            _id: track.id,
            name: track.name,
            album: track.album.title,
            artist:track.artist.name,
            playcount:track.playcount,
            length:track.duration,
            genre:[track.toptags.tag[0].name],
            overview:track.wiki.summary,
            poster:track.album.image[1]['#text']

          });
  show.save(function(err){
    if (err) { throw err; }
    console.log('Added to Database');

  });

      var url = track.album.image[1]['#text'];
      request({ url: url, encoding: null }, function(error, response, body) {
        show.poster = 'data:' + response.headers['content-type'] + ';base64,' + body.toString('base64');
      });
    

});

});


/*

var db = mongoose.createConnection('localhost', 'test');

var schema = mongoose.Schema({ name: 'string' });
var Cat = db.model('Cat', schema);

var kitty = new Cat({ name: 'Zildjian' });
kitty.save(function (err) {
  if (err) // ...
  console.log('meow');
});
*/


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  User.findOne({ email: email }, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false);
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if (isMatch) return done(null, user);
      return done(null, false);
    });
  });
}));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next();
  else res.send(401);
}

app.post('/api/login', passport.authenticate('local'), function(req, res) {
  res.cookie('user', JSON.stringify(req.user));
  res.send(req.user);
});

app.post('/api/signup', function(req, res, next) {
  var user = new User({
    email: req.body.email,
    password: req.body.password
  });
  user.save(function(err) {
    if (err) return next(err);
    res.send(200);
  });
});



app.get('/api/logout', function(req, res, next) {
  req.logout();
  res.send(200);
});

app.use(function(req, res, next) {
  if (req.user) {
    res.cookie('user', JSON.stringify(req.user));
  }
  next();
});