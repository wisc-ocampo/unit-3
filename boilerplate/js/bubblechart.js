// data arrays
const dataArray = [10, 20, 30, 40, 50];
const cityPop = [
    { 
        city: 'Madison',
        population: 233209
    },
    {
        city: 'Milwaukee',
        population: 594833
    },
    {
        city: 'Green Bay',
        population: 104057
    },
    {
        city: 'Superior',
        population: 27244
    }
];

// global variables
const w = 900
const h = 500
let x = d3.scaleLinear()
    .range([90, 750])
    .domain([0, 3]);
let minPop = d3.min(cityPop, function(d){
    return d.population;
});
let maxPop = d3.max(cityPop, function(d){
    return d.population;
});
let y = d3.scaleLinear()
    .range([450, 50])
    .domain([0, 700000]);
let color = d3.scaleLinear()
    .range([
        '#FDBE85',
        '#D94701'
    ])
    .domain([
        minPop,
        maxPop
    ]);
let format = d3.format(',');

// D3
window.onload = function(){
    let container = d3.select('body')
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .attr('class', 'container')
        .style('background-color', 'rgba(0,0,0,0.2)')
    // rectangle
    let innerRect = container.append('rect')
        .datum(400)
        .attr('width', function(d){
            return d * 2;
        })
        .attr('height', function(d){
            return d;
        })
        .attr('class', 'innerRect')
        .attr('x', 50)
        .attr('y', 50)
        .style('fill', '#FFFFFF')
    let circles = container.selectAll('.circles')
        .data(cityPop)
        .enter()
        .append('circle')
        .attr('class', 'circles')
        .attr('r', function(d, i){
            let area = d.population * 0.01;
            return Math.sqrt(area/Math.PI)
        })
        .attr('cx', function(d, i){
            return x(i)
        })
        .attr('cy', function(d){
            return y(d.population);
        })
        .style('fill', function(d, i){
            return color(d.population);
        })
        .style('stroke', '#000')
    let yAxis = d3.axisLeft(y)
    let axis = container.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(50, 0)')
        .call(yAxis)
    let title = container.append('text')
        .attr('class', 'title')
        .attr('text-anchor', 'middle')
        .attr('x', 450)
        .attr('y', 30)
        .text('City Populations')
    let labels = container.selectAll('.labels')
        .data(cityPop)
        .enter()
        .append('text')
        .attr('class', 'labels')
        .attr('text-anchor', 'left')
        .attr('y', function(d){
            return y(d.population);
        });
    let nameLine = labels.append('tspan')
        .attr('class', 'nameLine')
        .attr('x', function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .text(function(d){
            return d.city;
        });
    let popLine = labels.append('tspan')
        .attr('class', 'popLine')
        .attr('x', function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .attr('dy', '15')
        .text(function(d){
            return 'Pop. ' + format(d.population);
        });} 
