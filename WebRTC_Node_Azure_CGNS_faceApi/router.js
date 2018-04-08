/**
 * This module serves as the router to the different views. It handles
 * any incoming requests.
 *
 * @param app An express object that handles our requests/responses
 * @param socketIoServer The host address of this server to be injected in the views for the socketio communication
 */

'use strict';

var log4js = require('log4js');
var fs = require("fs");
var bodyParser = require('body-parser');
var cors = require('cors');


module.exports = function (app, socketIoServer) {

    log4js.configure({
        appenders: { webrtc: { type: 'file', filename: 'webrtc.log' } },
        categories: { default: { appenders: ['webrtc'], level: 'debug' } }
    });
    app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(cors());



    app.get('/', function (req, res) {
        res.render('home');
    });


    // TODO this is temporary 
    // take photo
    // 
    app.get("/IC.png", function (req, res) {
        fs.readFile('IC.png', function (err, data) {
            if (err) throw err; // Fail if the file can't be read.
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(data); // Send the file data to the browser.
        });
    });



    var arr = new Array();
    app.get("/rooms",
        function(req, res) {
            res.send(arr);
        });
   
    app.post("/callCS",
        function (req, res) {
            var roomid = channelId();
            arr.push(roomid);
            res.send({ roomid: roomid });
        });
    app.post("/answer",
        function (req, res) {
            var roomid = req.body.roomid;
            var index = arr.indexOf(roomid);
            if (index > -1) {
                arr.splice(index, 1);
            }
            
            res.send("ok");
        });


    //
    // call client
    app.get("/call",
        function(req, res) {
            var token = req.query.registration_token;
            var title = req.query.title;
            var body = req.query.body;
            var roomid = req.query.roomid;


            console.log(req.query);

            var logger = log4js.getLogger("webrtc");
            logger.debug("calling " + token);
            console.log("client registration key :");
            console.log(token);

            var serverKey = ''; //put your server key here
            
            var gcm = require('node-gcm');

            // Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
            var sender = new gcm.Sender(serverKey);

            // Prepare a message to be sent
            var message = new gcm.Message({
                data: { roomid: roomid, title: title, body: body }
                //notification:{title:title,body:body}
            });

            // Specify which registration IDs to deliver the message to
            var regTokens = [token];

            // Actually send the message
            sender.send(message, { registrationTokens: regTokens }, function (err, response) {
                if (err) {
                    console.error(err);
                    res.send("error");
                }
                else {
                    console.log(response);
                    res.send("ok");
                }
            });

        });
    app.post("/call",
        function (req, res) {
            var token = req.body.registration_token;
            var title = req.body.title;
            var body = req.body.body;
            var roomid = req.body.roomid;


            console.log(req.body);

            var logger = log4js.getLogger("webrtc");
            logger.debug("calling " + token);
            console.log("client registration key :");
            console.log(token);

            var serverKey = ''; //put your server key here
            
            var gcm = require('node-gcm');

            // Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
            var sender = new gcm.Sender(serverKey);

            // Prepare a message to be sent
            var message1 = new gcm.Message({
                data: { roomid: roomid, title: title, body: body }
              //  notification:{title:title,body:body}
            });
            // Specify which registration IDs to deliver the message to
            var regTokens = [token];

            // Actually send the message
            sender.send(message1, { registrationTokens: regTokens }, function (err, response) {
                if (err) {
                    console.error(err);
                    res.send("error");
                }
                else {
                    console.log(response);
                    res.send("ok");
                }
            });
         


        });

    app.get("/alltoken",
        function(req, res) {
            var url = "http://webrtcapi.azurewebsites.net/api/user/alltoken";
            var request = require('request');
            request(url, function (error, response, body) {
                console.log('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log('body:', body); // Print the HTML for the Google homepage.
                res.send(body);
            });
          
        });

    app.get('/:path', function (req, res) {
        var path = req.params.path;

        if (path.indexOf("capture") != -1) {
            fs.readFile(path,
                function (err, data) {
                    if (err) throw err; // Fail if the file can't be read.
                    res.writeHead(200, { 'Content-Type': 'image/png' });
                    res.end(data); // Send the file data to the browser.
                });
        } else {
            console.log(path);
            console.log("Requested room " + path);


            var scoreboarddisplay = "none";
            if (req.query["admin"] == "true") {
                scoreboarddisplay = "block";
            }

            res.render('room', { "hostAddress": socketIoServer, scoreboarddisplay: scoreboarddisplay });
        }

    });


 

    app.post("/snap",
        function (req, res) {

            var logger = log4js.getLogger("webrtc");

            try {

                var base64Data = req.body.imgData.replace(/^data:image\/png;base64,/, "");
                //  logger.debug(base64Data);

                var status = "ok";
                var filename = 'capture' + Date.now() + ".png";

                fs.writeFile(filename, base64Data, 'base64', function (err) {
                    logger.error(err);
                    status = err;
                });

                res.send({ filename: filename, status: status });
            } catch (ex) {
                logger.error(ex);
                res.send(ex.message);
            }

        });

    //
    //
    //
    app.post("/sms",
        function (req, res) {
            var to = req.body.to;
            if (to.indexOf("+") == -1) {
                to = "+65" + to;
            }

            var roomid = req.body.roomid;
            var text = req.body.text;
            var link = "http://webrtcdemo.azurewebsites.net/" + roomid;

            var logger = log4js.getLogger("webrtc");
            logger.debug(to + "|" + roomid + "|" + text + "|");

            var twilioNumber = '+18444599647';
            var accountSid = 'AC0cebd313cef7070bfdf453e201cdf4aa';
            var authToken = 'e3c90a5da0624e45d508674ad05c7465';

            var client = require('twilio')(accountSid, authToken);

            client.messages.create({
                body: text + link,
                to: to,
                from: twilioNumber
            }, function (err, message) {
                throw err;
            });

            res.send("ok");
        });


   
    
    function channelId() {
        return ("000000" + (Math.random() * Math.pow(36, 6) << 0).toString(36)).slice(-6)
    }
}