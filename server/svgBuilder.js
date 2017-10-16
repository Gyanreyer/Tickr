//Construct a visualization of the data by making an svg element in text/html format
module.exports.makeChart = (dataObject) => {  
  if(dataObject.error){
    return {
        code: 404,
        id: 'notFound',
        message: 'Something went wrong while retrieving the data you requested.'
    };
  }
  
  const data = dataObject.data;//Get data array
  const dataLength = data.length;//Store length of data for easy access

  //Determine stroke color based on whether price ended higher than started
  const strokeColor = data[dataLength-1].price >= data[0].price ? '#5B5' : '#B55';

  //Will need to calculate min and max of prices to convert range to y coords
  let max = data[0].price,
      min = data[0].price;

  for(let i = 0; i < dataLength; i++){
      if(data[i].price > max) max = data[i].price;
      if(data[i].price < min) min = data[i].price;
  }

  const range = 80 / (max - min);//Multiply prices by this to convert price to y coord from 0-100
  const xDist = 100 / (dataLength);//Dist btwn pts on x axis

  const openingLineY = 90-(data[0].price - min)*range;//Y pos of opening price

  let pointString = `0,${openingLineY} `;//string of point coords for graph polyline
  let hoverzonesString = '';//string of rects for capturing hover events on graph

  //Loop through points and add them to graph
  for(let i = 0; i < dataLength; i++){
      const price = data[i].price;

      pointString += `${xDist*(i+0.5)},${90-(price - min)*range} `;

    let idString = '';

    if(i === 0) idString = 'id="start"';
    else if(i === dataLength-1) idString = 'id="end"';

      hoverzonesString += `<rect class="hoverZone" width="${xDist}" height="100"
          pointer-events="fill" visibility="hidden" x="${xDist*i}" y="0"
          data-stockprice="${price.toFixed(2)}" data-timestamp="${data[i].timestamp}"
          ${idString}/>`;
  }

  pointString += `100,${90-(data[dataLength-1].price - min)*range}`;

  //Build a full string for svg element that we'll be sending as response
  return {
    code: 200,
    timespan: dataObject.timespan,
    html:`<line vector-effect="non-scaling-stroke" stroke-dasharray="10,10" stroke-width="2"
            stroke="#999" x1="0" y1="${openingLineY}" x2="100" y2="${openingLineY}"/>
        <polyline fill="none" vector-effect="non-scaling-stroke" stroke-width="2"
            stroke="${strokeColor}" points="${pointString}"/>
        <g>${hoverzonesString}</g>
        <line id="hoverLine" vector-effect="non-scaling-stroke" stroke-width="2"
            stroke="#777" y1="0" y2="100" visibility="hidden"/>`
    }
};