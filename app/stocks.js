var http = require('http'),
    mongo = require('mongodb').MongoClient;
var user = process.env.USER;
var password = process.env.PASS;
var mongoUri = "mongodb://"+user+":"+password+"@ds115701.mlab.com:15701/stocks";
console.log(mongoUri);
function getDb(req, res){
    mongo.connect(mongoUri, function(err, db){
        if(err) throw err;
        var stocks = db.collection('stocks');
        stocks.find().toArray(function(err, data){
            if(err) throw err;
            console.log(data);
            var codes = [];
            for(var x = 0; x<data.length; x++){
                codes.push(data[x].stockCode);
            }
            getStocks(codes, req, res);
        })
    })
}
function getStocks(codes, req, res){
    var editedCodes = codes;
    for(var x = 0; x<codes.length;x++){
        editedCodes[x] = "\""+editedCodes[x]+"\"";
    }
    var stringCodes = editedCodes.toString();
    var apiUrl = "http://query.yahooapis.com/v1/public/yql";
    var startDate = '2017-01-01';
    var endDate = '2017-04-08';
    var data = encodeURIComponent('select Symbol, Date, Close from yahoo.finance.historicaldata where symbol in ('+stringCodes+') and startDate = "' + startDate + '" and endDate = "' + endDate + '"')
    var url = apiUrl+"?q="+data+"&env=store://datatables.org/alltableswithkeys&format=json";
    console.log(url);
    http.get(url, function(response){
        var dat = ""
        response.on('data', function(data){
            dat+=data
        });
        response.on('end', function(){
            var jsonData = JSON.parse(dat);
            var retreivedStocks = jsonData.query.results.quote;
            var stocks = {};
            for(var x = 0; x<codes.length; x++){
                codes[x] = codes[x].replace(/\"/g, "");
                var code = codes[x];
                stocks[codes[x]] = retreivedStocks.filter(x => x.Symbol==code);
            }
            console.log(stocks);
            var responseData = {
                stocks: stocks,
                codes: codes
            }
            res.writeHead(200, {'Content-Type': 'text/json'});
            res.end(JSON.stringify(responseData));
        })
    })
}
function addStock(code, req, res){
    var apiUrl = "http://query.yahooapis.com/v1/public/yql";
    var startDate = '2017-01-01';
    var endDate = '2017-04-08';
    var data = encodeURIComponent('select Symbol, Date, Close from yahoo.finance.historicaldata where symbol in (\"'+code+'\") and startDate = "' + startDate + '" and endDate = "' + endDate + '"')
    var url = apiUrl+"?q="+data+"&env=store://datatables.org/alltableswithkeys&format=json";
    http.get(url, function(response){
        var dat = ""
        response.on('data', function(data){
            dat+=data
        });
        response.on('end', function(){
            dat = JSON.parse(dat);
            if(dat.query.results==null){
                res.writeHead(503, {'Content-Type': 'text/json'});
                var error = {
                    error: "Not A Valid Ticker"
                };
                res.end(JSON.stringify(error));
            } else{
                mongo.connect(mongoUri, function(err, db){
                    if(err) throw err;
                    var stocks = db.collection('stocks');
                    var insertData = {
                        stockCode: code
                    };
                    stocks.insert(insertData, function(err, data){
                        if(err) throw err;
                        res.writeHead(200, {'Content-Type': 'text/json'});
                        res.end(JSON.stringify(data));
                    });
                })
            }
        });
    });
}
function removeStock(code, req, res){
    mongo.connect(mongoUri, function(err, db){
        if(err) throw err;
        var stocks = db.collection('stocks');
        stocks.remove({
            stockCode: code
        }, function(err, data){
            if(err) throw err;
            res.writeHead(200, {'Content-Type':'text/json'});
            res.end(JSON.stringify(data));
        })
    })
}
module.exports.getStocks = getStocks;
module.exports.getDb = getDb;
module.exports.addStock = addStock;
module.exports.removeStock = removeStock;