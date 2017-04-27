var vals = [];
var chart;
var HOST = window.location.origin.replace(/^http/, 'ws');
var ws = new WebSocket(HOST);
var persCodes = [];
var options = {
    title: 'Stocks',
    vAxis: {
        title: 'Value ($)',
        format:"currency"
    },
    curveType:"function",
    hAxis:{
        title: 'Date'
    },
    width: $(window).width()*1,
    height: $(window).height()*0.8
    //Sets the chart to be 100% of the window's width, and 80% of the windows height
};
//This is variable initialization
$(document).ready(function(){
    ws.onmessage = function (event) {
        var data = event.data;
        data = JSON.parse(data);
        console.log(data);
        window.location.reload();
        //Reloads the page if a user added or deleted a ticker
    };
    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(drawChart);
    //Initializes the google chart
    $("#submitButton").click(function(){
        var code = $("#code").val().toUpperCase();
        //Code is the inputted ticker symbol, upper cased for consistency
        $.ajax({
            type: "POST",
            url: "/addStock",
            data: {
              code: code
            },
            //Submits a POST AJAX request to /addStock, to add the stock the database
            success: function(data){
                var dat = {
                    event: "added",
                    code: code,
                    codes: persCodes
                };
                ws.send(JSON.stringify(dat));
                /*Uses WebSockets to send data back to the server,
                  Alerting the server a user just added a stock*/
                window.location.reload();
            },
            error: function(data){
              alert("That is not a valid ticker, please try again");
            }
        });
    });
    $(".removeBtn").click(function(){
        var forCode = $(this).attr('for-code');
        $.ajax({
            type: "POST",
            url:"/deleteStocks",
            /*Submits a post request to /deleteStocks, 
              deletes the code from the database*/
            data: {
                code: forCode
            },
            success: function(data){
                data = {
                    event: "removed",
                    code: forCode,
                    codes: persCodes
                };
                //Sends data to server via WebSockets
                ws.send(JSON.stringify(data));
                window.location.reload();
            }
        });
    });
});
function drawChart(){
    googleData = new google.visualization.DataTable();
    //Initializes a Google Chart data instance
    $.ajax({
        type: "POST",
        url:"/api/getStocks",
        //Get's stock data from api
        data: {
            callType: 'api'
        },
        success: function(response){
            var stockData = response.stocks;
            //Stock data from response
            var codes = response.codes;
            //Codes from response
            persCodes = codes;
            var header = [["DATE"].concat(codes)];
            //Header for data like [["DATE", "TICKER1", "TICKER2"...]]
            var firstCode = codes[0];
            for(var x = 0; x<stockData[firstCode].length; x++){
                var date = stockData[firstCode][x].Date;
                //Gets the date from the data
                var search = [];
                for(var y = 0; y<codes.length; y++){
                    var code = codes[y];
                    search.push(parseFloat(stockData[code][x].Close));
                }
                vals.push([date].concat(search));
                //Pushes the stock data to vals
            }
            vals = vals.reverse();
            //Reverses vals to set data to past->present
            vals = header.concat(vals);
            //Concatenates the headers to vals
            vals = google.visualization.arrayToDataTable(vals);
            chart = new google.visualization.LineChart(document.getElementById('chart'));
            chart.draw(vals, options);
            //Draws the chart with the data
        }
    });
}