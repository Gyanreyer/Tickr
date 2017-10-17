const csv = require('fast-csv');
const fs = require('fs');
const Fuse = require('fuse.js');

const stockList = [];// List of all parsed stocks from csv file

let fuseSearch;// Object for searching all 

// Run an IIFE to initialize everything
(() => {
  // Read stream for reading stockList.csv
  const fileStream = fs.createReadStream(`${__dirname}/../hosted/stockList.csv`);

  // Parse data from file stream and append it to stockList
  // fast-csv fires data event for each line, passes data as an array of properties from that line
  const csvStream = csv().on('data', data => stockList.push({
    symbol: data[0], // First element is stock symbol
    name: decodeURI(data[1]), // Second element is company name
  })).on('end', () => {
    // Create new fuse object for searching
    // Takes the array that it's going to search an an options object
    fuseSearch = new Fuse(stockList, {
      shouldSort: true, // Sort results by score/weight so closest match is first
      threshold: 0.05, // Threshhold of score to consider a string a match
      keys: [{// Keys that should be searched and weights to assign to them
        name: 'symbol',
        weight: 0.4,
      }, {
        name: 'name',
        weight: 0.6,
      }],
    });
  });

  fileStream.pipe(csvStream);// Pipe cvsStream to fileStream
})();

// Send a JSON response, include body if data is passed
const sendJsonResponse = (response, code, data) => {
  response.writeHead(code, { 'Content-Type': 'application/json' });
  if (data) response.write(JSON.stringify(data));
  response.end();
};

// Return search results from given search string
const getSearchResults = (request, response, searchString) => {
  sendJsonResponse(response, 200, {
    // Return up to the first 20 matches from search
    stocks: fuseSearch.search(decodeURIComponent(searchString)).slice(0, 20),
  });
};

// Response with metadata head depending on whether there's a search match or not
const getSearchResultsMeta = (request, response, searchString) => {
  const matchFound = fuseSearch.search(searchString).length > 0;

  return sendJsonResponse(response, matchFound ? 200 : 204);
};

// Search stock list by symbol and return corresponding stock's
// symbol + name object if it exists
const getStock = (symbol) => {
  const sym = symbol.toUpperCase();
  return stockList.find(s => s.symbol === sym);
};

module.exports = {
  getSearchResults,
  getSearchResultsMeta,
  getStock,
};
