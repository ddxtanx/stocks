var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    stocks = require('./app/stocks.js');
app.set('views', './public');
app.use(express.static('./public'), bodyParser());
app.get("/", function(req, res){
    res.render("twig/index.twig");
})
app.get("/api/getStocks", function(req, res){
    stocks.getDb(req, res);
})
app.listen(process.env.PORT || 8080);