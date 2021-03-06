#!/usr/bin/env node
// TODO: logging (debug, info), config parses (plain text file)
// FIXME: variables (config or here??)

var exec = require('child_process').exec,
  async = require('async'),
  lastArtist, lastTrack, player, password
  os = require('os'),
  config = require('./config'),
  scribble = require('scribble'),
  username = (typeof config.username !== undefined ? config.username : undefined),
  apiKey = config.apiKey,
  apiSecret = config.apiSecret,
  self = this;

// app setup
async.parallel({
  username: function(callback) {
    // get last.fm account username
    if (username !== undefined) callback(null, username);
    else callback(new Error("Username not defined!"));
  },
  password: function(callback) {
    // get last.fm account password
    if (self.password !== undefined) callback(null, self.password);
    else config.password(function(error, password) {
      callback(error, password);
    });
  },
  player: function(callback) {
    // detect player
    if (config.player !== undefined) callback(null, config.player);
    else {
      detectPlayer(function(error, player) {
        if (error) callback(error);
        else callback(null, player);
      });
    }
  }
},
// run on error or when all jobs are done
function(error, results) {
  if (error) {
    console.log(error);
    process.exit(1);
  }
  else {
    this.username = results.username;
    this.password = results.password;
    this.player = results.player;

    self.Scrobbler = new scribble(apiKey, apiSecret, this.username, this.password);
  }
});

// program
setInterval(function() {
  getCurrentState(function(song){
    // FIXME: what if player repeats the song?
    if (song.position > 0.75 &&
      song.track !== lastTrack &&
      song.state === 'playing'){

      lastArtist = song.artist;
      lastTrack = song.track;

      // FIXME: post_return_data ?
      self.Scrobbler.Scrobble(song, function(post_return_data) {
        self.nowplayingPosted = false;
        console.log('poslao Scrobble za', song.track);
      });
    }
    else if (song.position > 0.1 && song.position < 0.75 &&
      song.state === 'playing' && self.nowplayingPosted != true) {
      self.Scrobbler.NowPlaying(song, function(post_return_data) {
        self.nowplayingPosted = true;
        console.log('poslao NowPlaying za', song.track, post_return_data);
      });
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
        duration: Math.round(infoArray[3]),
        position: +infoArray[4] / +infoArray[3],
        state: infoArray[5]
      };

      callback(this.song);
    });
};
