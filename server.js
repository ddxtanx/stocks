var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    stocks = require('./app/stocks.js'),
    SocketServer = require('ws').Server,
    http = require('http');
//Sets all variables
app.set('views', './public');
app.use(express.static('./public'), bodyParser());
/*Express will now serve files from ./public, and bodyParser() will be
  available to all express routes*/
app.get("/", function(req, res){
    stocks.getDb(req, res);
    //Get's stocks from database when user visits /
});
app.post("/api/getStocks", function(req, res){
    console.log(req.body.callType);
    stocks.getDb(req, res);
    //Gets all stock data with the codes in req.body.codes
});
app.post("/addStock", function(req, res){
    console.log("handling addition");
    var code = req.body.code;
    stocks.addStock(code, req, res);
    //Adds a stock code to the database
});
app.post("/deleteStocks", function(req, res){
    var code = req.body.code;
    console.log("handling removal for "+code);
    stocks.removeStock(code, req, res);
    //Removes a stock code from the database
});
var server = http.createServer(app);
var wss = new SocketServer({ server });
//Setting up web sockets
wss.on('connection', function(ws){
    console.log("connecton");
    //Logs when a user connects
    ws.on('message', function(data){
        console.log("data "+data);
        wss.clients.forEach(function(client){
            console.log("sent to client");
            client.send(data);
            //When A client sends data, send that data to all clients
        });
    });
    ws.on('close',function(ws){
        console.log('disconnect '+ws);
        //Logs when a user disconnects
    });
});
server.listen(process.env.PORT || 8080);
/*Sets the WebSockets and Express server to listen on either the 
  environment set PORT or the default port 8080*/