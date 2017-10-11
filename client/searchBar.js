let lastWordSearched = '';

const sendSearch = searchValue=>{
    searchValue = searchValue.trim();

    if(lastWordSearched === searchValue) return;

    lastWordSearched = searchValue;

    if(searchValue === ''){
        clearSearchResults();
        return;
    }

    sendRequest('GET',requestTypeEnum.search,{search:searchValue});
};

const clearSearchResults = () => {
    const searchResults = document.getElementById("searchResults");

    while(searchResults.firstChild) searchResults.removeChild(searchResults.firstChild);

    searchResults.style.height = 0;
};

const handleSearchResponse = (responseData)=>{
    clearSearchResults();

    const searchResults = document.getElementById("searchResults");

    let resultsHeight = 0;

    if(responseData.stocks.length === 0){
        const message = document.createElement('span');
        message.className = 'searchSymbol';
        message.textContent = 'No results';

        const resultDiv = document.createElement('div');
        resultDiv.appendChild(message);

        searchResults.appendChild(resultDiv);

        resultsHeight = resultDiv.clientHeight;
    }

    for(let i = 0; i < responseData.stocks.length; i++){
        const stock = responseData.stocks[i];

        const symbolSpan = document.createElement('span');
        symbolSpan.className = 'searchSymbol';
        symbolSpan.textContent = stock.symbol;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'searchName';
        nameSpan.innerHTML = stock.name;

        const result = document.createElement('div');

        result.appendChild(symbolSpan);
        result.appendChild(nameSpan);

        result.addEventListener('click',()=>{
            clearSearchResults();
            buildStockPage(stock);
        });

        searchResults.appendChild(result);

        resultsHeight += result.clientHeight;
    }

    searchResults.style.height = `${resultsHeight}px`;
};

//IIFE to initialize search bar related stuff
(() => {
    const searchBar = document.getElementById('searchBar');

    searchBar.addEventListener('keyup',()=>sendSearch(searchBar.value));
    searchBar.addEventListener('focus',()=>sendSearch(searchBar.value));
    /*searchBar.addEventListener('blur',()=>{
        clearSearchResults();
        lastWordSearched = '';
    });*/
})();