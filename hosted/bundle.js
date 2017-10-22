'use strict';

var apiCommunicator = function () {
    var sendRequest = function sendRequest(path, callback, data) {
        var dataKeys = Object.keys(data);

        if (dataKeys.length !== 0) {
            path += '?' + dataKeys[0] + '=' + data[dataKeys[0]];

            for (var i = 1; i < dataKeys.length; i++) {
                path += '&' + dataKeys[i] + '=' + data[dataKeys[i]];
            }
        }

        var xhr = new XMLHttpRequest();

        xhr.open('GET', path, true);

        xhr.responseType = 'json';

        xhr.onload = function () {
            callback(xhr.status, xhr.response);
        };

        xhr.send();
    };

    var sendPost = function sendPost(path, callback, data) {
        var dataKeys = Object.keys(data);

        if (dataKeys.length === 0) return;

        var dataString = dataKeys[0] + '=' + data[dataKeys[0]];

        for (var i = 1; i < dataKeys.length; i++) {
            dataString += '&' + dataKeys[i] + '=' + data[dataKeys[i]];
        }

        var xhr = new XMLHttpRequest();

        xhr.open('POST', path, true);

        xhr.responseType = 'json';
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        xhr.onload = function () {
            callback(xhr.status, xhr.response);
        };

        xhr.send(dataString);
    };

    //Return an object with public methods for search requests and chart requests to API
    return {
        //Send a request to search stock database for search bar
        sendSearchRequest: function sendSearchRequest(search) {
            //Return early if search string invalid
            if (!search) return;

            //Request stocks matching search string
            sendRequest('/search', searchClient.handleSearchResponse, { search: search });
        },
        //Send a request to get an svg chart for given stock/timespan
        sendChartRequest: function sendChartRequest(parameters) {
            //Return early if params are invalid
            if (!parameters.symbol || !parameters.timespan) return;

            //Callback sets up and display svg visualization from response
            sendRequest('/stockChart', stockClient.handleChartResponse, parameters);
        },
        //post to update whether stock is favorited or not
        updateFavorite: function updateFavorite(parameters) {
            if (!parameters.symbol || !parameters.add || !parameters.user || !parameters.pass) return;

            //Post new favorite status for given symbol
            sendPost('/updateFavorite', stockClient.updateFavoriteStatus, parameters);
        },
        //Create a new user on server
        createUser: function createUser(parameters) {
            if (!parameters.user || !parameters.pass) return;

            //Post new account w/ given username and password
            sendPost('/createUser', loginClient.loginResponse, parameters);
        },
        //Send request to log into user
        sendLogin: function sendLogin(parameters) {
            if (!parameters.user || !parameters.pass) return;
            //Log in with user and pass to access account
            sendRequest('/login', loginClient.loginResponse, parameters);
        },
        //Get list of favorites for user
        sendFavoritesRequest: function sendFavoritesRequest(parameters) {
            if (!parameters.user || !parameters.pass) return;

            sendRequest('/getFavorites', loginClient.displayFavorites, parameters);
        }
    };
}();
'use strict';

