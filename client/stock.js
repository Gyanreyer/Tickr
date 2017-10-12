const RED = '#B55';
const GREEN = '#5B5';

let loadedData = {};
const timespans = ['DAY','WEEK','MONTH','MONTH3','YEAR','YEAR5'];

const mousePos = {
    x: 0,
    y: 0,
    over: false
};

const handleStockDataResponse = resp =>{
    loadedData.loading = false;
    
    const data = resp.data;

    if(!data){
        //Display an error message on screen
    }

    for(let i = 0; i < data.length; i++){
        data[i].price = parseFloat(data[i].price);
    }

    loadedData[resp.timespan] = data;
    
    displayStockData(data, document.getElementById(resp.timespan));
};

const displayStockData = (data,selectButton) =>{  
    const endPrice = data[data.length-1].price;
    const startPrice = data[0].price;

    const positiveChange = ((endPrice - startPrice).toFixed(2) >= 0);

    const canvas = document.getElementById('visualization');
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    let min = startPrice;
    let max = startPrice;

    for(let i = 1; i < data.length; i++){
        const p = data[i].price;

        if(p < min) min = p;
        if(p > max) max = p;
    }

    const baseY = 0.95 * height;
    const yScalar = (0.9*height)/(max-min);
    const pointDistX = width/(data.length-1);

    const startYPos = baseY - (data[0].price-min) * yScalar;

    ctx.clearRect(0,0,width,height);

    ctx.lineWidth = 2;

    //Draw dotted line for open price
    ctx.strokeStyle = '#999';
    ctx.setLineDash([10,10]);

    ctx.beginPath();
    ctx.moveTo(0, startYPos);
    ctx.lineTo(canvas.width,startYPos);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = positiveChange ? GREEN : RED;

    ctx.beginPath();
    ctx.moveTo(0,startYPos);

    for(let i = 1; i < data.length; i++){
        ctx.lineTo(i*pointDistX, baseY - (data[i].price-min) * yScalar);
    }

    ctx.stroke();

    updateStockInfo(data[data.length-1],data[0]);
};

const drawOverlay = () => {
    if(loadedData.loading || !loadedData.hasOwnProperty(loadedData.currentTimespan)) return;

    const data = loadedData[loadedData.currentTimespan];

    if(!data) return;

    const overlay = document.getElementById('overlay');

    const width = overlay.width;
    const xSegmentWidth = width / (data.length-1);

    const index = Math.round(mousePos.x/xSegmentWidth);
    const dataPt = data[index];

    const ctx = overlay.getContext('2d');

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;

    ctx.clearRect(0,0,overlay.width,overlay.height);

    //Clamp so line is still visible on edges
    const xCoord = Math.min(Math.max(index * xSegmentWidth,1),width-1);

    ctx.beginPath();
    ctx.moveTo(xCoord, 0);
    ctx.lineTo(xCoord, overlay.height);
    ctx.stroke();

    updateStockInfo(dataPt,data[0]);    
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
}

const buildStockPage = (stock) =>{
    loadedData = {
        currentTimespan: timespans[0],//Start as DAY
        loading: true
    };

    document.getElementById("infoSymbol").textContent = loadedData.symbol = stock.symbol;
    document.getElementById("infoName").textContent = loadedData.name = stock.name;
    document.getElementById(loadedData.currentTimespan).className = 'selected';

    sendRequest(requestMethodEnum.get, requestTypeEnum.getStockData, {
        symbol: stock.symbol,
        timespan: loadedData.currentTimespan//Get DAY data to display first
    });
};

//IIFE to init stock page stuff
(()=>{
    const timespanSelButtons = document.getElementById('timespanSelect').childNodes;

    for(let i = 0; i < timespanSelButtons.length; i++){
        timespanSelButtons[i].addEventListener('click',function(){
            if(this.className === 'selected' || loadedData.loading) return;
            
            const selectedButtons =  document.querySelectorAll('.selected');

            for(let i = 0; i < selectedButtons.length; i++){
               selectedButtons[i].removeAttribute('class');
            }

            this.className = 'selected';
            loadedData.currentTimespan = this.id;

            const data = loadedData[this.id];

            if(data)
                displayStockData(data, this);
            else
                sendRequest(requestMethodEnum.get, requestTypeEnum.getStockData, {
                    symbol: loadedData.symbol,
                    timespan: this.id//Get DAY data to display first
                });
        });
    }

    const overlay = document.getElementById('overlay');
    overlay.addEventListener('mousemove',(e)=>{
        const boundingRect = overlay.getBoundingClientRect();

        mousePos.x = (e.clientX - boundingRect.left) * overlay.width/boundingRect.width;
        mousePos.y = (e.clientY - boundingRect.top) * overlay.height/boundingRect.height;
        drawOverlay();
    });
    overlay.addEventListener('mouseleave',function(){
        const data = loadedData[loadedData.currentTimespan];

        if(!data) return;

        this.getContext('2d').clearRect(0,0,this.width,this.height);

        updateStockInfo(data[data.length-1],data[0]);
    });
})();