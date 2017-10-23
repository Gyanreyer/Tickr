const apiCommunicator = (() => {
  // Generic function to send a get request to API
  const sendRequest = (path, callback, data) => {
    const dataKeys = Object.keys(data);// Get keys for all queries to send

    // Add all queries to end of path
    if (dataKeys.length !== 0) {
      path += `?${dataKeys[0]}=${data[dataKeys[0]]}`;

      for (let i = 1; i < dataKeys.length; i++) {
        path += `&${dataKeys[i]}=${data[dataKeys[i]]}`;
      }
    }

    // Make async xhr request w/ given path
    const xhr = new XMLHttpRequest();

    xhr.open('GET', path, true);

    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-type', 'application/json');

    xhr.onload = () => {
      callback(xhr.status, xhr.response);// When loaded, call provided callback
    };

    xhr.send();
  };

    // Generic function to send a post request to API
  const sendPost = (path, callback, data) => {
    const dataKeys = Object.keys(data);// Get keys for all data to post

    if (dataKeys.length === 0) return;// If no data to post then return

    // Build string of data to send
    let dataString = `${dataKeys[0]}=${data[dataKeys[0]]}`;

    for (let i = 1; i < dataKeys.length; i++) {
      dataString += `&${dataKeys[i]}=${data[dataKeys[i]]}`;
    }

    // Make xhr post
    const xhr = new XMLHttpRequest();

    xhr.open('POST', path, true);

    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    xhr.onload = () => {
      callback(xhr.status, xhr.response);// When loaded, call provided callback
    };

    xhr.send(dataString);
  };

    // Return an object with public methods for search requests and chart requests to API
  return {
    // Send a request to search stock database for search bar
    sendSearchRequest: (search) => {
      // Return early if search string invalid
      if (!search) return;

      // Request stocks matching search string
      sendRequest('/search', searchClient.handleSearchResponse, { search });
    },
    // Send a request to get an svg chart for given stock/timespan
    sendChartRequest: (parameters) => {
      // Return early if params are invalid
      if (!parameters.symbol || !parameters.timespan) return;

      // Callback sets up and display svg visualization from response
      sendRequest('/stockChart', stockClient.handleChartResponse, parameters);
    },
    // post to update whether stock is favorited or not
    updateFavorite: (parameters) => {
      if (!parameters.symbol || !parameters.add ||
                !parameters.user || !parameters.pass) return;

      // Post new favorite status for given symbol
      sendPost('/updateFavorite', stockClient.updateFavoriteStatus, parameters);
    },
    // Create a new user on server
    createUser: (parameters) => {
      if (!parameters.user || !parameters.pass) return;

      // Post new account w/ given username and password
      sendPost('/createUser', loginClient.loginResponse, parameters);
    },
    // Send request to log into user
    sendLogin: (parameters) => {
      if (!parameters.user || !parameters.pass) return;
      // Log in with user and pass to access account
      sendRequest('/login', loginClient.loginResponse, parameters);
    },
    // Get list of favorites for user
    sendFavoritesRequest: (parameters) => {
      if (!parameters.user || !parameters.pass) return;

      sendRequest('/getFavorites', loginClient.displayFavorites, parameters);
    },
  };
})();
