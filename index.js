var forever = require('forever-monitor');

var scribble = new (forever.Monitor)('./lib/node-scribble.js', {
  max: 3,
  silent: true
});

scribble.on('exit', function() {
  console.log('exited after three starts');
});

scribble.start();
