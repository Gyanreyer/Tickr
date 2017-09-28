/*const http = require('http');
//const request = require('request');

const getStockData = (request,response,queries) => {
    
    let querySymbol = `symbol=${queries.symbol}`;
    let apiKey = 'apikey=LA0ZIQVVE5KWHTGH';
    let queryFunction = 'function=';
    let querySize = 'outputsize='; 
    
    switch(queries.timespan){
        case 'week':
            queryFunction += 'TIME_SERIES_INTRADAY&interval=30min';
            querySize += 'compact';
            break;
        case 'month':
        case 'sixmonths':
            queryFunction += 'TIME_SERIES_DAILY_ADJUSTED';
            querySize += 'compact';
            break;
        case 'year':
            queryFunction += 'TIME_SERIES_DAILY_ADJUSTED';
            querySize += 'full';
            break;
        case 'fiveyears':
            queryFunction += 'TIME_SERIES_MONTHLY';
            querySize += 'compact';
            break;
        case 'max'://Display as much historical data is available, AlphaVantage supports going up to 20 years back
            queryFunction += 'TIME_SERIES_MONTHLY';
            querySize += 'full';
            break;
        default://Default to today's data
            queryFunction += 'TIME_SERIES_INTRADAY&interval=5min';
            querySize += 'compact';
            break;
    }

    const queryString = `http://www.alphavantage.co/query?${querySymbol}&${apiKey}&${queryFunction}&${querySize}`;

    http.get(queryString, (res)=>{
        console.log(res.statusCode);
        //writeResponse(request,response,res);
    });
};

const writeResponse = (request, response, data)=>{
    response.writeHead(200,{'Type':'application/json'});
    response.write(data);
    response.end();
};

module.exports = {
    getStockData,
};*/