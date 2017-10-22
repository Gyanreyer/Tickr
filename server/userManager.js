const bcrypt = require('bcrypt');

const {getStock} = require('./stockSearch.js');

const users = {};//Didn't have time to figure out databases unfortunately

// Send JSON response, include body if data is passed
const sendJsonResponse = (response, code, data) => {
    response.writeHead(code, { 'Content-Type': 'application/json' });
    if (data) response.write(JSON.stringify(data));
    response.end();
};

const verifyLogin = (response,user,pass,callback)=>{
    bcrypt.compare(pass,users[user] ? users[user].hash:'',(err,res)=>{
        if(err){
            sendJsonResponse(response,500,{
                id:'internalError',
                message:'Something went wrong while verifying login'
            });
        }  
        else if(!res){
            sendJsonResponse(response,401,{
                id:'unauthorized',
                message:'Username or password invalid'
            });
        }
        else{
            callback();
        }
    });
};

const createUser = (request, response, params)=>{
    if(!params.user || !params.pass){
        sendJsonResponse(response, 400,{
            id:'badRequest',
            message:'Valid username and password required'
        });
        return;
    }

    if(users[params.user]){
        //return b/c user already exists
        sendJsonResponse(response, 400, {
            id:'badRequest',
            message:'This username already exists'
        });
        return;
    }

    bcrypt.hash(params.pass, 8, (err,hash)=>{
        if(err){
            sendJsonResponse(response,500,{
                id:'internalError',
                message:'Something went wrong while creating your account'
            });
            return;
        }

        users[params.user] = {
            hash,
            favorites:{},
        };

        sendJsonResponse(response,201,{
            user: params.user,
            pass: params.pass,
        });
    }); 
};

const login = (request, response, params) => {
    if(!params.user || !params.pass || params.user === '' || params.pass === ''){
        sendJsonResponse(response, 400,{
            id:'badRequest',
            message:'Valid username and password required'
        });
        return;
    }

    verifyLogin(response,params.user,params.pass,()=>{
        sendJsonResponse(response,200,{
            user: params.user,
            pass: params.pass,
        });
    });
};

const getFavorites = (request, response, params)=>{
    if(!params.user || !params.pass){
        sendJsonResponse(response, 400,{
            id:'badRequest',
            message:'Valid username and password required'
        });
        return;
    }

    verifyLogin(response,params.user,params.pass,()=>{
        sendJsonResponse(response,200,users[params.user].favorites);
    });
};

const updateFavorite = (request, response, params)=>{
    if(!params.user || !params.pass ||
        !params.symbol || !params.add){
        sendJsonResponse(response, 400,{
            id:'badRequest',
            message:'Valid username, password, symbol, and favorite required'
        });
        return;
    }

    const stock = getStock(params.symbol);

    if(!stock){
        sendJsonResponse(response, 400,{
            id:'badRequest',
            message:'Valid stock symbol required'
        });
        return;
    }

    verifyLogin(response,params.user,params.pass,()=>{
        const returnObject = {
            symbol: stock.symbol,
            favorite: params.add === 'true',
        };

        if(users[params.user].favorites[stock.symbol]){
            if(!returnObject.favorite)
                delete users[params.user].favorites[stock.symbol];
        }
        else if(returnObject.favorite){
            users[params.user].favorites[stock.symbol] = stock.name;
        }

        sendJsonResponse(response,200,returnObject);
    });

};

const checkFavorite = (symbol,user) => {
    return (user && symbol && users[user] &&
        users[user].favorites[symbol]);
};

module.exports = {
    createUser,
    login,
    getFavorites,
    updateFavorite,
    checkFavorite,
    verifyLogin,
};