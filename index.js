#!/usr/bin/env node

var exec = require('child_process').exec,
  os = require('os'),
  scribble = require('scribble'),
  child, lastArtist, lastTrack,
  username = require('./config').username,
  password = require('./config').password,
  apiKey = require('./config').apiKey,
  apiSecret = require('./config').apiSecret;

var Scrobbler = new scribble(apiKey, apiSecret, username, password);
var systemType = os.type();

// method definitions
function getCurrentState(callback) {
  child = exec('osascript -e \'tell application "iTunes" to '
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
    /*
    console.log('artist:', song.artist);
    console.log('title:', song.track);
    console.log('album:', song.album);
    console.log('progress:', song.position);
    console.log('state:', song.state);
    */
  
    if (song.position > 0.9 &&
      song.artist !== lastArtist &&
      song.track !== lastTrack &&
      song.state === 'playing'){

      console.log('upisujem!');
      lastArtist = song.artist;
      lastTrack = song.track;

      Scrobbler.Scrobble(song, function(post_return_data) {});
    }
    else if (song.position < 0.9 && song.state === 'playing') {
      Scrobbler.NowPlaying(song, function(post_return_data) {});
    }
  });
}, 2000);