var loginClient = function () {

    //Parse cookies to see if user is logged in
    var cookies = {};
    /*const cookieString = document.cookie;
      if (cookieString !== ''){
        const separatedCookies = cookieString.split('; ');
          for(let i = 0; i < separatedCookies.length; i++){
            const cookieKeyVal = separatedCookies[i].split('=');
            cookies[cookieKeyVal[0]] = cookieKeyVal[1];
        }
          //Set text of account button to match username if user is logged in
        if(cookies.user){
            accountButton.textContent = cookies.user;
        }
    }*/

    var accountButton = document.getElementById('accountButton');
    var accountDropdown = document.getElementById('accountDropdown');

    var loginPage = document.getElementById('loginContainer');
    var loginForm = loginPage.querySelector('#loginForm');
    var usernameField = loginForm.querySelector('#usernameField');
    var passwordField = loginForm.querySelector('#passwordField');
    var loginError = loginPage.querySelector('#loginError');

    var submitLoginButton = loginPage.querySelector('#submitLoginButton');
    var submitCreateButton = loginPage.querySelector('#submitCreateButton');
    var cancelLoginButton = loginPage.querySelector('#cancelLoginButton');

    var favoritesPage = document.getElementById('favoritesContainer');
    var favoritesList = favoritesPage.querySelector('#favorites');

    document.getElementById('logOut').addEventListener('click', function () {
        cookies.user = '';
        accountButton.textContent = 'Log in';
        accountDropdown.style.height = 0;
    });

    document.getElementById('getFavorites').addEventListener('click', function () {
        apiCommunicator.sendFavoritesRequest({
            user: cookies.user,
            pass: cookies.pass
        });
    });

    var hideLoginPage = function hideLoginPage() {
        loginPage.style.opacity = 0;
        loginPage.style.pointerEvents = 'none';

        loginError.style.height = 0;

        usernameField.value = passwordField.value = '';
    };

    //Show account page if logged in or login page if not
    accountButton.addEventListener('click', function () {
        if (cookies.user) {
            //Retrieve favorites, remove user cookie if account doesn't exist
            if (accountDropdown.clientHeight > 0) accountDropdown.style.height = 0;else accountDropdown.style.height = '4em';
        } else {
            loginPage.style.opacity = 1;
            loginPage.style.pointerEvents = 'auto';
        }
    });

    cancelLoginButton.addEventListener('click', hideLoginPage);

    submitLoginButton.addEventListener('click', function () {
        loginError.style.height = 0;

        apiCommunicator.sendLogin({
            user: usernameField.value,
            pass: passwordField.value
        });
    });

    submitCreateButton.addEventListener('click', function () {
        loginError.style.height = 0;

        apiCommunicator.createUser({
            user: usernameField.value,
            pass: passwordField.value
        });
    });

    loginPage.addEventListener('click', function (e) {
        if (e.target !== loginPage) return;

        hideLoginPage();
    });

    favoritesPage.addEventListener('click', function (e) {
        if (e.target !== favoritesPage) return;

        favoritesPage.style.opacity = 0;
        favoritesPage.style.pointerEvents = 'none';
    });

    return {
        getCookies: function getCookies() {
            return cookies;
        },
        loginResponse: function loginResponse(code, response) {
            if (response.user) {
                //Store logged in user cookie (this is maaaaaad insecure but I just need something to work)
                //document.cookie = `user=${response.user}`;
                accountButton.textContent = cookies.user = response.user;
                cookies.pass = response.pass;
                hideLoginPage();
            } else {
                loginError.textContent = response.message;
                loginError.style.height = '1em';
            }
        },
        displayFavorites: function displayFavorites(code, response) {
            if (code !== 200) return;

            while (favoritesList.firstChild) {
                favoritesList.removeChild(favoritesList.firstChild);
            }var symbols = Object.keys(response);

            if (symbols.length === 0) {
                //Create span for message
                var message = document.createElement('span');
                message.className = 'symbol';
                message.textContent = 'No results';

                //Create div to add to results
                var favorite = document.createElement('div');
                favorite.appendChild(message);

                favoritesList.appendChild(favorite);
            }

            var _loop = function _loop(symbol) {
                //Create span for symbol
                var symbolSpan = document.createElement('span');
                symbolSpan.className = 'symbol';
                symbolSpan.textContent = symbol;

                //Create span for name
                var nameSpan = document.createElement('span');
                nameSpan.className = 'name';
                nameSpan.innerHTML = response[symbol];

                var favorite = document.createElement('div');
                favorite.appendChild(symbolSpan);
                favorite.appendChild(nameSpan);

                //Add click event that will load/display data for this div's stock
                favorite.addEventListener('click', function () {
                    stockClient.buildStockPage({
                        symbol: symbol,
                        name: response[symbol]
                    });
                });

                favoritesList.appendChild(favorite);
            };

            for (var symbol in response) {
                _loop(symbol);
            }

            favoritesPage.style.opacity = 1;
            favoritesPage.style.pointerEvents = 'auto';
        },
        updateFavorite: function updateFavorite(symbol, add) {
            apiCommunicator.updateFavorite({
                symbol: symbol,
                add: add.toString(),
                user: cookies.user,
                pass: cookies.pass
            });
        }
    };
}();
'use strict';

