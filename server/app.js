const http = require('http');
const url = require('url');
const query = require('querystring');

const clientHandler = require('./clientResponse.js');
const searchHandler = require('./stockSearch.js');
const stockDataHandler = require('./stockResponse.js');
const userManager = require('./userManager.js');

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
    case '/search':
      searchHandler.getSearchResults(request, response, parsedUrl.query);
      break;
    case '/stockData':
      stockDataHandler.getStockData(request, response, parsedUrl.query);
      break;
    case '/stockChart':
      stockDataHandler.getStockChart(request, response, parsedUrl.query);
      break;
    case '/login':
      userManager.login(request,response,parsedUrl.query);
      break;
    case '/getFavorites':
      userManager.getFavorites(request,response,parsedUrl.query);
      break;
    default:
      console.log('Not found');
      clientHandler.getNotFound(request,response);
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

const handlePost = (request, response, parsedUrl) => {
  
  const res = response;

  const body = [];

  request.on('error',(err)=>{
    res.statusCode = 400;
    res.end();
  });

  request.on('data', (chunk)=>{
    body.push(chunk);
  });

  if(parsedUrl.pathname === '/createUser'){
    request.on('end', ()=>{
      const bodyString = Buffer.concat(body).toString();
      const bodyParams = query.parse(bodyString);
      userManager.createUser(request, res, bodyParams);
    });
  }  
  else if(parsedUrl.pathname === '/updateFavorite'){
    request.on('end', ()=>{
      const bodyString = Buffer.concat(body).toString();
      const bodyParams = query.parse(bodyString);
      userManager.updateFavorite(request, res, bodyParams);
    });
  }
};

const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  console.log(request.url);

  if (request.method === 'GET') {
    handleGet(request, response, parsedUrl);
  } else if (request.method === 'HEAD') {
    handleHead(request, response, parsedUrl);
  } else if(request.method === 'POST') {
    handlePost(request, response, parsedUrl);
  }
};

http.createServer(onRequest).listen(port);

console.log(`Listening on http://127.0.0.1:${port}`);
