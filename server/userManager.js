const bcrypt = require('bcrypt');// Handy package for created password hashes
// My whole login system is completely insecure but I'll have you know I hashed the passwords!

const { getStock } = require('./stockSearch.js');

const users = {};// Didn't have time to figure out databases unfortunately

// Send JSON response, include body if data is passed
const sendJsonResponse = (response, code, data) => {
  response.writeHead(code, { 'Content-Type': 'application/json' });
  if (data) response.write(JSON.stringify(data));
  response.end();
};

// Verify given login credentials and if successful, run given callback method
const verifyLogin = (response, user, pass, callback, meta) => {
  bcrypt.compare(pass, users[user] ? users[user].hash : '', (err, res) => {
    if (err) {
      sendJsonResponse(response, 500, meta ? null : {
        id: 'internalError',
        message: 'Something went wrong while verifying login',
      });
    } else if (!res) {
      sendJsonResponse(response, 401, meta ? null : {
        id: 'unauthorized',
        message: 'Username or password invalid',
      });
    } else {
      callback();// Call callback if login successful
    }
  });
};

// Create a new user from given username and password
const createUser = (request, response, params) => {
  // If username or pass invalid, send badRequest
  if (!params.user || !params.pass) {
    sendJsonResponse(response, 400, {
      id: 'badRequest',
      message: 'Valid username and password required',
    });
    return;
  }

  // If username already exists, send badRequest
  if (users[params.user]) {
    sendJsonResponse(response, 400, {
      id: 'badRequest',
      message: 'This username already exists',
    });
    return;
  }

  // Hash the password and store hash in new user object
  bcrypt.hash(params.pass, 8, (err, hash) => {
    if (err) {
      sendJsonResponse(response, 500, {
        id: 'internalError',
        message: 'Something went wrong while creating your account',
      });
      return;
    }

    // Each user has hashed pass and object that holds all favorited stocks
    users[params.user] = {
      hash,
      favorites: {},
    };

    // Send response with user and pass to store in cookies
    sendJsonResponse(response, 201, {
      user: params.user,
      pass: params.pass,
    });
  });
};

// Attempt to log in with given username and password
const login = (request, response, params, meta) => {
  if (!params.user || !params.pass) {
    sendJsonResponse(response, 400, meta ? null : {
      id: 'badRequest',
      message: 'Valid username and password required',
    });
    return;
  }

  // Verify login credentials and send response with them if success
  verifyLogin(response, params.user, params.pass, () => {
    sendJsonResponse(response, meta ? 204 : 200, meta ? null : {
      user: params.user,
      pass: params.pass,
    });
  });
};

// Get a given user's list of favorited stocks
const getFavorites = (request, response, params, meta) => {
  if (!params.user || !params.pass) {
    sendJsonResponse(response, 400, meta ? null : {
      id: 'badRequest',
      message: 'Valid username and password required',
    });
    return;
  }

  // Verify login and send user's favorites if success
  verifyLogin(response, params.user, params.pass, () => {
    sendJsonResponse(response, meta ? 204 : 200, meta ? null : users[params.user].favorites);
  });
};

// Add/remove a stock from user's favorites
const updateFavorite = (request, response, params) => {
  if (!params.user || !params.pass ||
        !params.symbol || !params.add) {
    sendJsonResponse(response, 400, {
      id: 'badRequest',
      message: 'Valid username, password, symbol, and favorite status required',
    });
    return;
  }

  const stock = getStock(params.symbol);// Verify that symbol exists

  if (!stock) {
    sendJsonResponse(response, 400, {
      id: 'badRequest',
      message: 'Valid stock symbol required',
    });
    return;
  }

  // Verify login credentials and update favorite list if success
  verifyLogin(response, params.user, params.pass, () => {
    // Return object w/ symbol and whether stock is favorited
    const returnObject = {
      symbol: stock.symbol,
      favorite: params.add === 'true',
    };

    // If symbol is in favorites and favorite is false, remove it
    if (users[params.user].favorites[stock.symbol]) {
      if (!returnObject.favorite) { delete users[params.user].favorites[stock.symbol]; }
    } else if (returnObject.favorite) { // If favorite is true and symbol not in favorites, add it
      users[params.user].favorites[stock.symbol] = stock.name;
    }

    sendJsonResponse(response, 200, returnObject);
  });
};

// Quickly check if a stock is in user's favorites
const checkFavorite = (symbol, user) => (!!((user && symbol && users[user] &&
        users[user].favorites[symbol])));

module.exports = {
  createUser,
  login,
  getFavorites,
  updateFavorite,
  checkFavorite,
  verifyLogin,
};
