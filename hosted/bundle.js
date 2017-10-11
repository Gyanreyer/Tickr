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
    if (responseType === requestTypeEnum.search) handleSearchResponse(JSON.parse(xhr.response));else if (responseType === requestTypeEnum.getStockData) handleStockDataResponse(JSON.parse(xhr.response));
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

        result.appendChild(symbolSpan);
        result.appendChild(nameSpan);

        result.addEventListener('click', function () {
            clearSearchResults();
            buildStockPage(stock);
        });

        searchResults.appendChild(result);

        resultsHeight += result.clientHeight;
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

var loadedData = { currentData: 'DAY' };
var timespans = ['DAY', 'WEEK', 'MONTH', 'MONTH3', 'YEAR', 'YEAR5'];

var mousePos = {
    x: 0,
    y: 0,
    over: false
};

var handleStockDataResponse = function handleStockDataResponse(resp) {
    var data = resp.data;

    if (!data) return; //Throw an error somehow?

    for (var i = 0; i < data.length; i++) {
        data[i].price = parseFloat(data[i].price);
    }

    loadedData.data[resp.timespan] = data;

    for (var _i = 0; _i < timespans.length; _i++) {
        if (!loadedData.data[timespans[_i]]) return;
    }

    finishLoadingPage();
};

var displayStockData = function displayStockData(data, selectButton) {
    document.getElementById(loadedData.currentData).removeAttribute('class');
    selectButton.className = 'selected';
    loadedData.currentData = selectButton.id;

    var priceChange = data[data.length - 1].price - data[0].price;
    var percentChange = 100 * priceChange / data[data.length - 1].price;

    document.getElementById('infoChange').textContent = (priceChange < 0 ? '-' : '+') + '$' + Math.abs(priceChange.toFixed(2)) + ' (' + percentChange.toFixed(2) + '%)';

    document.getElementById("dateLabel").className = document.getElementById("priceLabel").className = document.getElementById("changeLabel").className = priceChange >= 0 ? 'green' : 'red';

    var canvas = document.getElementById('visualization');
    var ctx = canvas.getContext('2d');

    var width = canvas.width;
    var height = canvas.height;

    var min = data[0].price;
    var max = data[0].price;

    for (var i = 1; i < data.length; i++) {
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

    ctx.beginPath();
    ctx.moveTo(0, startPrice);
    ctx.lineTo(canvas.width, startPrice);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = data[data.length - 1].price > data[0].price ? 'green' : 'red';

    ctx.beginPath();
    ctx.moveTo(0, startPrice);

    for (var _i2 = 1; _i2 < data.length; _i2++) {
        ctx.lineTo(_i2 * pointDistX, startY - (data[_i2].price - min) * yScalar);
    }

    ctx.stroke();
};

var buildStockPage = function buildStockPage(stock) {
    loadedData.symbol = stock.symbol;
    loadedData.name = stock.name;
    loadedData.data = {};

    for (var i = 0; i < timespans.length; i++) {
        sendRequest(requestMethodEnum.get, requestTypeEnum.getStockData, { symbol: stock.symbol, timespan: timespans[i] });
    }
};

var finishLoadingPage = function finishLoadingPage() {
    document.getElementById("infoSymbol").textContent = loadedData.symbol;
    document.getElementById("infoName").textContent = loadedData.name;

    document.getElementById("infoPrice").textContent = '$' + loadedData.data.DAY[loadedData.data.DAY.length - 1].price;

    displayStockData(loadedData.data.DAY, document.getElementById('DAY'));
};

var drawOverlay = function drawOverlay() {
    var data = loadedData.data[loadedData.currentData];

    if (!data) return;

    var overlay = document.getElementById('overlay');

    var width = overlay.width;
    var xSegmentWidth = width / (data.length - 1);

    var index = Math.round(mousePos.x / xSegmentWidth);
    var dataPt = data[index];

    var ctx = overlay.getContext('2d');

    ctx.strokeStyle = '#999';

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    ctx.beginPath();
    ctx.moveTo(index * xSegmentWidth, 0);
    ctx.lineTo(index * xSegmentWidth, overlay.height);
    ctx.stroke();

    document.getElementById('infoDate').textContent = dataPt.timestamp;
    document.getElementById('infoPrice').textContent = '$' + dataPt.price;

    var priceChange = dataPt.price - data[0].price;
    var percentChange = priceChange / data[0].price;

    document.getElementById("dateLabel").className = document.getElementById("priceLabel").className = document.getElementById("changeLabel").className = priceChange >= 0 ? 'green' : 'red';

    if (priceChange > 0) {}

    document.getElementById('infoChange').textContent = (priceChange < 0 ? '-' : '+') + '$' + Math.abs(priceChange.toFixed(2)) + ' (' + percentChange.toFixed(2) + '%)';
};

//IIFE to init stock page stuff
(function () {
    document.getElementById("visContainer").style.height = document.getElementById('visualization').clientHeight + 'px';

    var timespanSelButtons = document.getElementById('timespanSelect').childNodes;

    for (var i = 0; i < timespanSelButtons.length; i++) {
        timespanSelButtons[i].addEventListener('click', function () {
            if (this.id === loadedData.currentData) return;

            var data = loadedData.data[this.id];

            if (data) displayStockData(data, this);
        });
    }

    var overlay = document.getElementById('overlay');
    overlay.addEventListener('mousemove', function (e) {
        var boundingRect = overlay.getBoundingClientRect();

        mousePos.x = (e.clientX - boundingRect.left) * overlay.width / boundingRect.width;
        mousePos.y = (e.clientY - boundingRect.top) * overlay.height / boundingRect.height;
        mousePos.over = true;
        drawOverlay();
    });
    overlay.addEventListener('mouseleave', function () {
        mousePos.over = false;

        this.getContext('2d').clearRect(0, 0, this.width, this.height);
    });
})();
