var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};

socketApi.io = io;


module.exports = function(app) {

    const pool = app.pool;

    function isValid() {



    }

// middleware
    /*io.use((socket, next) => {
     let token = socket.handshake.query.token;
     if (isValid(token)) {
     return next();
     }
     return next(new Error('authentication error'));
     });*/

    io.on('connection', function(socket){
     //   var cursor = app.mongoDB.collection("users").find({});


        var handshakeData = socket.request;
       // console.log("user:", handshakeData._query['h']);
       // console.log("game:", handshakeData._query['g']);


        pool
            .query('SELECT * FROM tournaments_results WHERE id = ?', handshakeData._query['g'])
            .then(rows => {
                var game = rows[0];
                var time = game.created_at;
                var a = time.getTime() - new Date().getTime();
                var diffDays = Math.ceil(a / (1000 * 3600 ));
                console.log(diffDays);
                var isPlayer = false;
                var color = null;
                if (game.p1_id == handshakeData._query['h']) {
                    isPlayer = true;
                    color = "white";
                } else if (game.p2_id == handshakeData._query['h']) {
                    isPlayer = true;
                    color = "black";
                }
                if (isPlayer) {
                    socket.emit('eventPlayer', JSON.stringify({isPlayer : isPlayer, color : color}));
                }


                //var mongoGame = app.mongoDB.collection("users").findOne( { _id: game.id } )


                /*var document = {_id : parseInt(game.id), name:"new", title:"new user"};

                if (!mongoGame._id) {
                    app.mongoDB.collection("users").insertOne(document, function(err, records){
                        console.log("Record added as "+records);
                    });
                }*/

            });

        //cursor.forEach(function (docs) {
            //console.log(docs._id);
        //});






        /*app.mongoDB.collection("users").insertOne(document, {w: 1}, function(err, records){
            console.log("Record added as "+records);
        });*/



      //  console.log('A user connected');


        socket.on('eventServer', function(msg){
            try {
                msg = JSON.parse(msg);
              //  console.log(msg);

                console.log(msg);


                app.mongoDB.collection("users").findOne( { _id: parseInt(msg.id) } , function (err, mongoGame) {
                    console.log(mongoGame);

                    app.mongoDB.collection("users").updateOne({
                            _id: parseInt(msg.id)
                        },
                        { $set:
                            {
                                "fen" : msg.data,
                                // "p1_time_end" : data.p1_time_left.getTime() - new Date().getTime(),
                                // "p2_time_end" : data.p2_time_left.getTime() - new Date().getTime(),
                            },
                            $setOnInsert : {
                                "moves" : [],
                                "is_over" : 0,
                                "is_started" : 1,
                            }
                        },
                        { upsert: true },
                        function (err, data) {
                               console.log(err);
                            console.log(mongoGame.p1_time_end);
                            console.log(new Date());
                            io.sockets.emit('eventClient', JSON.stringify({
                                fen : msg.data,
                                p1_time_left : mongoGame.p1_time_end.getTime() - new Date().getTime(),
                                p2_time_left : mongoGame.p2_time_end.getTime() - new Date().getTime(),
                            }));

                            app.mongoDB.collection("users").updateOne({
                                    _id: parseInt(msg.id)
                                },
                                { $addToSet : {"moves" : msg.move}}
                            )
                        }
                    );

                })


            } catch(e){
                console.log(e.message);
            }
        });


        socket.on('disconnect', function(){
            console.log('user disconnected');
        });
    });

    socketApi.sendNotification = function() {
        io.sockets.emit('hello', {msg: 'Hello World!'});
    }

    return socketApi
}