var searchClient = function () {
    var lastWordSearched = '';

    var searchResults = document.getElementById('searchResults');
    var searchBar = document.getElementById('searchBar');

    searchBar.addEventListener('keyup', function () {
        return sendSearch(searchBar.value);
    }); //Send search when user stops typing
    searchBar.addEventListener('focus', function () {
        return sendSearch(searchBar.value);
    }); //Send search when focus switches to search bar
    searchBar.addEventListener('blur', function (e) {
        //Hide search results when user clicks away from search area
        //If clicked away from search bar to something else within search element, don't clear results
        if (e.relatedTarget && e.relatedTarget.id === 'search') return;

        //Clear search results and reset last word searched
        clearSearchResults();
        lastWordSearched = '';
    });

    //Send search request to API to get matching companies in database
    var sendSearch = function sendSearch(searchValue) {
        searchValue = searchValue.trim(); //Trim white space from ends of string

        if (lastWordSearched === searchValue) return; //If same as last word searched, don't send new request

        lastWordSearched = searchValue; //Store search string as last word searched

        //If search string is empty, clear search results
        if (searchValue === '') {
            clearSearchResults();
        } else {
            //Otherwise, send request with search string
            apiCommunicator.sendSearchRequest(searchValue);
        }
    };

    //Remove all children of search results element and set its height to 0
    var clearSearchResults = function clearSearchResults() {
        while (searchResults.firstChild) {
            searchResults.removeChild(searchResults.firstChild);
        }searchResults.style.height = 0;
    };

    //Return object with public method that displays received search results
    return {
        handleSearchResponse: function handleSearchResponse(code, responseData) {
            clearSearchResults();

            var resultsHeight = 0; //Height of search results element

            //If no results, display message saying so
            if (code !== 200 || responseData.stocks.length === 0) {
                //Create span for message
                var message = document.createElement('span');
                message.className = 'symbol';
                message.textContent = 'No results';

                //Create div to add to results
                var result = document.createElement('div');
                result.appendChild(message);

                searchResults.appendChild(result);

                resultsHeight = result.clientHeight; //Set height of results to fit message
            } else {
                var _loop = function _loop(i) {
                    var stock = responseData.stocks[i]; //Get stock data to add

                    //Create span for symbol
                    var symbolSpan = document.createElement('span');
                    symbolSpan.className = 'symbol';
                    symbolSpan.textContent = stock.symbol;

                    //Create span for name
                    var nameSpan = document.createElement('span');
                    nameSpan.className = 'name';
                    nameSpan.innerHTML = stock.name;

                    //Create div to add to results
                    var result = document.createElement('div');
                    result.appendChild(symbolSpan);
                    result.appendChild(nameSpan);

                    //Add click event that will load/display data for this div's stock
                    result.addEventListener('click', function () {
                        lastWordSearched = '';
                        clearSearchResults();
                        stockClient.buildStockPage(stock);
                    });

                    //Append result to search results
                    searchResults.appendChild(result);

                    //Add height of div to total results height
                    resultsHeight += result.clientHeight;
                };

                //Loop through results and add them to result element
                for (var i = 0; i < responseData.stocks.length; i++) {
                    _loop(i);
                }
            }

            searchResults.style.height = resultsHeight + 'px'; //Set height of results element
        }

    };
}();
'use strict';

