const http = require('http');
const url = require('url');

const htmlHandler = require('./htmlResponse.js');
const searchHandler = require('./searchHandler.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const handleGet = (request, response, parsedUrl)=>{
    
    switch(parsedUrl.pathname){
        case '/':
            htmlHandler.getIndex(request,response);
            break;
        case '/style.css':
            htmlHandler.getCSS(request,response);
            break;
        case '/search':
            if(!parsedUrl.search){
                //Return error
            }
            else{
                //Format search string and remove leading '?' character in order for search to work
                const searchQuery = decodeURIComponent(parsedUrl.search.slice(1));
                //Pass search query and write first 25 matching companies as response
                searchHandler.searchCompanies(request,response,searchQuery);
            }

            break;
        default:
            //TODO: 404        
            break;
    }
};

const onRequest = (request,response)=>{
    const parsedUrl = url.parse(request.url, true);
    console.log(request.url);

    if(request.method === 'GET') handleGet(request,response,parsedUrl);
};

http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1:${port}`);