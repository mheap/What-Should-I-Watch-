var express = require('express');
var nunjucks = require('nunjucks'),
async = require('async'),
request = require('request');

var app = express();
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'));
env.express(app);

var Redis = require("redis"),
redis = Redis.createClient();

var films = [
  "The Shawshank Redemption",
  "The Godfather",
  "The Godfather: Part II",
  "Inception",
  "Goodfellas",
  "The Usual Suspects",
  "Se7en",
  "Psycho",
  "Memento",
  "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb",
  "Apocalypse Now",
  "Alien",
  "American Beauty",
  "The Departed",
  "Aliens",
  "A Clockwork Orange",
  "Reservoir Dogs",
  "The Prestige",
  "L.A. Confidential",
  "Some Like It Hot",
  "2001: A Space Odyssey",
  "Pan’s Labyrinth",
  "Inglourious Basterds",
  "The Maltese Falcon",
  "Gran Torino",
  "Batman Begins",
  "Heat",
  "Blade Runner",
  "Fargo",
  "The Big Lebowski",
  "No Country for Old Men",
  "Scarface",
  "The Sixth Sense",
  "Strangers on a Train",
  "The King’s Speech",
  "Black Swan",
  "Trainspotting",
  "Donnie Darko",
  "Casino",
  "Finding Nemo",
  "How to Train Your Dragon",
  "Slumdog Millionaire",
  "District 9",
  "The Wrestler",
  "Rocky",
  "Star Trek",
  "The Truman Show",
  "Infernal Affairs",
  "Monsters Inc",
  "Shutter Island"
];

app.get('/', function(req, res){
  async.map(films, function(item, callback){
    var slugItem = slugify(item);
    var redisKey = "films:" + slugItem;
    redis.hgetall(redisKey, function(err, data){
      callback(null, data);
    });
  }, function(err, items){
    res.render('index.html', {
      "films": items
    });
  });
});

app.get('/refresh', function(req,res){

  async.each(films,
             function(item, callback){
               var slugItem = slugify(item);
               var redisKey = "films:" + slugItem;
               var cached = redis.hgetall(redisKey, function(err, data){
                 if (data){
                   console.log("Cached: " + slugItem);
                   callback();
                   return;
                 }

                 request.get("http://www.omdbapi.com/?i=&t=" + escape(item), function(err, resp, body){
                   try {
                     // Save to Redis
                     redis.hmset(redisKey, JSON.parse(body), function(err, done){
                       callback();
                     });
                   } catch (e){}
                 });
               });
             },
             function(err){
               //res.redirect("/");
               res.send("Done");
             });

});

app.listen(3000);
console.log('Listening on port 3000');



function slugify(text) {
  text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
  text = text.replace(/-/gi, "_");
  text = text.replace(/\s/gi, "-");
  return text.toLowerCase();
}