//Make a module for handling displaying stock data in client
var stockClient = function () {
    //Enum for state of page
    var STATE = {
        START: 0,
        LOADING: 1,
        LOADED: 2,
        FAILED: 3
    };

    var state = STATE.START; //Current state page is in
    var loadedCharts = {}; //Object holding all loaded charts
    var currentTimespan = null; //Current timespan being displayed

    //Elements that we frequently use
    var visualization = document.getElementById('visualization');
    var errorMessage = document.getElementById('errorMessage');
    var priceContainer = document.getElementById('priceContainer');
    var stockInfoContainer = document.getElementById('stockInfo');
    var favoriteButton = document.getElementById('favoriteButton');

    //Hook up timespan buttons so they load data for their timespan when clicked
    var timespanSelButtons = document.querySelectorAll('#timespanSelect span');

    var _loop = function _loop(i) {
        timespanSelButtons[i].addEventListener('click', function () {
            if (state === STATE.LOADING || state === STATE.START) return;

            loadData(timespanSelButtons[i].id); //load data for this button's timespan (id)
        });
    };

    for (var i = 0; i < timespanSelButtons.length; i++) {
        _loop(i);
    }

    //When refresh button clicked, refresh current timespan data
    document.getElementById('refresh').addEventListener('click', function () {
        //Don't refresh if currently loading or at start where nothing is selected
        if (state === STATE.LOADING || state === STATE.START) return;

        var ts = currentTimespan;
        currentTimespan = null;
        loadedCharts[ts] = null;
        loadData(ts);
    });

    favoriteButton.addEventListener('click', function () {
        if (state !== STATE.LOADED) return;

        loginClient.updateFavorite(loadedCharts.stock.symbol, !loadedCharts.stock.favorite);
    });

    //Load data for given timespan
    var loadData = function loadData(timespan) {
        //If in process of loading or already showing this timespan, don't do anything
        if (state === STATE.LOADING || currentTimespan === timespan) return;

        errorMessage.style.opacity = "0"; //Hide error message

        //Get all buttons currently marked selected and remove their selection
        var prevSelected = document.querySelector('.selected');

        if (prevSelected) prevSelected.removeAttribute('class');

        //Mark current timespan button as selected
        document.getElementById(timespan).className = 'selected';

        currentTimespan = timespan; //Update current timespan

        var data = loadedCharts[timespan]; //Get stored chart data if it exists

        if (data) displayStockData(data); //If data exists, display it
        else {
                //If data doesn't exist, load it
                state = STATE.LOADING;

                initLoadingAnim(); //Start loading animation

                var cookies = loginClient.getCookies();

                var requestParams = {
                    symbol: loadedCharts.stock.symbol,
                    timespan: timespan,
                    contentsOnly: true
                };

                if (cookies.user && cookies.pass) {
                    requestParams.user = cookies.user;
                    requestParams.pass = cookies.pass;
                }

                //Send request to API
                apiCommunicator.sendChartRequest(requestParams);
            }
    };

    //Display stored data for current timespan
    var displayStockData = function displayStockData() {
        var visHtml = loadedCharts[currentTimespan]; //Get stored svg contents for this timespan

        if (!visHtml) return; //Return early if this timespan doesn't have data (it should but just in case)

        visualization.innerHTML = visHtml; //Display data in visualization svg element
        //Show price info for most recent data pt
        updatePriceInfo(visualization.querySelector('.end'));

        //Set up all hover zones in visualization to display data when hovered over
        var hoverZones = visualization.querySelectorAll('.hoverZone');
        var hoverLine = visualization.querySelector('#hoverLine');

        var _loop2 = function _loop2(i) {
            //When mouse enters a zone, show its price info
            hoverZones[i].addEventListener('mouseenter', function () {
                updatePriceInfo(hoverZones[i]);
            });
            //When mouse moves over a zone, move the hover line to mouse's x pos
            hoverZones[i].addEventListener('mousemove', function (e) {
                //X pos on vis to move line to
                var xPos = 100 * (e.clientX / visualization.getBoundingClientRect().width);
                //Update visibility and position of line
                hoverLine.setAttribute('visibility', 'visible');
                hoverLine.setAttribute('x1', xPos);
                hoverLine.setAttribute('x2', xPos);
            });
        };

        for (var i = 0; i < hoverZones.length; i++) {
            _loop2(i);
        };

        //Hide the line when mouse leaves
        visualization.onmouseleave = function () {
            //Return early if data isn't loaded
            if (state !== STATE.LOADED) return;
            //Set hover line's visibility to hidden
            hoverLine.setAttribute('visibility', 'hidden');
            //Show most recent price for price info
            updatePriceInfo(visualization.querySelector('.end'));
        };
    };

    //Update price info to show info for given point on chart
    var updatePriceInfo = function updatePriceInfo(hoverZone) {
        //Use currency formatter so money will always be formatted correctly when output as string
        var priceFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        });

        //Get price of first hover zone
        var startPrice = parseFloat(document.querySelector('.hoverZone').getAttribute('data-stockprice'));

        //Get price associated w/ hover element
        var hoverPrice = parseFloat(hoverZone.getAttribute('data-stockprice'));

        //Calculate change from start price to hover price
        var change = hoverPrice - startPrice;
        var percentChange = 100 * change / startPrice;

        //Display formatted hover price
        document.querySelector('#infoPrice').textContent = priceFormatter.format(hoverPrice);

        var infoChange = priceContainer.querySelector('#infoChange');
        var infoDate = priceContainer.querySelector('#infoDate');

        //Make color of change and date green/red depending on if +/- change
        infoChange.style.color = infoDate.style.color = change >= 0 ? '#5B5' : '#B55';
        //Format and display change data
        infoChange.textContent = '' + (change >= 0 ? '+' : '-') + priceFormatter.format(Math.abs(change)) + ' (' + percentChange.toFixed(2) + '%)';

        //Display date of hover element
        infoDate.textContent = hoverZone.getAttribute('data-timestamp');
    };

    //Initialize loading animation
    var initLoadingAnim = function initLoadingAnim() {
        //Fade out stock info and disable clicking on it
        stockInfoContainer.style.opacity = 0.25;
        stockInfoContainer.style.pointerEvents = "none";

        var visBoundRect = visualization.getBoundingClientRect();
        var midY = 100 * (document.body.clientHeight / 2 - visBoundRect.y) / visBoundRect.height;

        var xScale = 1000 / visBoundRect.width;

        //Draw a path on visualization that we will animate while loading
        visualization.innerHTML = '<path id="loadingPath" d="m ' + (50 - 2.5 * xScale) + ',' + (midY + 4.5) + ' ' + 2 * xScale + ',-6 ' + xScale + ',3 ' + 2 * xScale + ',-6" fill="none" stroke="#5B5"\n                vector-effect="non-scaling-stroke" stroke-width="5" stroke-dasharray="200"/>';

        loadingAnim(document.getElementById('loadingPath'), 200);
    };

    //Loop to update loading animation until data is loaded
    var loadingAnim = function loadingAnim(loadingElement, offset) {
        //If we're no longer loading, transition out
        if (state !== STATE.LOADING) {
            stockInfoContainer.style.opacity = 1;
            stockInfoContainer.style.pointerEvents = "auto";
            return;
        }

        //Loop offset from 400->0
        if (offset <= 0) offset += 400;

        //Set stroke-dashoffset attribute to new offset
        //This is a cheap way of making it look like the line is being drawn
        loadingElement.setAttribute('stroke-dashoffset', offset);

        //Request next frame of anim with new modified offset
        requestAnimationFrame(function () {
            loadingAnim(loadingElement, offset - 2);
        });
    };

    return {
        //Initialize page for new stock to display
        buildStockPage: function buildStockPage(stock) {
            if (state === STATE.LOADING) return; //Return early if currently loading something

            loadedCharts = {}; //Reset loaded charts
            loadedCharts.stock = stock; //Store stock symbol/name
            currentTimespan = null;

            //Update name info
            document.getElementById("infoSymbol").textContent = stock.symbol;
            document.getElementById("infoName").textContent = stock.name;

            //Hide price container until data is loaded
            priceContainer.style.opacity = 0;

            loadData('DAY'); //Load intraday data
        },
        //Handle response from server to display data or error message
        handleChartResponse: function handleChartResponse(code, resp) {
            if (loadedCharts.stock.symbol !== resp.stock.symbol) return;

            //If response code is an error, display appropriate message
            if (code !== 200) {
                state = STATE.FAILED; //Set state to reflect error occurred

                //Clear visualization
                while (visualization.firstChild) {
                    visualization.removeChild(visualization.firstChild);
                }

                //Alphavantage is a dumpster fire of an API but in theory 404 errors indicate that
                //desired data doesn't exist/isn't available
                errorMessage.querySelector('p').textContent = resp.code === 404 ? 'This data is unavailable.' : 'We were unable to complete your request, please try again later.';

                errorMessage.style.opacity = "1"; //Display error message element
            } else {
                state = STATE.LOADED; //Set state to reflect data was loaded

                currentTimespan = resp.timespan; //Mark the timespan we are currently displaying
                loadedCharts[resp.timespan] = resp.html; //Store received data in loadedCharts            

                displayStockData(); //Display the data received

                priceContainer.style.opacity = 1; //Fade in price container

                if (resp.stock.favorite) {
                    favoriteButton.className = 'selected';
                }
            }
        },
        updateFavoriteStatus: function updateFavoriteStatus(code, resp) {
            if (code !== 200 || resp.symbol !== loadedCharts.stock.symbol) return;

            loadedCharts.stock.favorite = resp.favorite;

            if (loadedCharts.stock.favorite) {
                favoriteButton.className = 'selected';
            } else {
                favoriteButton.removeAttribute('class');
            }
        }
    };
}();
