const RED = '#B55';
const GREEN = '#5B5';

let loadedCharts = {
};
const timespans = ['DAY','WEEK','MONTH','MONTH3','YEAR','YEAR5'];

const handleStockDataResponse = (resp) =>{
    loadedCharts.loading = false;

    if(resp.code !== 200){
        //Display the error message on screen
        console.log(resp);
        const vis = document.getElementById('visualization');
        
        while(vis.firstChild){
            vis.removeChild(vis.firstChild);
        }

        return;
    }

    loadedCharts[resp.timespan] = resp.html;
    
    displayStockData(resp.html);

    document.getElementById('priceContainer').style.opacity = 1;
};

const displayStockData = (svgElement) =>{  
    const vis = document.getElementById('visualization');
    vis.innerHTML = svgElement;
    showHoverInfo(vis.querySelector('.end'));

    vis.addEventListener('mousemove',(e)=>{
        if(loadedCharts.loading || !loadedCharts[loadedCharts.currentTimespan]) return;

        showHoverLine(100*e.clientX/vis.getBoundingClientRect().width)
    });
    vis.addEventListener('mouseleave',()=>{
        if(loadedCharts.loading || !loadedCharts[loadedCharts.currentTimespan]) return;

        document.getElementById('hoverLine').setAttribute('visibility','hidden');
        showHoverInfo(vis.querySelector('.end'));
    });

    const hoverZones = vis.querySelectorAll('.hoverZone');

    for(let i = 0; i < hoverZones.length; i++){
        hoverZones[i].addEventListener('mousemove',()=>{showHoverInfo(hoverZones[i])});
    }    
};

const updateStockInfo = (dataPt, startPt) => {
    document.getElementById('infoDate').textContent = dataPt.timestamp;
    document.getElementById('infoPrice').textContent = `$${dataPt.price.toFixed(2)}`;

    let priceChange = dataPt.price - startPt.price;
    const percentChange = (100 * priceChange/startPt.price).toFixed(2);
    
    priceChange = Math.abs(priceChange).toFixed(2);

    const positiveChange = (percentChange >= 0);

    const infoChange = document.getElementById('infoChange');   
    infoChange.style.color = positiveChange? GREEN : RED;

    infoChange.textContent = `${positiveChange?'+':'-'}$${priceChange} (${percentChange}%)`;
};

const buildStockPage = (stock) =>{  
    loadedCharts = {};
    
    document.getElementById("infoSymbol").textContent = loadedCharts.symbol = stock.symbol;
    document.getElementById("infoName").textContent = stock.name;
    
    document.getElementById('priceContainer').style.opacity = 0;

    loadData('DAY');//Get DAY data to display first
};

const loadData = (timespan) =>{

    if(timespan === loadedCharts.currentTimespan || loadedCharts.loading) return;

    const selectedButtons =  document.querySelectorAll('.selected');
    
    for(let i = 0; i < selectedButtons.length; i++){
        selectedButtons[i].removeAttribute('class');
    }

    document.getElementById(timespan).className = 'selected';

    loadedCharts.currentTimespan = timespan;
    
    const data = loadedCharts[timespan];

    if(data)
        displayStockData(data);
    else{
        loadedCharts.loading = true;

        initLoadingAnim();

        sendRequest(requestMethodEnum.get, requestTypeEnum.getStockChart, {
            symbol: loadedCharts.symbol,
            timespan
        });
    }
};

const showHoverLine = (xPos) => {
    if(loadedCharts.loading) return;

    const hoverLine = document.getElementById('hoverLine');
    hoverLine.setAttribute('visibility','visible');
    hoverLine.setAttribute('x1',xPos);
    hoverLine.setAttribute('x2',xPos);
};

const showHoverInfo = (hoverElement) => {
    if(loadedCharts.loading) return;
    
    //Get price of first hover zone
    const startPrice =
        parseFloat(document.querySelector('.hoverZone').getAttribute('data-stockprice'));

    const priceString = hoverElement.getAttribute('data-stockprice')
    
    const priceFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    });

    const change =  parseFloat(priceString) - startPrice;
    const percentChange = 100 * change / startPrice;

    const positiveChange = change >= 0;

    const priceContainer = document.getElementById('priceContainer');

    priceContainer.querySelector('#infoPrice').textContent = `${priceFormatter.format(priceString)}`;

    const infoChange = priceContainer.querySelector('#infoChange');
    const infoDate = priceContainer.querySelector('#infoDate');

    infoChange.style.color = infoDate.style.color = positiveChange ? '#5B5' : '#B55';
    infoChange.textContent =
        `${positiveChange ? '+':'-'}${priceFormatter.format(Math.abs(change))} (${percentChange.toFixed(2)}%)`;

    infoDate.textContent = hoverElement.getAttribute('data-timestamp');
};

const initLoadingAnim = ()=>{
    document.getElementById('stockInfo').style.opacity = 0.25;

    const vis = document.getElementById('visualization');

    const visBoundRect = vis.getBoundingClientRect();
    const midY = 100 * ((document.body.clientHeight/2) - visBoundRect.y) / visBoundRect.height;

    vis.innerHTML =
        `<path id="loadingPath" d="m 47,${midY} 2,-5 1,2.5 3,-7.5" fill="none" stroke="#5B5"
            vector-effect="non-scaling-stroke" stroke-width="5" stroke-dasharray="100"/>`;
        
    loadingAnim(document.getElementById('loadingPath'),0);
}

const loadingAnim = (loadingElement,offset) =>{
    if(!loadedCharts.loading){
        document.getElementById('stockInfo').style.opacity = 1;
        return;
    }

    loadingElement.setAttribute('stroke-dashoffset',offset);

    requestAnimationFrame(()=>{
        loadingAnim(loadingElement,offset-1.5);
    });
}

//IIFE to init stock page stuff
(()=>{
    const timespanSelButtons = document.getElementById('timespanSelect').childNodes;

    for(let i = 0; i < timespanSelButtons.length; i++){
        timespanSelButtons[i].addEventListener('click',()=>{
            loadData(timespanSelButtons[i].id);
        });
    }
})();