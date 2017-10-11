const Request = require('request');

// Send JSON response, include body if data is passed
const sendJsonResponse = (response, code, data) => {
  response.writeHead(code, { 'Content-Type': 'application/json' });
  if (data) response.write(JSON.stringify(data));
  response.end();
};

const parseStockData = (receivedJSON, timespan) => {
  const receivedKeys = Object.keys(receivedJSON);
  
  // If the parsed response has an error message, send that
  // as a response w/ 400 error for bad request
  if (receivedKeys.length < 2) {
    return {
      code: 400,
      response: receivedJSON,
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
  switch (timespan) {
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
  for (let i = filteredKeys.length-1; i >= 0; i--) {
    data.push({
      timestamp: dataKeys[i],
      price: parseFloat(stockData[filteredKeys[i]]['4. close']).toFixed(2),
    });
  }

  // Return an object with response code and response object to send
  return {
    code: 200,
    response: {
      timespan,
      data,
    },
  };
};

// An object that holds corresponding request url stems for timespan commands
const timespanUrlStems = {
  DAY: 'INTRADAY&interval=5min',
  WEEK: 'INTRADAY&interval=30min',
  MONTH: 'DAILY',
  MONTH3: 'DAILY',
  YEAR: 'WEEKLY',
  YEAR5: 'MONTHLY',
};

const getStockData = (request, response, queries) => {
  // Return an error if missing queries
  if (!queries.timespan || !queries.symbol) {
    sendJsonResponse(response, 400, {
      id: 'badRequest',
      message: 'Both timespan and symbol parameters are required',
    });
    return;
  }

  // Get timespan from queries for request
  const timespan = queries.timespan.toUpperCase();

  // If the timespan isn't valid return an error
  if (!timespanUrlStems[timespan]) {
    sendJsonResponse(response, 400, {
      id: 'badRequest',
      message: 'Given timespan is invalid - must be DAY, WEEK, MONTH, MONTH4, YEAR, YEAR5',
    });
    return;
  }

  const url = `https://www.alphavantage.co/query?apikey=LA0ZIQVVE5KWHTGH&symbol=${queries.symbol}&function=TIME_SERIES_${timespanUrlStems[timespan]}`;

  sendRequest(url, timespan, response, 5);
};

sendRequest = (url, timespan, response, numRetries) => {
  // Make an API request within an API, wooooooaaaahhhh
  Request(url,
    (err, resp, body) => {
      // If response was 200 then proceed to parse data
      if (resp.statusCode === 200) {
        // Get an object with a response code and an object to send in response
        const parsedData = parseStockData(JSON.parse(body), timespan);

        if(parsedData.response === {} && numRetries > 0) return sendRequest(url, timespan, response, numRetries-1);

        return sendJsonResponse(response, parsedData.code, parsedData.response);
      }
      // If a different code was received then write an error response
      return sendJsonResponse(response, resp.statusCode, { error: err });
    });
}

module.exports = {
  getStockData,
};
