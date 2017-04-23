var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    stocks = require('./app/stocks.js'),
    SocketServer = require('ws').Server,
    http = require('http');
app.set('views', './public');
app.use(express.static('./public'), bodyParser());
app.get("/", function(req, res){
    res.render("twig/index.twig");
})
app.get("/api/getStocks", function(req, res){
    stocks.getDb(req, res);
})
app.post("/addStock", function(req, res){
    console.log("handling addition");
    var code = req.body.code;
    stocks.addStock(code, req, res);
});
app.post("/deleteStocks", function(req, res){
    var code = req.body.code;
    console.log("handling removal for "+code);
    stocks.removeStock(code, req, res);
});
var server = http.createServer(app)
var wss = new SocketServer({ server });
wss.on('connection', function(ws){
    console.log("connecton");
    ws.on('message', function(data){
        console.log("data "+data);
        wss.clients.forEach(function(client){
            console.log("sent to client")
            client.send(data);
        })
    })
    ws.on('close',function(ws){
        console.log('disconnect '+ws);
    });
})
server.listen(process.env.PORT || 8080);