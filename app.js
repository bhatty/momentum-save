#!/usr/bin/env node

/* 
 * Setting the current background in the Momentum dash extension in a specified wallpaper directory
*/

var fs = require('fs'),
request = require('request');

if (process.argv[2] == 'stop') {
  var pid = Number(fs.readFileSync(__dirname + '/pid').toString());
  console.log('Stopping the momentum-wallpapers daemon.');
  try {
    process.kill(pid, 'SIGUSR1');
  }
  catch (err) {
    console.log('Error: Daemon already stopped or was never launched.');
  }
  process.exit();
}

// console.log('momentum-wallpapers now running in the background. OK?');
// console.log('Type "momentum-wallpapers stop" to stop it.');

// require('daemon')();

// console.log('called daemon');

// process.on('SIGUSR1', function() {
// console.log('inside process')
//   process.exit();
// });
// console.log('called sigusr1');


fs.writeFileSync(__dirname + '/pid', process.pid);


var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

var wallpaper = require('wallpaper');
var sqlite3 = require("sqlite3").verbose();
var directories = require('./directories');

var date = 0;

function getWallpaper() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  month = month % 10 == month ? '0' + month : month; 
  var newDate = now.getDate();

  if (date != newDate) {
    date = newDate;
    date = date % 10 == date ? '0' + date : date;
    var key = 'momentum-background-' + year + '-' + month + '-' + date;

    var momentumPath = directories.momentumPath;
    var localStorage = directories.localStorage;
    var wallpaperPath = directories.wallpaperPath;

    var db = new sqlite3.Database(localStorage);

    db.serialize(function() {
      db.each("SELECT value FROM ItemTable WHERE key = '" + key + "'", function(err, row) {

        var background = JSON.parse(row.value.toString().replace(/\u0000/g, '')).filename;
        var imageLocation = JSON.parse(row.value.toString().replace(/\u0000/g, '')).title.replace(",", " -");

        //var background = "https://www.google.com/images/srpr/logo3w.png"

        if (!err) {
          console.log(imageLocation);
        }
        else
          console.error(err);
        

        var path = wallpaperPath + '/' + imageLocation + '.png';
   
        fs.access(path, fs.F_OK, function(err) {
            if (err) {
                download(background, path, function(){
                  console.log('Saved iamge successfully to wallpaper directory');
                });
            } else {
                console.log(imageLocation + ' image already exists!')
            }
        });

       fs.writeFile("out.png", "test", function(err) {
         if (err) 
          console.log(err);
       });

   
      });
    });

    db.close();
  }
}

function setWallpaper(path) {

  wallpaper.set(path, function (err) {
    if (!err)
      console.log('Wallpaper set.');
    else
      console.error(err);
  });

}

getWallpaper();
// setWallpaper();
// setInterval(setWallpaper, 1000 * 60);
