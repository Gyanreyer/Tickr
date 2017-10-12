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
'use strict';

var RED = '#B55';
var GREEN = '#5B5';

var loadedData = {};
var timespans = ['DAY', 'WEEK', 'MONTH', 'MONTH3', 'YEAR', 'YEAR5'];

var mousePos = {
    x: 0,
    y: 0,
    over: false
};

var handleStockDataResponse = function handleStockDataResponse(resp) {
    loadedData.loading = false;

    var data = resp.data;

    if (!data) {
        //Display an error message on screen
    }

    for (var i = 0; i < data.length; i++) {
        data[i].price = parseFloat(data[i].price);
    }

    loadedData[resp.timespan] = data;

    displayStockData(data, document.getElementById(resp.timespan));
};

var displayStockData = function displayStockData(data, selectButton) {
    var endPrice = data[data.length - 1].price;
    var startPrice = data[0].price;

    var positiveChange = (endPrice - startPrice).toFixed(2) >= 0;

    var canvas = document.getElementById('visualization');
    var ctx = canvas.getContext('2d');

    var width = canvas.width;
    var height = canvas.height;

    var min = startPrice;
    var max = startPrice;

    for (var i = 1; i < data.length; i++) {
        var p = data[i].price;

        if (p < min) min = p;
        if (p > max) max = p;
    }

    var baseY = 0.95 * height;
    var yScalar = 0.9 * height / (max - min);
    var pointDistX = width / (data.length - 1);

    var startYPos = baseY - (data[0].price - min) * yScalar;

    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 2;

    //Draw dotted line for open price
    ctx.strokeStyle = '#999';
    ctx.setLineDash([10, 10]);

    ctx.beginPath();
    ctx.moveTo(0, startYPos);
    ctx.lineTo(canvas.width, startYPos);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = positiveChange ? GREEN : RED;

    ctx.beginPath();
    ctx.moveTo(0, startYPos);

    for (var _i = 1; _i < data.length; _i++) {
        ctx.lineTo(_i * pointDistX, baseY - (data[_i].price - min) * yScalar);
    }

    ctx.stroke();

    updateStockInfo(data[data.length - 1], data[0]);
};

var drawOverlay = function drawOverlay() {
    if (loadedData.loading || !loadedData.hasOwnProperty(loadedData.currentTimespan)) return;

    var data = loadedData[loadedData.currentTimespan];

    if (!data) return;

    var overlay = document.getElementById('overlay');

    var width = overlay.width;
    var xSegmentWidth = width / (data.length - 1);

    var index = Math.round(mousePos.x / xSegmentWidth);
    var dataPt = data[index];

    var ctx = overlay.getContext('2d');

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    //Clamp so line is still visible on edges
    var xCoord = Math.min(Math.max(index * xSegmentWidth, 1), width - 1);

    ctx.beginPath();
    ctx.moveTo(xCoord, 0);
    ctx.lineTo(xCoord, overlay.height);
    ctx.stroke();

    updateStockInfo(dataPt, data[0]);
};

var updateStockInfo = function updateStockInfo(dataPt, startPt) {
    document.getElementById('infoDate').textContent = dataPt.timestamp;
    document.getElementById('infoPrice').textContent = '$' + dataPt.price.toFixed(2);

    var priceChange = dataPt.price - startPt.price;
    var percentChange = (100 * priceChange / startPt.price).toFixed(2);

    priceChange = Math.abs(priceChange).toFixed(2);

    var positiveChange = percentChange >= 0;

    var infoChange = document.getElementById('infoChange');
    infoChange.style.color = positiveChange ? GREEN : RED;

    infoChange.textContent = (positiveChange ? '+' : '-') + '$' + priceChange + ' (' + percentChange + '%)';
};

var buildStockPage = function buildStockPage(stock) {
    loadedData = {
        currentTimespan: timespans[0], //Start as DAY
        loading: true
    };

    document.getElementById("infoSymbol").textContent = loadedData.symbol = stock.symbol;
    document.getElementById("infoName").textContent = loadedData.name = stock.name;
    document.getElementById(loadedData.currentTimespan).className = 'selected';

    sendRequest(requestMethodEnum.get, requestTypeEnum.getStockData, {
        symbol: stock.symbol,
        timespan: loadedData.currentTimespan //Get DAY data to display first
    });
};

//IIFE to init stock page stuff
(function () {
    var timespanSelButtons = document.getElementById('timespanSelect').childNodes;

    for (var i = 0; i < timespanSelButtons.length; i++) {
        timespanSelButtons[i].addEventListener('click', function () {
            if (this.className === 'selected' || loadedData.loading) return;

            var selectedButtons = document.querySelectorAll('.selected');

            for (var _i2 = 0; _i2 < selectedButtons.length; _i2++) {
                selectedButtons[_i2].removeAttribute('class');
            }

            this.className = 'selected';
            loadedData.currentTimespan = this.id;

            var data = loadedData[this.id];

            if (data) displayStockData(data, this);else sendRequest(requestMethodEnum.get, requestTypeEnum.getStockData, {
                symbol: loadedData.symbol,
                timespan: this.id //Get DAY data to display first
            });
        });
    }

    var overlay = document.getElementById('overlay');
    overlay.addEventListener('mousemove', function (e) {
        var boundingRect = overlay.getBoundingClientRect();

        mousePos.x = (e.clientX - boundingRect.left) * overlay.width / boundingRect.width;
        mousePos.y = (e.clientY - boundingRect.top) * overlay.height / boundingRect.height;
        drawOverlay();
    });
    overlay.addEventListener('mouseleave', function () {
        var data = loadedData[loadedData.currentTimespan];

        if (!data) return;

        this.getContext('2d').clearRect(0, 0, this.width, this.height);

        updateStockInfo(data[data.length - 1], data[0]);
    });
})();
