const express = require('express');
const uuid = require('node-uuid');
const Set = require('./models/set');

const router = express.Router();

const userId = 42; //Changing this app to a single-user one for now :)





router.get('/api/raw/sets', function(req, res) {
  Set.find({})
    .exec(function(err, sets) {
      console.log('dem sets', sets);
      res.send(sets);
    });
});





router.get('/api/sets', (req, res) => {

  Set.find({})
    .exec((err, data) => {
      //console.log('find result', err, data);

      //convert the output to an array
      var setArray = [];
      for (var key in data) {
        var set = {
          id: data[key]._id,
          userId: data[key].userId,
          description: data[key].description,
          name: data[key].name,
          cards: data[key].cards
        };
        setArray.push(set);
      }

      //console.log('going to send', setArray);

      res.send({
        userId: userId, //req.user.id,
        sets: setArray
      });
  });

});

router.post('/api/sets', (req, res) => {

  var cb = (data) => {
    res.send(data);
  };

  var set = new Set();
  set.name = req.body.name;
  set.description = req.body.description;
  set.cards = [];
  set.userId = userId; //req.user.id;
  set.save(cb);

});

router.delete('/api/sets/:setId', (req, res) => {
  var cb = (err, data) => {
    //console.log('done removing', err, data);
    res.sendStatus(204);
  };

  Set.findByIdAndRemove(req.params.setId, cb);
});

router.post('/api/sets/:setId/card', (req, res) => {
  var cb = (err, data) => {
    //console.log('add card, err, data', err, data);
    res.send(data);
  }

  //console.log('updating set', req.params.setId, 'maybe');

  var card = {
    id: uuid.v4(),
    front: req.body.front,
    back: req.body.back,
    correctCount: 0,
    incorrectCount: 0
  };

  Set.findByIdAndUpdate(
    req.params.setId,
    {$push: {"cards": card }},
    {safe: true, upsert: true},
    cb);
});


router.post('/api/sets/:setId/card/:position/incorrect', (req, res) => {
  var matchingObject = {};
  matchingObject['cards.' + req.params.position + '.incorrectCount']  = 1;

  incrementSubCount(matchingObject, req.params.setId, res);
});

router.post('/api/sets/:setId/card/:position/correct', (req, res) => {
  var matchingObject = {};
  matchingObject['cards.' + req.params.position + '.correctCount']  = 1;

  incrementSubCount(matchingObject, req.params.setId, res);
});

function incrementSubCount(matchingObject, setId, res) {
  var cb = (err, data) => {
    res.send(data);
  }

  Set.update(
    { _id: setId },
    { $inc: matchingObject },
    {}, //options
    cb
  );
}


module.exports = router;
