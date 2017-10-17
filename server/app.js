const http = require('http');
const url = require('url');

const clientHandler = require('./clientResponse.js');
const searchHandler = require('./stockSearch.js');
const stockDataHandler = require('./stockResponse.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

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
      clientHandler.getSearchIcon(request,response);
      break;
    case '/logo.png':
      clientHandler.getLogo(request,response);
      break;
    case '/search':
      searchHandler.getSearchResults(request, response, parsedUrl.search.slice(1));
      break;
    case '/stockData':
      stockDataHandler.getStockData(request, response, parsedUrl.query);
      break;
    case '/stockChart':
      stockDataHandler.getStockChart(request, response, parsedUrl.query);
      break;
    default:
      // TODO: implement 404
      break;
  }
};

const handleHead = (request, response, parsedUrl) => {
  switch (parsedUrl.pathname) {
    case '/search':
      searchHandler.getSearchResultsMeta(request, response, parsedUrl.search.slice(1));
      break;
    default:
      // 404
      break;
  }
};

const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  console.log(request.url);

  if (request.method === 'GET') {
    handleGet(request, response, parsedUrl);
  } else if (request.method === 'HEAD') {
    handleHead(request, response, parsedUrl);
  }
};

http.createServer(onRequest).listen(port);

console.log(`Listening on http://127.0.0.1:${port}`);
