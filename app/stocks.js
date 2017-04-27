var http = require('http'),
    mongo = require('mongodb').MongoClient;
//Adding http and mongo
var user = process.env.USER;
var password = process.env.PASS;
//Declaring a user and a password variable, set in the ENVIRONMENT of the host
var mongoUri = "mongodb://"+user+":"+password+"@ds115701.mlab.com:15701/stocks";
//This is the mongo uri to connect to
var monthDays = {
    1: 31,
    2: 28,
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31
};
//Using object style for readibility. This is an object with the number of days in each month
function getYahooData(codes, callback){
    var apiUrl = "http://query.yahooapis.com/v1/public/yql";
    //This is the base url of the YQL api
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var date = now.getDate();
    //This gets todays month day and year
    var endDate =year+"-"+month+"-"+date;
    //Lambda/Arrow function to get date six months ago compactely
    var startDate = (year, month, date)=>{
        if(month<=6){
            year--;
            month = (6+month);
        } else{
            month-=6;
        }
        if(date>monthDays[month]){
            month++;
            date = date-monthDays[month];
        }
        var dateString = year+"-"+month+"-"+date;
        return dateString;
    };
    /*Simple algorithm for calculating a date six months in the past
      This determines if today's month is at the first half of the year,
      in which case it decrements the year, and finds the remaining months in the past,
      and determines if today's day of the month will fit in the new month's days
      and if not, will increment the month, and find the remaining days*/
    startDate = startDate(year, month, date);
    console.log(startDate);
    //Logging
    var data = encodeURIComponent('select Symbol, Date, Close from yahoo.finance.historicaldata where symbol in ('+codes+') and startDate = "' + startDate + '" and endDate = "' + endDate + '"');
    //This is the query part of the YQL api call
    var url = apiUrl+"?q="+data+"&env=store://datatables.org/alltableswithkeys&format=json";
    /*This is the full url of the YQL api call,
      this is called to get all the stock data
      for the ticker symbols in the data*/
    http.get(url, function(response){
        var dat = "";
        response.on('data', function(data){
            dat+=data;
        });
        response.on('end', function(){
            callback(dat);
        });
    });
}
function getDb(req, res){
    //This function grabs ticker code from the mongo database
    mongo.connect(mongoUri, function(err, db){
        if(err) throw err;
        var stocks = db.collection('stocks');
        stocks.find().toArray(function(err, data){
            //Data is a set of ticker symbols
            if(err) throw err;
            console.log(data);
            //Logging
            var codes = [];
            for(var x = 0; x<data.length; x++){
                codes.push(data[x].stockCode);
                //This loops through data and adds all the ticker symbols to the varibale codes
            }
            if(codes.length==0){
                console.log("No tickers");
                res.render("twig/index.twig" ,{error: 'none'});
                return;
                //If there are no codes in the database, just render index and return
            }
            getStocks(codes, req, res);
            //Continues on to getStocks, where codes, req, and res are passed.
        });
    });
}
function getStocks(codes, req, res){
    var editedCodes = codes;
    for(var x = 0; x<codes.length;x++){
        editedCodes[x] = "\""+editedCodes[x]+"\"";
        //Adding in quotes to ensure YQL reads the tickers correctly
    }
    var stringCodes = editedCodes.toString();
    getYahooData(stringCodes, function(data){
            var jsonData = JSON.parse(data);
            //Since format=json in the YQL call, the data will be in JSON format
            var retreivedStocks = jsonData.query.results.quote;
            //The YQL api return the stock data as data.query.result.quote
            var stocks = {};
            for(var x = 0; x<codes.length; x++){
                codes[x] = codes[x].replace(/\"/g, "");
                //This removes the added quotes from the start of getStocks
                var code = codes[x];
                stocks[codes[x]] = retreivedStocks.filter(x => x.Symbol==code);
                /*This organizes the data, and sets
                  all the data with the same ticker symbol in
                  one row of the array, to work better
                  with Google Charts*/
            }
            var responseData = {
                stocks: stocks,
                codes: codes
            };
            //This is the JSON response
            if(req.body.callType=="api"){
                console.log("api call");
                res.writeHead(200, {'Content-Type': 'text/json'});
                //Ensures AJAX reads the result as a success
                res.end(JSON.stringify(responseData));
                //Sends the response data
            } else{
                console.log("page call");
                res.render("twig/index.twig", responseData);
            }
        });
}
function addStock(code, req, res){
    code = code.toUpperCase();
    getYahooData("\""+code+"\"", function(data){
            data = JSON.parse(data);
            if(data.query.results==null){
                res.writeHead(503, {'Content-Type': 'text/json'});
                var error = {
                    error: "Not A Valid Ticker"
                };
                res.end(JSON.stringify(error));
                /*If the ticker symbol does not exist
                      return an error to AJAX*/
                //This attempts to validate the ticker symbol, by checking against the yahoo api for data with that Ticker
            } else{
                mongo.connect(mongoUri, function(err, db){
                    if(err) throw err;
                    var stocks = db.collection('stocks');
                    var insertData = {
                        stockCode: code
                    };
                    //This inserts the ticker into the mongodb, for persistence
                    stocks.insert(insertData, function(err, data){
                        if(err) throw err;
                        res.writeHead(200, {'Content-Type': 'text/json'});
                        res.end(JSON.stringify(data));
                    });
                    //This inserts the ticker into the mongodb, for persistence
                });
            }
        });
}
function removeStock(code, req, res){
    //This is counter to addStock, and removes a stock with a given code
    mongo.connect(mongoUri, function(err, db){
        if(err) throw err;
        var stocks = db.collection('stocks');
        stocks.remove({
            stockCode: code
        }, function(err, data){
            if(err) throw err;
            res.writeHead(200, {'Content-Type':'text/json'});
            res.end(JSON.stringify(data));
        });
    });
}
module.exports.getStocks = getStocks;
module.exports.getDb = getDb;
module.exports.addStock = addStock;
module.exports.removeStock = removeStock;
//Exporting the functions, so server.js can call them