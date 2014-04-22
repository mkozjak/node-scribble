#!/usr/bin/env node

var exec = require('child_process').exec,
  lastArtist, lastTrack, player,
  os = require('os'),
  scribble = require('scribble'),
  username = require('./config').username,
  apiKey = require('./config').apiKey,
  apiSecret = require('./config').apiSecret,
  self = this;

require('./config').password(function(password) {
  self.Scrobbler = new scribble(apiKey, apiSecret, username, password);
});

function detectPlayer(callback) {
  if (os.type() === 'Darwin') {
    exec('ps uax | grep iTunes | grep -v '
      + '\'grep\\|Helper\' | wc -l | tr -d \' \\t\\n\\r\\f\'',
      function(error, stdout, stderr) {
        // FIXME: handle errors
        if (stdout === '1') player = 'iTunes';
      });
  }
  else if (os.type() === 'Linux?') {
  }
}

// method definitions
function getCurrentState(callback) {
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


// program
setInterval(function() {
  getCurrentState(function(song){
    if (song.position > 0.9 &&
      song.artist !== lastArtist &&
      song.track !== lastTrack &&
      song.state === 'playing'){

      console.log('upisujem!');
      lastArtist = song.artist;
      lastTrack = song.track;

      self.Scrobbler.Scrobble(song, function(post_return_data) {});
    }
    else if (song.position < 0.9 && song.state === 'playing') {
      self.Scrobbler.NowPlaying(song, function(post_return_data) {});
    }
  });
}, 15000);
