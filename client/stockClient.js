//Make a module for handling displaying stock data in client
const stockClient = (()=>{
    //Enum for state of page
    const STATE = {
        START: 0,
        LOADING: 1,
        LOADED: 2,
        FAILED: 3,
    };

    let state = STATE.START;//Current state page is in
    let loadedCharts = {};//Object holding all loaded charts
    let currentTimespan = null;//Current timespan being displayed

    //Elements that we frequently use
    const visualization = document.getElementById('visualization');
    const errorMessage = document.getElementById('errorMessage');
    const priceContainer = document.getElementById('priceContainer');
    const stockInfoContainer = document.getElementById('stockInfo');
    const favoriteButton = document.getElementById('favoriteButton');

    //Hook up timespan buttons so they load data for their timespan when clicked
    const timespanSelButtons = document.querySelectorAll('#timespanSelect span');
    
    for(let i = 0; i < timespanSelButtons.length; i++){
        timespanSelButtons[i].addEventListener('click',()=>{
            if(state === STATE.LOADING || state === STATE.START) return;
            
            loadData(timespanSelButtons[i].id);//load data for this button's timespan (id)
        });
    }
    
    //When refresh button clicked, refresh current timespan data
    document.getElementById('refresh').addEventListener('click',()=>{
        //Don't refresh if currently loading or at start where nothing is selected
        if(state === STATE.LOADING || state === STATE.START) return;
    
        const ts = currentTimespan;
        currentTimespan = null;
        loadedCharts[ts] = null;
        loadData(ts);
    });

    favoriteButton.addEventListener('click',()=>{
        if(state !== STATE.LOADED) return;

        loginClient.updateFavorite(loadedCharts.stock.symbol,!loadedCharts.stock.favorite);
    });

    //Load data for given timespan
    const loadData = (timespan) =>{
        //If in process of loading or already showing this timespan, don't do anything
        if(state === STATE.LOADING || currentTimespan === timespan) return;

        errorMessage.style.opacity = "0";//Hide error message
    
        //Get all buttons currently marked selected and remove their selection
        const prevSelected = document.querySelector('.selected');
        
        if(prevSelected) prevSelected.removeAttribute('class');
    
        //Mark current timespan button as selected
        document.getElementById(timespan).className = 'selected';
    
        currentTimespan = timespan;//Update current timespan
        
        const data = loadedCharts[timespan];//Get stored chart data if it exists
    
        if(data)
            displayStockData(data);//If data exists, display it
        else{
            //If data doesn't exist, load it
            state = STATE.LOADING;
    
            initLoadingAnim();//Start loading animation
    
            const cookies = loginClient.getCookies();

            const requestParams = {
                symbol: loadedCharts.stock.symbol,
                timespan,
                contentsOnly: true
            }

            if(cookies.user && cookies.pass){
                requestParams.user = cookies.user;
                requestParams.pass = cookies.pass;
            }

            //Send request to API
            apiCommunicator.sendChartRequest(requestParams);
        }
    };

    //Display stored data for current timespan
    const displayStockData = () =>{
        const visHtml = loadedCharts[currentTimespan];//Get stored svg contents for this timespan

        if(!visHtml) return;//Return early if this timespan doesn't have data (it should but just in case)

        visualization.innerHTML = visHtml;//Display data in visualization svg element
        //Show price info for most recent data pt
        updatePriceInfo(visualization.querySelector('.end'));
    
        //Set up all hover zones in visualization to display data when hovered over
        const hoverZones = visualization.querySelectorAll('.hoverZone');
        const hoverLine = visualization.querySelector('#hoverLine');
        for(let i = 0; i < hoverZones.length; i++){
            //When mouse enters a zone, show its price info
            hoverZones[i].addEventListener('mouseenter',()=>{
                updatePriceInfo(hoverZones[i]);
            });
            //When mouse moves over a zone, move the hover line to mouse's x pos
            hoverZones[i].addEventListener('mousemove',(e)=>{
                //X pos on vis to move line to
                const xPos = 100*(e.clientX/visualization.getBoundingClientRect().width);
                //Update visibility and position of line
                hoverLine.setAttribute('visibility','visible');
                hoverLine.setAttribute('x1',xPos);
                hoverLine.setAttribute('x2',xPos);
            });
        };
        
        //Hide the line when mouse leaves
        visualization.onmouseleave = ()=>{
            //Return early if data isn't loaded
            if(state !== STATE.LOADED) return;
            //Set hover line's visibility to hidden
            hoverLine.setAttribute('visibility','hidden');
            //Show most recent price for price info
            updatePriceInfo(visualization.querySelector('.end'));
        };
    };

    //Update price info to show info for given point on chart
    const updatePriceInfo = (hoverZone)=>{
        //Use currency formatter so money will always be formatted correctly when output as string
        const priceFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        });
        
        //Get price of first hover zone
        const startPrice =
            parseFloat(document.querySelector('.hoverZone')
                .getAttribute('data-stockprice'));
    
        //Get price associated w/ hover element
        const hoverPrice = parseFloat(hoverZone.getAttribute('data-stockprice'));
    
        //Calculate change from start price to hover price
        const change =  hoverPrice - startPrice;
        const percentChange = 100 * change / startPrice;
    
        //Display formatted hover price
        document.querySelector('#infoPrice').textContent = priceFormatter.format(hoverPrice);
    
        const infoChange = priceContainer.querySelector('#infoChange');
        const infoDate = priceContainer.querySelector('#infoDate');

        //Make color of change and date green/red depending on if +/- change
        infoChange.style.color = infoDate.style.color = change >= 0 ? '#5B5' : '#B55';
        //Format and display change data
        infoChange.textContent =
            `${change >= 0 ? '+':'-'}${priceFormatter.format(Math.abs(change))} (${percentChange.toFixed(2)}%)`;
    
        //Display date of hover element
        infoDate.textContent = hoverZone.getAttribute('data-timestamp');
    };
    
    //Initialize loading animation
    const initLoadingAnim = ()=>{
        //Fade out stock info and disable clicking on it
        stockInfoContainer.style.opacity = 0.25;
        stockInfoContainer.style.pointerEvents = "none";
    
        const visBoundRect = visualization.getBoundingClientRect();
        const midY = 100 * ((document.body.clientHeight/2) - visBoundRect.y) / visBoundRect.height;
    
        const xScale = 1000/visBoundRect.width;

        //Draw a path on visualization that we will animate while loading
        visualization.innerHTML =
            `<path id="loadingPath" d="m ${50-(2.5*xScale)},${midY+4.5} ${2*xScale},-6 ${xScale},3 ${2*xScale},-6" fill="none" stroke="#5B5"
                vector-effect="non-scaling-stroke" stroke-width="5" stroke-dasharray="200"/>`;
            
        loadingAnim(document.getElementById('loadingPath'),200);
    };

    //Loop to update loading animation until data is loaded
    const loadingAnim = (loadingElement,offset) =>{
        //If we're no longer loading, transition out
        if(state !== STATE.LOADING){
            stockInfoContainer.style.opacity = 1;
            stockInfoContainer.style.pointerEvents = "auto";
            return;
        }
    
        //Loop offset from 400->0
        if(offset <= 0) offset += 400;
    
        //Set stroke-dashoffset attribute to new offset
        //This is a cheap way of making it look like the line is being drawn
        loadingElement.setAttribute('stroke-dashoffset',offset);
    
        //Request next frame of anim with new modified offset
        requestAnimationFrame(()=>{
            loadingAnim(loadingElement,offset-2);
        });
    };

    return {
        //Initialize page for new stock to display
        buildStockPage: (stock) =>{  
            if(state === STATE.LOADING) return;//Return early if currently loading something

            loadedCharts = {};//Reset loaded charts
            loadedCharts.stock = stock;//Store stock symbol/name
            currentTimespan = null;

            //Update name info
            document.getElementById("infoSymbol").textContent = stock.symbol;
            document.getElementById("infoName").textContent = stock.name;
        
            //Hide price container until data is loaded
            priceContainer.style.opacity = 0;
        
            loadData('DAY');//Load intraday data
        },
        //Handle response from server to display data or error message
        handleChartResponse: (code,resp) => {
            if(loadedCharts.stock.symbol !== resp.stock.symbol) return;

            //If response code is an error, display appropriate message
            if(code !== 200){
                state = STATE.FAILED;//Set state to reflect error occurred

                //Clear visualization
                while(visualization.firstChild){ visualization.removeChild(visualization.firstChild); }

                //Alphavantage is a dumpster fire of an API but in theory 404 errors indicate that
                //desired data doesn't exist/isn't available
                errorMessage.querySelector('p').textContent = resp.code === 404 ?
                    'This data is unavailable.' : 'We were unable to complete your request, please try again later.';
        
                errorMessage.style.opacity = "1";//Display error message element
            }else{
                state = STATE.LOADED;//Set state to reflect data was loaded

                currentTimespan = resp.timespan;//Mark the timespan we are currently displaying
                loadedCharts[resp.timespan] = resp.html;//Store received data in loadedCharts            
                
                displayStockData();//Display the data received
            
                priceContainer.style.opacity = 1;//Fade in price container

                if(resp.stock.favorite){
                    favoriteButton.className = 'selected';
                }
            }
        },
        updateFavoriteStatus: (code,resp)=>{
            if(code !== 200 || resp.symbol !== loadedCharts.stock.symbol) return;

            loadedCharts.stock.favorite = resp.favorite;

            if(loadedCharts.stock.favorite){
                favoriteButton.className = 'selected';
            }
            else{
                favoriteButton.removeAttribute('class');
            }
        }
    };
})();