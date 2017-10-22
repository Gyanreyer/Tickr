const searchClient = (()=>{
    let lastWordSearched = '';
    
    const searchResults = document.getElementById('searchResults');
    const searchBar = document.getElementById('searchBar');

    searchBar.addEventListener('keyup',()=>sendSearch(searchBar.value));//Send search when user stops typing
    searchBar.addEventListener('focus',()=>sendSearch(searchBar.value));//Send search when focus switches to search bar
    searchBar.addEventListener('blur',(e)=>{//Hide search results when user clicks away from search area
        //If clicked away from search bar to something else within search element, don't clear results
        if(e.relatedTarget && e.relatedTarget.id === 'search') return;

        //Clear search results and reset last word searched
        clearSearchResults();
        lastWordSearched = '';
    });

    //Send search request to API to get matching companies in database
    const sendSearch = (searchValue)=>{
        searchValue = searchValue.trim();//Trim white space from ends of string
    
        if(lastWordSearched === searchValue) return;//If same as last word searched, don't send new request
    
        lastWordSearched = searchValue;//Store search string as last word searched
    
        //If search string is empty, clear search results
        if(searchValue === ''){
            clearSearchResults();
        }else{//Otherwise, send request with search string
            apiCommunicator.sendSearchRequest(searchValue);
        }
    };

    //Remove all children of search results element and set its height to 0
    const clearSearchResults = () => {    
        while(searchResults.firstChild) searchResults.removeChild(searchResults.firstChild);
    
        searchResults.style.height = 0;
    };

    //Return object with public method that displays received search results
    return {
        handleSearchResponse: (code,responseData)=>{            
            clearSearchResults();
        
            let resultsHeight = 0;//Height of search results element
        
            //If no results, display message saying so
            if(code !== 200 || responseData.stocks.length === 0){
                //Create span for message
                const message = document.createElement('span');
                message.className = 'symbol';
                message.textContent = 'No results';
        
                //Create div to add to results
                const result = document.createElement('div');
                result.appendChild(message);
        
                searchResults.appendChild(result);
        
                resultsHeight = result.clientHeight;//Set height of results to fit message
            }
            else{
                //Loop through results and add them to result element
                for(let i = 0; i < responseData.stocks.length; i++){
                    const stock = responseData.stocks[i];//Get stock data to add
            
                    //Create span for symbol
                    const symbolSpan = document.createElement('span');
                    symbolSpan.className = 'symbol';
                    symbolSpan.textContent = stock.symbol;
            
                    //Create span for name
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'name';
                    nameSpan.innerHTML = stock.name;
            
                    //Create div to add to results
                    const result = document.createElement('div');
                    result.appendChild(symbolSpan);
                    result.appendChild(nameSpan);
            
                    //Add click event that will load/display data for this div's stock
                    result.addEventListener('click',()=>{
                        lastWordSearched = '';
                        clearSearchResults();
                        stockClient.buildStockPage(stock);
                    });
            
                    //Append result to search results
                    searchResults.appendChild(result);
            
                    //Add height of div to total results height
                    resultsHeight += result.clientHeight;
                }
            }
        
            searchResults.style.height = `${resultsHeight}px`;//Set height of results element
        }

    };
})();