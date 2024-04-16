// Week 10

// SCOPE
(function(){
   
// GLOBAL
    // data joining
const attrArray = ['gns_name', 
    'density_2020', 'density_2015', 'density_2010', 'density_2005', 'density_2000',
    'density_1995', 'density_1990', 'density_1985', 'density_1980', 'density_1975',
    'density_1970', 'density_1965', 'density_1960', 'density_1955', 'density_1950'
];
    let expressed = attrArray[8];

    const chartWidth = window.innerWidth * 0.5,
        chartHeight = 700,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = 'translate(' + leftPadding + ',' + topBottomPadding + ')';

    const yScale = d3.scaleLinear()
        .range([chartHeight, 0])
        .domain([0, 5500]);

window.onload = setMap();

// MAP CREATION
function setMap(){

    // projection
    const width = window.innerWidth * 0.4;
    const height = 960;

    const map = d3
        .select('body')
        .append('svg')
        .attr('class', 'map')
        .attr('width', width)
        .attr('height', height);

    const projection = d3
        .geoAlbers()
        .center([0, 34.8755])
        .rotate([-138.461, 0, 0])
        .parallels([27.2605, 42.4810])
        .scale(1500)
        .translate([width / 1.55, height / 2]);

    const path = d3.geoPath().projection(projection);

// DATA
    const promises = [
        d3.csv('data/JapanPopDensitySimple.csv'),
        d3.json('data/japan_minTable.topojson')
    ];
    Promise.all(promises).then(callback);

    function callback(data){
        const csvData = data[0];
        const japan = data[1];

        setGraticule (map, path);

        let japanPrefectures = topojson.feature(japan, japan.objects.japan_minTable).features;

        japanPrefectures = joinData(japanPrefectures, csvData);

        const colorScale = makeColorScale(csvData);
        
        setEnumerationUnits (japanPrefectures, map, path, colorScale);

        setChart(csvData, colorScale);

        createDropdown(csvData);

    };
};

    // join data
function joinData(japanPrefectures, csvData){
        for (let i=0; i<csvData.length; i++){
            let csvPrefecture = csvData[i];
            const csvKey = csvPrefecture.gns_name;

            for (let j=0; j<japanPrefectures.length; j++){
                const geojsonProps = japanPrefectures[j].properties;
                const geojsonKey = geojsonProps.gns_name;

                if (geojsonKey == csvKey){
                    attrArray.forEach(function(attr){
                        let val = parseFloat(csvPrefecture[attr]);
                        geojsonProps[attr] = val;
                    });
                };
            };
        };
    return japanPrefectures;
};

// GRATICULE & DRAWING

function setGraticule(map, path){
    const graticule = d3.geoGraticule().step([5, 5]);

    const gratBackground = map
        .append('path')
        .datum(graticule.outline())
        .attr('class', 'gratBackground')
        .attr('d', path);

    const gratLines = map
        .selectAll('.gratLines')
        .data(graticule.lines())
        .enter()
        .append('path')
        .attr('class', 'gratLines')
        .attr('d', path);
};
       
function setEnumerationUnits(japanPrefectures, map, path, colorScale){
    const prefectures = map
        .selectAll('.prefectures')
        .data(japanPrefectures)
        .enter()
        .append('path')
        .attr('class', function(d){
            return 'prefectures ' + d.properties.gns_name;
        })
        .attr('d', path)
        .style('fill', function(d){
            let value = d.properties[expressed];
            if(value) {
                return colorScale(d.properties[expressed]);
            } else {
                return '#ccc';
            }
        })
        .on('mouseover', function(event,d){
            highlight(d.properties);
        })
        .on('mouseout', function(event,d){
            dehighlight(d);
        });

    const desc = prefectures
        .append('desc')
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');

};

// COLOR
function makeColorScale(data){
    const colorClasses = [
        '#ffffff',
        '#f0f0f0',
        '#d9d9d9',
        '#bdbdbd',
        '#969696',
        '#737373',
        '#525252',
        '#252525',
        '#000000'
    ];

    const colorScale = d3.scaleQuantile()
    // const colorScale = d3.scaleThreshold()
        .range(colorClasses)
    
    // quantile
    // const domainArray = [];
    // for (let i=0; i<data.length; i++){
    //     let val = parseFloat(data[i][expressed]);
    //     domainArray.push(val);
    // };
    //
    // colorScale.domain(domainArray);

    // equal interval
    const minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    
    colorScale.domain(minmax);

    // console.log(colorScale.quantiles())

    // const domainArray = [];
    // for (let i=0; i<data.length; i++){
        // let val = parseFloat(data[i][expressed]);
        // domainArray.push(val);
    // };

    // const clusters = ss.ckmeans(domainsArray,  5);
    // domainArray = clusters.map(function(d){
    //     return d3.min(d);
    // });
    // domainArray.shift();
    //
    // colorScale.domain(domainArray);

    return colorScale;
};

// CHART

function setChart(csvData, colorScale){

    const chart = d3
        .select('body')
        .append('svg')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .attr('class', 'chart');

    const chartBackground = chart
        .append('rect')
        .attr('class', 'chartBackgound')
        .attr('width', chartInnerWidth)
        .attr('height', chartInnerHeight)
        .attr('transform', translate);

    const bars = chart
        .selectAll('bars')
        .data(csvData)
        .enter()
        .append('rect')
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr('class', function(d){
            return 'bar ' + d.gns_name;
        })
        .attr('width', chartInnerWidth / csvData.length - 1)
        .on('mouseover', function(event,d){
            highlight(d);
        })
        .on('mouseout', function(event,d){
            dehighlight(d);
        });

    const desc = bars
         .append('desc')
         .text('{"stroke": "none", "stroke-width": "0px"}');

// const numbers = chart
//     .selectAll('.numbers')
//     .data(csvData)
//     .enter()
//     .append('text')
//     .sort(function(a, b){
//         return a[expressed]-b[expressed]
//     })
//     .attr('class', function(d){
//         return 'numbers ' + d.gns_name;
//     })
//     .attr('text-anchor', 'middle')
//     .attr('x', function(d, i){
//         const fraction = chartWidth / csvData.length;
//         return i * fraction + (fraction - 1) / 2;
//     })
//     .attr('y', function(d){
//         return chartHeight - yScale(parseFloat(d[expressed])) + 15;
//     })
//     .text(function(d){
//         return d[expressed];

const chartTitle = chart
    .append('text')
    .attr('x', 40)
    .attr('y', 40)
    .attr('class', 'chartTitle')

    updateChart(bars, csvData.length, colorScale);

const yAxis = d3.axisLeft()
    .scale(yScale);

const axis = chart
    .append('g')
    .attr('class', 'axis')
    .attr('transform', translate)
    .call(yAxis);

const chartFrame = chart
    .append('rect')
    .attr('class', 'chartFrame')
    .attr('width', chartInnerWidth)
    .attr('height', chartInnerHeight)
    .attr('transform',translate);
};

// SELECTION

function createDropdown(csvData){
    const dropdown = d3
        .select('body')
        .append('select')
        .attr('class', 'dropdown')
        .on('change', function(){
            changeAttribute(this.value, csvData)
        });

    const titleOption = dropdown
        .append('option')
        .attr('class', 'titleOption')
        .attr('disabled', 'true')
        .text('Select Attribute');

    const attrOptions  = dropdown
        .selectAll('attrOptions')
        .data(attrArray)
        .enter()
        .append('option')
        .attr('value', function(d){
            return d
        })
        .text(function(d){
            return d
        });
};

function changeAttribute(attribute, csvData) {
    
    expressed = attribute;
    const colorScale = makeColorScale(csvData);
    
    const prefectures = d3
        .selectAll('.prefectures')
        .transition()
        .duration(1000)
        .style('fill', function (d) {
        let value = d.properties[expressed];
        if (value) {
            return colorScale(d.properties[expressed]);
        } else {
            return '#ccc';
        }
    });
    
    const bars = d3
        .selectAll('.bar')
        .sort(function(a,b){
            return b[expressed] - a[expressed]
        })
        .transition()
        .delay(function(d,i){
            return i * 20
        })
        .duration(500);
    
    updateChart(bars, csvData.length, colorScale)
}

function updateChart(bars, n, colorScale) {
    
    bars.attr('x', function(d,i) {
        return i * (chartInnerWidth / n) + leftPadding;
    })
        .attr('height', function(d,i) {
            return chartHeight - yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .attr('y', function(d,i) {
            return yScale(parseFloat(d[expressed])) + topBottomPadding; 
        })
        .style('fill', function(d) {
            let value = d[expressed];
            if (value) {
                return colorScale(value);
            } else {
                return '#ccc';
            }
        });

    const chartTitle = d3
        .select('.chartTitle')
        .text('Population Density of ' + expressed[8] + ' (people/km^2)');
}

function highlight(props){
    const selected = d3
        .selectAll('.' + props.gns_name)
        .style('stroke', 'blue')
        .style('stroke-width', '2');
};

function dehighlight(props){
    const selected = d3
        .selectAll('.' + props.gns_name)
        .style('stroke', function(){
            return getStyle(this, 'stroke')
        })
        .style('stroke-width', function(){
            return getStyle(this, 'stroke-width')
        });

    function getStyle(element,styleName){
        const styleText = d3
            .select(element)
            .select('desc')
            .text();

        const styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
};
})();
