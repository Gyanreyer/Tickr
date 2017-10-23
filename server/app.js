const http = require('http');
const url = require('url');
const query = require('querystring');

const clientHandler = require('./clientResponse.js');
const searchHandler = require('./stockSearch.js');
const stockDataHandler = require('./stockResponse.js');
const userManager = require('./userManager.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// Handle get requests
const handleGet = (request, response, parsedUrl) => {
  switch (parsedUrl.pathname) {
    case '/':
      clientHandler.getIndex(request, response);
      break;
    case '/style.css':
      clientHandler.getCSS(request, response);
      break;
    case '/bundle.js':
      clientHandler.getJS(request, response);
      break;
    case '/searchIcon.png':
      clientHandler.getSearchIcon(request, response);
      break;
    case '/refreshIcon.png':
      clientHandler.getRefreshIcon(request, response);
      break;
    case '/empty-heart.png':
      clientHandler.getEmptyHeartIcon(request, response);
      break;
    case '/full-heart.png':
      clientHandler.getFullHeartIcon(request, response);
      break;
    case '/search':// Search stock database by symbol/name
      searchHandler.getSearchResults(request, response, parsedUrl.query);
      break;
    case '/stockData':// Get a JSON object with stock data
      stockDataHandler.getStockData(request, response, parsedUrl.query);
      break;
    case '/stockChart':// Get an svg chart visualizing stock data
      stockDataHandler.getStockChart(request, response, parsedUrl.query);
      break;
    case '/login':// Attempt to log in with given credentials
      userManager.login(request, response, parsedUrl.query);
      break;
    case '/getFavorites':// Get user's favorites list
      userManager.getFavorites(request, response, parsedUrl.query);
      break;
    default:// Default to 404
      clientHandler.getNotFound(request, response);
      break;
  }
};

// Handle head requests
const handleHead = (request, response, parsedUrl) => {
  switch (parsedUrl.pathname) {
    case '/search':
      searchHandler.getSearchResultsMeta(request, response, parsedUrl.search.slice(1));
      break;
    case '/login':
      userManager.login(request, response, parsedUrl.query, true);
      break;
    case '/getFavorites':
      userManager.getFavorites(request, response, parsedUrl, true);
      break;
    default:
      response.statusCode = 404;
      response.end();
      break;
  }
};

// Handle post requests
const handlePost = (request, response, parsedUrl) => {
  const res = response;

  const body = [];

  request.on('error', () => {
    res.statusCode = 400;
    res.end();
  });

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  // Create a new user
  if (parsedUrl.pathname === '/createUser') {
    request.on('end', () => {
      const bodyString = Buffer.concat(body).toString();
      const bodyParams = query.parse(bodyString);
      userManager.createUser(request, res, bodyParams);
    });
  } else if (parsedUrl.pathname === '/updateFavorite') { // Update user's favorites list
    request.on('end', () => {
      const bodyString = Buffer.concat(body).toString();
      const bodyParams = query.parse(bodyString);
      userManager.updateFavorite(request, res, bodyParams);
    });
  } else { // Default to sending not found error
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.write(JSON.stringify({ id: 'notFound', message: 'Invalid path' }));
    response.end();
  }
};

const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url, true);

  if (request.method === 'GET') {
    handleGet(request, response, parsedUrl);
  } else if (request.method === 'HEAD') {
    handleHead(request, response, parsedUrl);
  } else if (request.method === 'POST') {
    handlePost(request, response, parsedUrl);
  }
};

http.createServer(onRequest).listen(port);
