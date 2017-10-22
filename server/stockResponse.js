const Request = require('request');
const { getStock } = require('./stockSearch.js');
const { makeChart } = require('./svgBuilder.js');

const { checkFavorite, verifyLogin } = require('./userManager.js');

// An object that holds corresponding request url stems for timespan commands
const timespanUrlStems = {
  DAY: 'INTRADAY&interval=5min',
  WEEK: 'INTRADAY&interval=30min',
  MONTH: 'DAILY',
  MONTH3: 'DAILY',
  YEAR: 'WEEKLY',
  YEAR5: 'MONTHLY',
};

// Send JSON response, include body if data is passed
const sendJsonResponse = (response, code, data) => {
  response.writeHead(code, { 'Content-Type': 'application/json' });
  if (data) response.write(JSON.stringify(data));
  response.end();
};

const parseStockData = (receivedJSON, info) => {
  const receivedKeys = Object.keys(receivedJSON);

  // If the parsed response has an error message, send that
  // as a response w/ 400 error for bad request
  if (receivedKeys.length < 2) {
    return {
      code:404,
      stock: info.stock,
      data: receivedJSON[receivedKeys[0]],
    };
  }

  // Get the second property in the response JSON
  // Property name can vary but this is where the data is
  const stockData = receivedJSON[receivedKeys[1]];

  // Store all of the data's keys so we can awkwardly iterate through it
  const dataKeys = Object.keys(stockData);// Good lord have these people not heard of arrays

  // Parse the most recent date in the data as a Date object
  const latestDate = new Date(dataKeys[0]);
  const endDate = latestDate;// Date object that represents furthest date we will go to for data

  // Calculate data's cutoff date based on desired timespan
  switch (info.timespan) {
    case 'DAY':
      endDate.setHours(0, 0, 0, 0);
      break;
    case 'WEEK':
      endDate.setDate(latestDate.getDate() - 7);
      break;
    case 'MONTH':
      endDate.setMonth(latestDate.getMonth() - 1);
      break;
    case 'MONTH3':
      endDate.setMonth(latestDate.getMonth() - 3);
      break;
    case 'YEAR':
      endDate.setFullYear(latestDate.getFullYear() - 1);
      break;
    default:// 5 years
      endDate.setFullYear(latestDate.getFullYear() - 5);
      break;
  }

  // Get an array of the data keys filtered based on whether or not they occur after end date
  const filteredKeys = dataKeys.filter(key => Date.parse(key) >= endDate);

  const data = [];// Array we will store parsed data objects in

  // Loop through data using keys and store info as an object with timestamp and corresponding price
  // Go in reverse order so data will be ordered from oldest->newest
  for (let i = filteredKeys.length - 1; i >= 0; i--) {
    data.push({
      timestamp: dataKeys[i],
      price: parseFloat(stockData[filteredKeys[i]]['4. close']),
    });
  }

  // Return an object with response code and response object to send
  return {
    code: 200,
    stock: info.stock,
    timespan: info.timespan,
    contentsOnly: info.contentsOnly,
    data,
  };
};

const validateQueries = (queries) => {
  // Return an error if missing queries
  if (!queries.timespan || !queries.symbol) {
    return {
      error: true,
      message: 'Both timespan and symbol parameters are required',
    };
  }

  const stock = getStock(queries.symbol);

  if (!stock) {
    return {
      error: true,
      message: `The symbol '${queries.symbol}' could not be found in the database`,
    };
  }

  // Get timespan from queries for request
  const timespan = queries.timespan.toUpperCase();
  const urlStem = timespanUrlStems[timespan];

  // If the timespan isn't valid return an error
  if (!urlStem) {
    return {
      error: true,
      message: 'Given timespan is invalid - must be DAY, WEEK, MONTH, MONTH3, YEAR, YEAR5',
    };
  }

  // Return an object with info derived from queries if they're valid
  return {
    stock,
    timespan,
    urlStem,
  };
};

// Get data as json object
const getStockData = (request, response, queries) => {
  // Validate queries and return object with info derived from them if valid
  const validatedInfo = validateQueries(queries);

  if (validatedInfo.error) {
    // Send bad request error, queries were invalid
    sendJsonResponse(response, 400, {
      id: 'badRequest',
      message: validatedInfo.message,
    });
    return;
  }

  if(queries.user && queries.pass){
    verifyLogin(queries.user,queries.pass,(err,res)=>{
      validatedInfo.stock.favorite = (!err || res) &&
        checkFavorite(validatedInfo.stock.symbol);

      makeDataRequest(respose,validatedInfo);
    });
  }
  else{
    makeDataRequest(response,validatedInfo);
  }
};

const makeDataRequest = (response,validatedInfo) => {
  // Make request to alphavantage API based on queries
  Request(`https://www.alphavantage.co/query?function=TIME_SERIES_${validatedInfo.urlStem}&symbol=${validatedInfo.stock.symbol}&apikey=LA0ZIQVVE5KWHTGH`,
  (err, resp, body) => {
    // If response was 200 then proceed to parse data
    if (resp && resp.statusCode === 200) {
      // Get an object with a response code and an object to send in response
      const parsedData = parseStockData(JSON.parse(body), validatedInfo);

      sendJsonResponse(response, parsedData.code, parsedData);
    } else {
      // If a different code was received then write an error response
      sendJsonResponse(response, resp ? resp.statusCode : 503, { error: err || "Connection failed, please try again later." });
    }
  });
};

// Get data as an svg element in text/html
const getStockChart = (request, response, queries) => {
  // Validate queries and return object with info derived from them if valid
  const validatedInfo = validateQueries(queries);

  if (validatedInfo.error) {
    // Send bad request error, queries were invalid
    sendJsonResponse(response, 400, {
      id: 'badRequest',
      message: validatedInfo.message,
    });
    return;
  }

  validatedInfo.contentsOnly = (queries.contentsOnly && queries.contentsOnly.toLowerCase() === 'true');

  if(queries.user && queries.pass){
    verifyLogin(response,queries.user,queries.pass,()=>{
      validatedInfo.stock.favorite = checkFavorite(validatedInfo.stock.symbol,queries.user);

      makeChartRequest(response,validatedInfo);
    });
  }
  else{
    makeChartRequest(response,validatedInfo);
  } 
};

const makeChartRequest = (response,validatedInfo) => {
    // Make request to alphavantage API based on queries
    Request(`https://www.alphavantage.co/query?function=TIME_SERIES_${validatedInfo.urlStem}&symbol=${validatedInfo.stock.symbol}&apikey=LA0ZIQVVE5KWHTGH`,
    (err, resp, body) => {
      // If response was 200 then proceed to parse data
      if (resp && resp.statusCode === 200) {
        // Parse body and use it to generate a chart
        const responseJson = makeChart(parseStockData(JSON.parse(body), validatedInfo));

        sendJsonResponse(response, responseJson.code, responseJson);
      } else {
        // If a different code was received then write an error response
        sendJsonResponse(response, resp ? resp.statusCode : 404, { err });
      }
    });
};

module.exports = {
  getStockData,
  getStockChart,
};
