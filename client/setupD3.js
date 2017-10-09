/*const drawData = (data)=>{
    const graph = d3.select('#graph');
    
    const width = graph.attr('width'),
          height = graph.attr('height');
    
    const yScale = d3.scale.linear()
        .domain([d3.min(data), d3.max(data)])
        .range([height*0.05,height*0.95]);
    
    const xScale = d3.time.scale()
        .range(0,width);

    const nestedData = d3.nest()
        .key(d=>{return d.price;})
        .key(d=>{return d.timestamp;})
        .entries(data);

    const min = d3.min(nestedData, d=>{
        return d3.min(d.values, dat=>{return dat.values.length;});
    });

    const max = d3.max(nestedData, d=>{
        return d3.max(d.values, dat=>{return dat.values.length;});
    });
};
*/