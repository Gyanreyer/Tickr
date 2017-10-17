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
    getStockChart: 1
};

//Take server response and send it off to appropriate area to be handled
var handleResponse = function handleResponse(xhr, responseType) {
    if (responseType === requestTypeEnum.search) handleSearchResponse(JSON.parse(xhr.response));else if (responseType === requestTypeEnum.getStockChart) handleStockDataResponse(JSON.parse(xhr.response));
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
    //If requesting a chart for a specific time period
    else if (requestType === requestTypeEnum.getStockChart && parameters.symbol && parameters.timespan) {
            xhr.open(method, '/stockChart?symbol=' + parameters.symbol + '&timespan=' + parameters.timespan, true);
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
            lastWordSearched = '';
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
    searchBar.addEventListener('blur', function (e) {
        if (e.relatedTarget && e.relatedTarget.id === 'search') return;

        clearSearchResults();
        lastWordSearched = '';
    });
})();
'use strict';

var RED = '#B55';
var GREEN = '#5B5';

var loadedCharts = {};
var timespans = ['DAY', 'WEEK', 'MONTH', 'MONTH3', 'YEAR', 'YEAR5'];

var handleStockDataResponse = function handleStockDataResponse(resp) {
    loadedCharts.loading = false;

    if (resp.code !== 200) {
        //Display the error message on screen
        console.log(resp);
        var vis = document.getElementById('visualization');

        while (vis.firstChild) {
            vis.removeChild(vis.firstChild);
        }

        return;
    }

    loadedCharts[resp.timespan] = resp.html;

    displayStockData(resp.html);

    document.getElementById('priceContainer').style.opacity = 1;
};

var displayStockData = function displayStockData(svgElement) {
    var vis = document.getElementById('visualization');
    vis.innerHTML = svgElement;
    showHoverInfo(vis.querySelector('.end'));

    vis.addEventListener('mousemove', function (e) {
        if (loadedCharts.loading || !loadedCharts[loadedCharts.currentTimespan]) return;

        showHoverLine(100 * e.clientX / vis.getBoundingClientRect().width);
    });
    vis.addEventListener('mouseleave', function () {
        if (loadedCharts.loading || !loadedCharts[loadedCharts.currentTimespan]) return;

        document.getElementById('hoverLine').setAttribute('visibility', 'hidden');
        showHoverInfo(vis.querySelector('.end'));
    });

    var hoverZones = vis.querySelectorAll('.hoverZone');

    var _loop = function _loop(i) {
        hoverZones[i].addEventListener('mousemove', function () {
            showHoverInfo(hoverZones[i]);
        });
    };

    for (var i = 0; i < hoverZones.length; i++) {
        _loop(i);
    }
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
    loadedCharts = {};

    document.getElementById("infoSymbol").textContent = loadedCharts.symbol = stock.symbol;
    document.getElementById("infoName").textContent = stock.name;

    document.getElementById('priceContainer').style.opacity = 0;

    loadData('DAY'); //Get DAY data to display first
};

var loadData = function loadData(timespan) {

    if (timespan === loadedCharts.currentTimespan || loadedCharts.loading) return;

    var selectedButtons = document.querySelectorAll('.selected');

    for (var i = 0; i < selectedButtons.length; i++) {
        selectedButtons[i].removeAttribute('class');
    }

    document.getElementById(timespan).className = 'selected';

    loadedCharts.currentTimespan = timespan;

    var data = loadedCharts[timespan];

    if (data) displayStockData(data);else {
        loadedCharts.loading = true;

        initLoadingAnim();

        sendRequest(requestMethodEnum.get, requestTypeEnum.getStockChart, {
            symbol: loadedCharts.symbol,
            timespan: timespan
        });
    }
};

var showHoverLine = function showHoverLine(xPos) {
    if (loadedCharts.loading) return;

    var hoverLine = document.getElementById('hoverLine');
    hoverLine.setAttribute('visibility', 'visible');
    hoverLine.setAttribute('x1', xPos);
    hoverLine.setAttribute('x2', xPos);
};

var showHoverInfo = function showHoverInfo(hoverElement) {
    if (loadedCharts.loading) return;

    //Get price of first hover zone
    var startPrice = parseFloat(document.querySelector('.hoverZone').getAttribute('data-stockprice'));

    var priceString = hoverElement.getAttribute('data-stockprice');

    var priceFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    });

    var change = parseFloat(priceString) - startPrice;
    var percentChange = 100 * change / startPrice;

    var positiveChange = change >= 0;

    var priceContainer = document.getElementById('priceContainer');

    priceContainer.querySelector('#infoPrice').textContent = '' + priceFormatter.format(priceString);

    var infoChange = priceContainer.querySelector('#infoChange');
    var infoDate = priceContainer.querySelector('#infoDate');

    infoChange.style.color = infoDate.style.color = positiveChange ? '#5B5' : '#B55';
    infoChange.textContent = '' + (positiveChange ? '+' : '-') + priceFormatter.format(Math.abs(change)) + ' (' + percentChange.toFixed(2) + '%)';

    infoDate.textContent = hoverElement.getAttribute('data-timestamp');
};

var initLoadingAnim = function initLoadingAnim() {
    document.getElementById('stockInfo').style.opacity = 0.25;

    var vis = document.getElementById('visualization');

    var visBoundRect = vis.getBoundingClientRect();
    var midY = 100 * (document.body.clientHeight / 2 - visBoundRect.y) / visBoundRect.height;

    vis.innerHTML = '<path id="loadingPath" d="m 47,' + midY + ' 2,-5 1,2.5 3,-7.5" fill="none" stroke="#5B5"\n            vector-effect="non-scaling-stroke" stroke-width="5" stroke-dasharray="100"/>';

    loadingAnim(document.getElementById('loadingPath'), 0);
};

var loadingAnim = function loadingAnim(loadingElement, offset) {
    if (!loadedCharts.loading) {
        document.getElementById('stockInfo').style.opacity = 1;
        return;
    }

    loadingElement.setAttribute('stroke-dashoffset', offset);

    requestAnimationFrame(function () {
        loadingAnim(loadingElement, offset - 1.5);
    });
};

//IIFE to init stock page stuff
(function () {
    var timespanSelButtons = document.getElementById('timespanSelect').childNodes;

    var _loop2 = function _loop2(i) {
        timespanSelButtons[i].addEventListener('click', function () {
            loadData(timespanSelButtons[i].id);
        });
    };

    for (var i = 0; i < timespanSelButtons.length; i++) {
        _loop2(i);
    }
})();
