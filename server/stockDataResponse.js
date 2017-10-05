const makeRequest = require('request');

const parseStockData = (receivedJSON,timespan)=>{

    //If the parsed response has an error message, send that as a response with a 400 error for bad request since something went wrong with out request to the API
    if(receivedJSON['Error Message']) {
        return {
            code: 400,
            response: receivedJSON,
        };
    }

    //Get the second property in the response JSON, the property name can vary but this is where the data is
    const stockData = receivedJSON[Object.keys(receivedJSON)[1]];
    let dataKeys = Object.keys(stockData);//Store all of the data's keys so we can awkwardly iterate through it, good lord have these people not heard of arrays

    if(timespan !== 'MAX'){
        //Parse the most recent date in the data as a Date object
        const latestDate = new Date(dataKeys[0]);
        latestDate.setHours(0,0,0,0);//Zero out time because we're only really concerned about dates and it can mess up comparisons
        const endDate = latestDate;//Date object that represents furthest date we will go to for data - defaults to just being same as latest date for 1DAY

        //Calculate the end date based on desired timespan, we only want the data that occurs on or after this date
        switch(timespan){
            case '1WEEK':
                endDate.setDate(latestDate.getDate()-7);
                break;
            case '1MONTH':
                endDate.setMonth(latestDate.getMonth()-1);
                break;
            case '3MONTH':
                endDate.setMonth(latestDate.getMonth()-3);
                break;
            case '1YEAR':
                endDate.setFullYear(latestDate.getFullYear()-1);
                break;
            case '5YEAR':
                endDate.setFullYear(latestDate.getFullYear()-5);
                break;
        }

        //Get an array of the data keys filtered based on whether or not they occur after end date
        const filteredKeys = dataKeys.filter(key=>{
            return Date.parse(key) >= endDate;
        });

        //Set dataKeys to this new filtered version
        dataKeys = filteredKeys;
    }

    const data = [];//Array we will store parsed data objects in

    //Loop through data using keys and store info as an object with timestamp and corresponding price
    for(let i = 0; i < dataKeys.length; i++){
        data.push({
            timeStamp: dataKeys[i],
            price: stockData[dataKeys[i]]['4. close'],
        });
    }
    
    //Return an object with response code and response object to send
    return {
        code: 200,
        response: {
            data,
        }
    };
};

//An object that holds corresponding request url stems for timespan commands
const timespanUrlStems = {
    '1DAY':'INTRADAY&interval=5min',
    '1WEEK':'INTRADAY&interval=30min',
    '1MONTH':'DAILY',
    '3MONTH':'DAILY',
    '1YEAR':'WEEKLY',
    '5YEAR':'MONTHLY',
    'MAX':'MONTHLY&outputsize=full',
};

const getStockData = (request,response,queries) => {
    //Return an error if missing queries
    if(!queries.timespan || !queries.symbol) return sendJsonResponse(response,400,{id:'badRequest',message:'Both timespan and symbol parameters are required'});

    //Get timespan from queries for request
    const timespan = queries.timespan.toUpperCase();

    //If the timespan isn't valid return an error
    if(!timespanUrlStems[timespan]) return sendJsonResponse(response,400,{id:'badRequest',message:'Given timespan is invalid - must be 1DAY, 1WEEK, 1MONTH, 3MONTH, 1YEAR, 5YEAR, or MAX'});

    //Make an API request within an API, wooooooaaaahhhh
    makeRequest(`https://www.alphavantage.co/query?apikey=LA0ZIQVVE5KWHTGH&symbol=${queries.symbol}&function=TIME_SERIES_${timespanUrlStems[timespan]}`, (err,resp,body)=>{
        //If response was 200 then proceed to parse data
        if(resp.statusCode === 200){
            const parsedData = parseStockData(JSON.parse(body),timespan);//Parse received data and generate JSON to send as a response - includes a response code and response object which we will return as JSON
            
            return sendJsonResponse(response,parsedData.code,parsedData.response);//
        }
        //If a different code was received then write an error response (although I think AV's API just always sends 200 responses because it's a top-notch API made by cool people)
        else{
            return sendJsonResponse(response,resp.statusCode,{error:err});
        }
    });
};

//Send JSON response, include body if data is passed
const sendJsonResponse = (response,code,data) => {
    response.writeHead(code, {'Content-Type':'application/json'});
    if(data) response.write(JSON.stringify(data));
    response.end();
};

module.exports = {
    getStockData,
};