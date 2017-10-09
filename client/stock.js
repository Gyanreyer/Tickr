const handleStockDataResponse = () =>{

};

const displayStockData = data =>{
        
    const canvas = document.getElementById('visualization');
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    const adjustedData = [];

    let min = Number.POSITIVE_INFINITY,
        max = Number.NEGATIVE_INFINITY;

    for(let i = 0; i < data.length; i++){
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
    ctx.lineCap = 'butt';

    ctx.beginPath();
    ctx.moveTo(0, startPrice);
    ctx.lineTo(canvas.width,startPrice);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.strokeStyle = data[data.length-1].price > data[0].price? 'green' : 'red';

    ctx.beginPath();
    ctx.moveTo(0,startPrice);

    for(let i = 1; i < data.length; i++){
        ctx.lineTo(i*pointDistX, startY - (data[i].price-min) * yScalar);
    }

    ctx.stroke();
};