#!/usr/bin/env node
// TODO: logging

var exec = require('child_process').exec,
  async = require('async'),
  lastArtist, lastTrack, player,
  os = require('os'),
  config = require('./config'),
  scribble = require('scribble'),
  username = config.username,
  apiKey = config.apiKey,
  apiSecret = config.apiSecret,
  self = this;

// app setup
async.parallel([
  function(callback) {
    // get last.fm account password
    config.password(function(error, password) {
      callback(error, password);
    });
  },
  function(callback) {
    // detect player
    if (config.player !== undefined) callback(null, config.player);
    else {
      detectPlayer(function(error, player) {
        if (error) callback(error);
        else callback(null, player);
      });
    }
  }
],
function(error, results) {
  if (error) {
    console.log(error);
    process.exit(1);
  }
  else {
    this.password = results[0];
    player = results[1];

    self.Scrobbler = new scribble(apiKey, apiSecret, username, this.password);
  }
});

// program
setInterval(function() {
  getCurrentState(function(song){
    if (song.position > 0.75 &&
      song.track !== lastTrack &&
      song.state === 'playing'){

      console.log('upisujem!');
      lastArtist = song.artist;
      lastTrack = song.track;

      self.Scrobbler.Scrobble(song, function(post_return_data) {});
    }
    else if (song.position < 0.75 && song.state === 'playing') {
      self.Scrobbler.NowPlaying(song, function(post_return_data) {});
    }
  });
}, 10000);

// function definitions
function detectPlayer(callback) {
  if (os.type() === 'Darwin') {
    exec("ps -u $USER | grep 'iTunes\\|mpd' | grep -v 'grep\\|Helper'",
      function(error, stdout, stderr) {
        if (error) callback(error);
        else {
          // pick all running players and choose the first one
          this.player = stdout.match(/iTunes|mpd/g);

          if (this.player == null) callback(new Error('no players detected!'));
          else {
            callback(null, this.player[0]);
          }
        }
      });
  }
  else if (os.type() === 'Linux') {
  }
}

function getCurrentState(callback) {
  // TODO: create resources file and get commands from there
  exec('osascript -e \'tell application "iTunes" to '
    + '{artist, name, album, duration} of current track '
    + '& player position & player state\'',
    function(error, stdout, stderr) {
      this.info = stdout.substring(0, stdout.length - 1);
      this.infoArray = info.split(', ');

      this.song = {
        artist: infoArray[0],
        track: infoArray[1],
        album: infoArray[2],
        position: +infoArray[4] / +infoArray[3],
        state: infoArray[5]
      };

      callback(this.song);
    });
};
