'use strict';

//Enum for request method being made to API
var requestMethodEnum = {
    get: 'GET',
    head: 'HEAD',
    post: 'POST'
};

//Enum for type of request being made to API
var requestTypeEnum = {
    search: 0,
    getStockPage: 1,
    getStockData: 2
};

//Take server response and send it off to appropriate area to be handled
var handleResponse = function handleResponse(xhr, responseType) {
    if (responseType === requestTypeEnum.search) handleSearchResponse(JSON.parse(xhr.response));else if (responseType === requestTypeEnum.getStockData) displayStockData(JSON.parse(xhr.response).data);
    //else if(responseType === requestTypeEnum.getStockPage)
    //displayStockPage(xhr.response);
};

//Takes what method we should use, type of request from enum,
//and an object containing any additional params for request path
var sendRequest = function sendRequest(method, requestType, parameters) {
    var xhr = new XMLHttpRequest();

    //If searching through stock database
    if (requestType === requestTypeEnum.search && parameters.search) {
        xhr.open(method, '/search?' + parameters.search, true);
        xhr.setRequestHeader('Accept', 'application/json');
    }
    //If requesting data on a specific stock for a time period
    else if (requestType === requestTypeEnum.getStockData && parameters.symbol && parameters.timespan) {
            xhr.open(method, '/stockData?symbol=' + parameters.symbol + '&timespan=' + parameters.timespan, true);
            xhr.setRequestHeader('Accept', 'application/json');
        }
        //If requesting a page for a stock
        else if (requestType === requestTypeEnum.getStockPage && parameters.symbol) {
                xhr.open(method, '/stock?symbol=' + parameters.symbol, true);
                xhr.setRequestHeader('Accept', 'text/html');
            }
            //If request type doesn't match these then something messed up, just return early
            else return;

    //Call handleResponse when response loaded, give it the response and info on how to handle it
    xhr.onload = function () {
        return handleResponse(xhr, requestType);
    };

    xhr.send();
};
'use strict';

var lastWordSearched = '';

var sendSearch = function sendSearch(searchValue) {
    searchValue = searchValue.trim();

    if (lastWordSearched === searchValue) return;

    lastWordSearched = searchValue;

    if (searchValue === '') {
        clearSearchResults();
        return;
    }

    sendRequest('GET', requestTypeEnum.search, { search: searchValue });
};

var clearSearchResults = function clearSearchResults() {
    var searchResults = document.getElementById("searchResults");

    while (searchResults.firstChild) {
        searchResults.removeChild(searchResults.firstChild);
    }searchResults.style.height = 0;
};

var handleSearchResponse = function handleSearchResponse(responseData) {
    clearSearchResults();

    var searchResults = document.getElementById("searchResults");

    var resultsHeight = 0;

    if (responseData.stocks.length === 0) {
        var message = document.createElement('span');
        message.className = 'searchSymbol';
        message.textContent = 'No results';

        var resultDiv = document.createElement('div');
        resultDiv.appendChild(message);

        searchResults.appendChild(resultDiv);

        resultsHeight = resultDiv.clientHeight;
    }

    var _loop = function _loop(i) {
        var stock = responseData.stocks[i];

        var symbolSpan = document.createElement('span');
        symbolSpan.className = 'searchSymbol';
        symbolSpan.textContent = stock.symbol;

        var nameSpan = document.createElement('span');
        nameSpan.className = 'searchName';
        nameSpan.innerHTML = stock.name;

        var result = document.createElement('div');
        //result.href = `/stock?symbol=${stock.symbol}`;

        result.appendChild(symbolSpan);
        result.appendChild(nameSpan);

        result.addEventListener('click', function () {
            clearSearchResults();
            sendRequest(requestMethodEnum.get, requestTypeEnum.getStockData, { symbol: stock.symbol, timespan: 'DAY' });
        });

        searchResults.appendChild(result);

        resultsHeight += result.clientHeight;
        //console.log(result.clientHeight);
    };

    for (var i = 0; i < responseData.stocks.length; i++) {
        _loop(i);
    }

    searchResults.style.height = resultsHeight + 'px';
};

//IIFE to initialize search bar related stuff
(function () {
    var searchBar = document.getElementById('searchBar');

    searchBar.addEventListener('keyup', function () {
        return sendSearch(searchBar.value);
    });
    searchBar.addEventListener('focus', function () {
        return sendSearch(searchBar.value);
    });
    /*searchBar.addEventListener('blur',()=>{
        clearSearchResults();
        lastWordSearched = '';
    });*/
})();
/*const drawData = (data)=>{
    const graph = d3.select('#graph');
    
    const width = graph.attr('width'),
          height = graph.attr('height');
    
    const yScale = d3.scale.linear()
        .domain([d3.min(data), d3.max(data)])
        .range([height*0.05,height*0.95]);
    
    const xScale = d3.time.scale()
        .range(0,width);

    const nestedData = d3.nest()
        .key(d=>{return d.price;})
        .key(d=>{return d.timestamp;})
        .entries(data);

    const min = d3.min(nestedData, d=>{
        return d3.min(d.values, dat=>{return dat.values.length;});
    });

    const max = d3.max(nestedData, d=>{
        return d3.max(d.values, dat=>{return dat.values.length;});
    });
};
*/
"use strict";
'use strict';

var handleStockDataResponse = function handleStockDataResponse() {};

var displayStockData = function displayStockData(data) {

    var canvas = document.getElementById('visualization');
    var ctx = canvas.getContext('2d');

    var width = canvas.width;
    var height = canvas.height;

    var adjustedData = [];

    var min = Number.POSITIVE_INFINITY,
        max = Number.NEGATIVE_INFINITY;

    for (var i = 0; i < data.length; i++) {
        var p = data[i].price;

        if (p < min) min = p;
        if (p > max) max = p;
    }
    var startY = 0.95 * height;
    var yScalar = 0.9 * height / (max - min);
    var pointDistX = width / (data.length - 1);

    var startPrice = startY - (data[0].price - min) * yScalar;

    ctx.clearRect(0, 0, width, height);

    //Draw dotted line for open price
    ctx.strokeStyle = '#999';
    ctx.setLineDash([10, 10]);
    ctx.lineCap = 'butt';

    ctx.beginPath();
    ctx.moveTo(0, startPrice);
    ctx.lineTo(canvas.width, startPrice);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.strokeStyle = data[data.length - 1].price > data[0].price ? 'green' : 'red';

    ctx.beginPath();
    ctx.moveTo(0, startPrice);

    for (var _i = 1; _i < data.length; _i++) {
        ctx.lineTo(_i * pointDistX, startY - (data[_i].price - min) * yScalar);
    }

    ctx.stroke();
};
