let loadedData = { currentData: 'DAY' };
const timespans = ['DAY','WEEK','MONTH','MONTH3','YEAR','YEAR5'];

const mousePos = {
    x: 0,
    y: 0,
    over: false
};

const handleStockDataResponse = resp =>{
    const data = resp.data;

    if(!data) return;//Throw an error somehow?

    for(let i = 0; i < data.length; i++){
        data[i].price = parseFloat(data[i].price);
    }

    loadedData.data[resp.timespan] = data;

    for(let i = 0; i < timespans.length; i++){
        if(!loadedData.data[timespans[i]]) return;
    }

    finishLoadingPage();
};

const displayStockData = (data,selectButton) =>{  
    document.getElementById(loadedData.currentData).removeAttribute('class');
    selectButton.className = 'selected';
    loadedData.currentData = selectButton.id;

    const priceChange = data[data.length-1].price - data[0].price;
    const percentChange = 100 * priceChange/data[data.length-1].price;

    document.getElementById('infoChange').textContent = 
        `${priceChange < 0?'-':'+'}$${Math.abs(priceChange.toFixed(2))} (${percentChange.toFixed(2)}%)`;

    document.getElementById("dateLabel").className =
        document.getElementById("priceLabel").className =
        document.getElementById("changeLabel").className =
            priceChange >= 0? 'green' : 'red';

    const canvas = document.getElementById('visualization');
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    let min = data[0].price;
    let max = data[0].price;

    for(let i = 1; i < data.length; i++){
        const p = data[i].price;

        if(p < min) min = p;
        if(p > max) max = p;
    }

    const startY = 0.95 * height;
    const yScalar = (0.9*height)/(max-min);
    const pointDistX = width/(data.length-1);

    const startPrice = startY - (data[0].price-min) * yScalar;

    ctx.clearRect(0,0,width,height);

    //Draw dotted line for open price
    ctx.strokeStyle = '#999';
    ctx.setLineDash([10,10]);

    ctx.beginPath();
    ctx.moveTo(0, startPrice);
    ctx.lineTo(canvas.width,startPrice);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = data[data.length-1].price > data[0].price? 'green' : 'red';

    ctx.beginPath();
    ctx.moveTo(0,startPrice);

    for(let i = 1; i < data.length; i++){
        ctx.lineTo(i*pointDistX, startY - (data[i].price-min) * yScalar);
    }

    ctx.stroke();
};

const buildStockPage = stock =>{
    loadedData.symbol = stock.symbol;
    loadedData.name = stock.name;
    loadedData.data = {};

    for(let i = 0; i < timespans.length; i++){
        sendRequest(requestMethodEnum.get,
            requestTypeEnum.getStockData,
            {symbol:stock.symbol,timespan:timespans[i]});
    }
};

const finishLoadingPage = () => {
    document.getElementById("infoSymbol").textContent = loadedData.symbol;
    document.getElementById("infoName").textContent = loadedData.name;

    document.getElementById("infoPrice").textContent = `$${loadedData.data.DAY[loadedData.data.DAY.length-1].price}`;

    displayStockData(loadedData.data.DAY, document.getElementById('DAY'));
};

const drawOverlay = () => {
    const data = loadedData.data[loadedData.currentData];

    if(!data) return;

    const overlay = document.getElementById('overlay');

    const width = overlay.width;
    const xSegmentWidth = width / (data.length-1);

    const index = Math.round(mousePos.x/xSegmentWidth);
    const dataPt = data[index];

    const ctx = overlay.getContext('2d');

    ctx.strokeStyle = '#999';

    ctx.clearRect(0,0,overlay.width,overlay.height);

    ctx.beginPath();
    ctx.moveTo(index * xSegmentWidth, 0);
    ctx.lineTo(index * xSegmentWidth, overlay.height);
    ctx.stroke();

    document.getElementById('infoDate').textContent = dataPt.timestamp;
    document.getElementById('infoPrice').textContent = `$${dataPt.price}`;

    const priceChange = dataPt.price - data[0].price;
    const percentChange = priceChange/data[0].price;

    document.getElementById("dateLabel").className =
        document.getElementById("priceLabel").className =
        document.getElementById("changeLabel").className =
            priceChange >= 0? 'green' : 'red';

    if(priceChange > 0){
        
    }

    document.getElementById('infoChange').textContent = 
        `${priceChange < 0?'-':'+'}$${Math.abs(priceChange.toFixed(2))} (${percentChange.toFixed(2)}%)`;
    
};

//IIFE to init stock page stuff
(()=>{
    document.getElementById("visContainer").style.height = `${document.getElementById('visualization').clientHeight}px`;

    const timespanSelButtons = document.getElementById('timespanSelect').childNodes;

    for(let i = 0; i < timespanSelButtons.length; i++){
        timespanSelButtons[i].addEventListener('click',function(){
            if(this.id === loadedData.currentData) return;
            
            const data = loadedData.data[this.id];

            if(data)
                displayStockData(data, this);
        });
    }

    const overlay = document.getElementById('overlay');
    overlay.addEventListener('mousemove',(e)=>{
        const boundingRect = overlay.getBoundingClientRect();

        mousePos.x = (e.clientX - boundingRect.left) * overlay.width/boundingRect.width;
        mousePos.y = (e.clientY - boundingRect.top) * overlay.height/boundingRect.height;
        mousePos.over = true;
        drawOverlay();
    });
    overlay.addEventListener('mouseleave',function(){
        mousePos.over = false;

        this.getContext('2d').clearRect(0,0,this.width,this.height);
    });
})();