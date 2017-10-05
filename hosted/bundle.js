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
    if (responseType === requestTypeEnum.search) handleSearchResponse(JSON.parse(xhr.response));else if (responseType === requestTypeEnum.getStockData) handleStockDataResponse(JSON.parse(xhr.response));else if (responseType === requestTypeEnum.getStockPage) displayStockPage(xhr.response);
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

    for (var i = 0; i < responseData.stocks.length; i++) {
        var stock = responseData.stocks[i];

        var symbolSpan = document.createElement('span');
        symbolSpan.className = 'searchSymbol';
        symbolSpan.textContent = stock.symbol;

        var nameSpan = document.createElement('span');
        nameSpan.className = 'searchName';
        nameSpan.innerHTML = stock.name;

        var _resultDiv = document.createElement('div');

        _resultDiv.appendChild(symbolSpan);
        _resultDiv.appendChild(nameSpan);

        _resultDiv.addEventListener('click', function () {
            clearSearchResults();
            //sendRequest(requestMethodEnum.get,requestTypeEnum.getStockPage,{symbol:stock.symbol});
        });

        searchResults.appendChild(_resultDiv);

        resultsHeight += _resultDiv.clientHeight;
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
    searchBar.addEventListener('blur', function () {
        clearSearchResults();
        lastWordSearched = '';
    });
})();
"use strict";

var handleStockDataResponse = function handleStockDataResponse() {};

var displayStockPage = function displayStockPage() {};
