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
                window.location.reload();
            },
            error: function(data){
                
            }
        })
    })
}
function drawChart(){
    var data = new google.visualization.DataTable();
    $.ajax({
        type: "GET",
        url:"/api/getStocks",
        success: function(response){
            var stockData = response.stocks;
            var codes = response.codes;
            data.addColumn('string', "DATE");
            for(var x = 0; x<codes.length; x++){
                data.addColumn('number', codes[x]);   
            }
            var vals = [];
            var firstCode = codes[0];
            for(var x = 0; x<stockData[firstCode].length; x++){
                var date = stockData[firstCode][x].Date;
                var search = [];
                for(var y = 0; y<codes.length; y++){
                    var code = codes[y];
                    search.push(parseFloat(stockData[code][x].Close));
                }
                vals[x] = [date].concat(search);
            }
            data.addRows(vals);
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
            var chart = new google.visualization.LineChart(document.getElementById('chart'));
            chart.draw(data, options);
            addCodes(codes);
        },
        error: function(data){
            
        }
    });
}
$(document).ready(function(){
    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(drawChart);
    $("#submitButton").click(function(){
        var code = $("#code").val();
        $.ajax({
            type: "POST",
            url: "addStock",
            data: {
              code: code
            }, 
            success: function(data){
              window.location.reload();
            },
            error: function(data){
              alert("That is not a valid ticker, please try again");
            }
        });
    });
});