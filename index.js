#!/usr/bin/env node

var exec = require('child_process').exec,
  scribble = require('scribble'),
  child, currentArtist, currentTrack,
  username = require('./config').username,
  password = require('./config').password,
  apiKey = require('./config').apiKey,
  apiSecret = require('./config').apiSecret;

var Scrobbler = new scribble(apiKey, apiSecret, username, password);

// method definitions
function getCurrentTrack(callback) {
  child = exec('osascript -e \'tell application "iTunes" to '
    + '{artist, name, album, duration} of current track '
    + '& player position\'',
    function(error, stdout, stderr) {
      this.info = stdout.substring(0, stdout.length - 1);
      this.infoArray = info.split(', ');
      this.artist = infoArray[0];
      this.title = infoArray[1];
      this.album = infoArray[2];
      this.position = +infoArray[4] / +infoArray[3];

      callback({
        artist: this.artist,
        track: this.title,
        album: this.album,
        position: this.position
      });
    });
};


// program
setInterval(function() {
  getCurrentTrack(function(song){
    console.log('artist:', song.artist);
    console.log('title:', song.track);
    console.log('album:', song.album);
    console.log('progress:', song.position);
  
    if (song.artist === currentArtist && song.track === currentTrack) {
      console.log('ne saljem jer je ista pjesma', currentTrack);
    }
    else if (song.position > 0.4) {
      console.log('upisujem!');
      currentArtist = song.artist;
      currentTrack = song.track;

      Scrobbler.Scrobble(song);
    }
    else {
      console.log('ne saljem jer nije zrelo');
    }
  });
}, 2000);
