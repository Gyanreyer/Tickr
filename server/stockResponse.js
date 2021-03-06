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
const sendResponse = (response, code, data) => {
  response.writeHead(code, { 'Content-Type': 'application/json' });
  if (data) response.write(JSON.stringify(data));
  response.end();
};

// Parse data received from AlphaVantage
const parseStockData = (receivedJSON, info) => {
  const receivedKeys = Object.keys(receivedJSON);

  // If the parsed response has an error message, send that
  // as a response w/ 404 error b/c failed to find data
  if (receivedKeys.length < 2) {
    return {
      code: 404,
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

// Validate received queries for data/chart request
const validateQueries = (queries) => {
  // Return an error if missing queries
  if (!queries.timespan || !queries.symbol) {
    return {
      error: true,
      message: 'Both timespan and symbol parameters are required',
    };
  }

  // Verify that symbol is a valid stock in db
  const stock = getStock(queries.symbol);

  if (!stock) {
    return {
      error: true,
      message: `The symbol '${queries.symbol}' could not be found in the database`,
    };
  }

  stock.favorite = false;// Favorite status defaults to false

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

const makeDataRequest = (response, validatedInfo) => {
  // Make request to alphavantage API based on queries
  Request(`https://www.alphavantage.co/query?function=TIME_SERIES_${validatedInfo.urlStem}&symbol=${validatedInfo.stock.symbol}&apikey=LA0ZIQVVE5KWHTGH`,
    (err, resp, body) => {
    // If response was 200 then proceed to parse data
      if (resp && resp.statusCode === 200) {
      // Get an object with a response code and an object to send in response
        const parsedData = parseStockData(JSON.parse(body), validatedInfo);

        sendResponse(response, parsedData.code, parsedData);
      } else {
      // If a different code was received then write an error response
        sendResponse(response, resp ? resp.statusCode : 503, { error: err || 'Connection failed, please try again later.' });
      }
    });
};

// Get data as json object
const getStockData = (request, response, queries) => {
  // Validate queries and get back object with them formatted nicely
  const validatedInfo = validateQueries(queries);

  // If there's an error in validated info, send bad request
  if (validatedInfo.error) {
    sendResponse(response, 400, {
      id: 'badRequest',
      message: validatedInfo.message,
    });
    return;
  }

  // If username and password included in queries, verify login
  if (queries.user && queries.pass) {
    verifyLogin(response, queries.user, queries.pass, () => {
      // Check whether user has favorited this stock
      validatedInfo.stock.favorite = checkFavorite(validatedInfo.stock.symbol);

      makeDataRequest(response, validatedInfo);// Make data request
    });
  } else {
    makeDataRequest(response, validatedInfo);// Make data request w/o login
  }
};

const makeChartRequest = (response, validatedInfo) => {
  // Make request to alphavantage API based on queries
  Request(`https://www.alphavantage.co/query?function=TIME_SERIES_${validatedInfo.urlStem}&symbol=${validatedInfo.stock.symbol}&apikey=LA0ZIQVVE5KWHTGH`,
    (err, resp, body) => {
      // If response was 200 then proceed to parse data
      if (resp && resp.statusCode === 200) {
        // Parse body and use it to generate an object with a chart and some other info
        const responseJson = makeChart(parseStockData(JSON.parse(body), validatedInfo));

        sendResponse(response, responseJson.code, responseJson);
      } else {
        // If a different code was received then write an error response
        sendResponse(response, resp ? resp.statusCode : 404, { err });
      }
    });
};

// Get data as an svg element in text/html
const getStockChart = (request, response, queries) => {
  // Validate queries and get back object with them formatted nicely
  const validatedInfo = validateQueries(queries);

  // If there's an error in validated info, send bad request
  if (validatedInfo.error) {
    sendResponse(response, 400, {
      id: 'badRequest',
      message: validatedInfo.message,
    });
    return;
  }

  // Check queries if only want contents of svg or full element
  // For my purposes, I always want contents only
  validatedInfo.contentsOnly =
    (queries.contentsOnly && queries.contentsOnly.toLowerCase() === 'true');

  // If username and password included in queries, verify login
  if (queries.user && queries.pass) {
    verifyLogin(response, queries.user, queries.pass, () => {
      // Check whether user has favorited this stock
      validatedInfo.stock.favorite = checkFavorite(validatedInfo.stock.symbol, queries.user);

      makeChartRequest(response, validatedInfo);// Make chart request
    });
  } else {
    makeChartRequest(response, validatedInfo);// Make chart request w/o login
  }
};

module.exports = {
  getStockData,
  getStockChart,
};
