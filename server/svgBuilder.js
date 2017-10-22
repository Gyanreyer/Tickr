//Limit floats to 4 decimal places to cut down on size of response!
const roundFloat = (num) => {
  return parseFloat(num.toFixed(4));
};

// Construct a visualization of the data by making an svg element in text/html format
const makeChart = (dataObject) => {
  if (dataObject.code !== 200) {
    return {
      code: dataObject.code,
      id: 'notFound',
      stock: dataObject.stock,
      message: dataObject.data['Error Message'] ||
        'Something went wrong while retrieving the data you requested.',
    };
  }

  const data = dataObject.data;// Get data array
  const dataLength = data.length;// Store length of data for easy access

  // Determine stroke color based on whether price ended higher than started
  const strokeColor = data[dataLength - 1].price >= data[0].price ? '#5B5' : '#B55';

  // Will need to calculate min and max of prices to convert range to y coords
  let max = data[0].price;
  let min = data[0].price;

  for (let i = 0; i < dataLength; i++) {
    if (data[i].price > max) max = data[i].price;
    if (data[i].price < min) min = data[i].price;
  }

  // Multiply prices by this to convert price to y coord from 10-90 (if max=min, make 0)
  const range = max > min ? 80 / (max - min) : 0;
  const midPt = max - ((max - min) / 2);// Price in the middle of range

  const xDist = roundFloat(100 / (dataLength));// Dist btwn pts on x axis

  const openingLineY = roundFloat(50 - ((data[0].price - midPt) * range));// Y pos of opening price

  let pointString = `0,${openingLineY} `;// string of point coords for graph polyline
  let hoverzonesString = '';// string of rects for capturing hover events on graph

  // Loop through points and add them to graph
  for (let i = 0; i < dataLength; i++) {
    const price = data[i].price;

    pointString += `${roundFloat(xDist * (i + 0.5))},${roundFloat(50 - ((price - midPt) * range))} `;

    hoverzonesString += `<rect class='hoverZone${i === dataLength - 1 ? ' end' : ''}'`+
        `width='${xDist}' height='100' pointer-events='fill' visibility='hidden' x='${xDist * i}' y='0'`+
        `data-stockprice='${price.toFixed(2)}' data-timestamp='${data[i].timestamp}'/>`;
  }

  pointString += `100,${roundFloat(50 - ((data[dataLength - 1].price - midPt) * range))}`;

  let htmlString = `<line vector-effect='non-scaling-stroke' stroke-dasharray='10,10' stroke-width='2'`+
            `stroke='#999' x1='0' y1='${openingLineY}' x2='100' y2='${openingLineY}'/>`+
        `<polyline fill='none' vector-effect='non-scaling-stroke' stroke-width='2'`+
            `stroke='${strokeColor}' points='${pointString}'/>`+
        `<g>${hoverzonesString}</g>`+
        `<line id='hoverLine' vector-effect='non-scaling-stroke' stroke-width='2'`+
            `stroke='#777' y1='0' y2='100' visibility='hidden'/>`;

  //If not just returning contents, add svg container element to surround it
  if(!dataObject.contentsOnly){
    htmlString = `<svg id='visualization' viewBox='0 0 100 100' preserveAspectRatio='none'>${htmlString}</svg>`;
  }

  // Build a full string for svg element that we'll be sending as response
  return {
    code: 200,
    timespan: dataObject.timespan,
    stock: dataObject.stock,
    html: htmlString,
  };
};

module.exports = {
  makeChart,
};