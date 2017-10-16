//Enum for request method being made to API
const requestMethodEnum = {
    get: 'GET',
    head: 'HEAD',
    post: 'POST'
};

//Enum for type of request being made to API
const requestTypeEnum = {
    search: 0,
    getStockChart: 1
};

//Take server response and send it off to appropriate area to be handled
const handleResponse = (xhr, responseType) => {
    if(responseType === requestTypeEnum.search)
        handleSearchResponse(JSON.parse(xhr.response));
    else if(responseType === requestTypeEnum.getStockChart)
        handleStockDataResponse(JSON.parse(xhr.response));
};

//Takes what method we should use, type of request from enum,
//and an object containing any additional params for request path
const sendRequest = (method,requestType,parameters) => {    
    const xhr = new XMLHttpRequest();

    //If searching through stock database
    if(requestType === requestTypeEnum.search && parameters.search){   
        xhr.open(method,`/search?${parameters.search}`,true);
        xhr.setRequestHeader('Accept','application/json');  
    }
    //If requesting a chart for a specific time period
    else if(requestType === requestTypeEnum.getStockChart && parameters.symbol && parameters.timespan){
        xhr.open(method,`/stockChart?symbol=${parameters.symbol}&timespan=${parameters.timespan}`,true);
        xhr.setRequestHeader('Accept','text/html');
    }
    //If request type doesn't match these then something messed up, just return early
    else return;
    
    //Call handleResponse when response loaded, give it the response and info on how to handle it
    xhr.onload = ()=>handleResponse(xhr,requestType);

    xhr.send();
}