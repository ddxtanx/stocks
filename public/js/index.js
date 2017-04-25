var vals = [];
var chart;
var HOST = window.location.origin.replace(/^http/, 'ws');
var ws = new WebSocket(HOST);
var persCodes = [];
var view;
var options = {
    title: 'Stocks',
    vAxis: {
        title: 'Value'
    },
    hAxis:{
        title: 'Date'
    },
    width: $(window).width()*1,
    height: $(window).height()*0.8
};
$(document).ready(function(){
    ws.onmessage = function (event) {
        var data = event.data;
        data = JSON.parse(data);
        console.log(data);
        window.location.reload();
    };
    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(drawChart);
    $("#submitButton").click(function(){
        var code = $("#code").val().toUpperCase();
        $.ajax({
            type: "POST",
            url: "addStock",
            data: {
              code: code
            }, 
            success: function(data){
                var dat = {
                    event: "added",
                    code: code,
                    codes: persCodes
                }
                ws.send(JSON.stringify(dat));
              window.location.reload();
            },
            error: function(data){
              alert("That is not a valid ticker, please try again");
            }
        });
    });
});
function addCodes(codes){
    for(var x = 0; x<codes.length; x++){
        var code = codes[x];
        var element = "<div id='code"+x+"' class='stock' for-code='"+code+"'>\
                            <h3> "+code+" </h3>\
                            <button type='button' class='removeBtn' for-code='"+code+"'>X</button>\
                        </div>";
        $("#stocks").prepend(element);
    }
    $(".removeBtn").click(function(){
        var forCode = $(this).attr('for-code');
        $.ajax({
            type: "POST",
            url:"/deleteStocks",
            data: {
                code: forCode
            },
            success: function(data){
                var data = {
                    event: "removed",
                    code: forCode,
                    codes: codes
                }
                ws.send(JSON.stringify(data));
                window.location.reload();
            },
            error: function(data){
                
            }
        })
    })
}
function drawChart(){
    googleData = new google.visualization.DataTable();
    $.ajax({
        type: "GET",
        url:"/api/getStocks",
        success: function(response){
            var stockData = response.stocks;
            var codes = response.codes;
            persCodes = codes;
            var header = [["DATE"].concat(codes)]
            console.log(header);
            var firstCode = codes[0];
            for(var x = 0; x<stockData[firstCode].length; x++){
                var date = stockData[firstCode][x].Date;
                var search = [];
                for(var y = 0; y<codes.length; y++){
                    var code = codes[y];
                    search.push(parseFloat(stockData[code][x].Close));
                }
                vals.push([date].concat(search));
            }
            console.log(vals);
            vals = vals.reverse();
            console.log(vals);
            vals = header.concat(vals);
            vals = google.visualization.arrayToDataTable(vals)
            chart = new google.visualization.LineChart(document.getElementById('chart'));
            chart.draw(vals, options);
            addCodes(codes);
        },
        error: function(data){
            
        }
    });
}