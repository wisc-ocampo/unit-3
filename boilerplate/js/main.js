// Week 10

// SCOPE
(function(){
    
    // data joining
const attrArray = ['gns_name', 'latitude', 'longitude', 
    'year_2020', 'year_2015', 'year_2010', 'year_2005', 'year_2000',
    'year_1995', 'year_1990', 'year_1985', 'year_1980', 'year_1975',
    'year_1970', 'year_1965', 'year_1960', 'year_1955', 'year_1950',
    'area'
];
    let expressed = attrArray[18];

window.onload = setMap();

// MAP CREATION
function setMap(){

    // projection
    const width = window.innerWidth * 0.4;
    const height = 960;

    let map = d3
        .select('body')
        .append('svg')
        .attr('class', 'map')
        .attr('width', width)
        .attr('height', height);

    let projection = d3
        .geoAlbers()
        .center([0, 34.8755])
        .rotate([-138.461, 0, 0])
        .parallels([27.2605, 42.4810])
        .scale(1500)
        .translate([width / 1.55, height / 2]);

    let path = d3.geoPath().projection(projection);

// DATA
    let promises = [
        d3.csv('data/JapanPopDensity.csv'),
        d3.json('data/japan_minTable.topojson')
    ];
    Promise.all(promises).then(callback);

    function callback(data){
        const csvData = data[0];
        const japan = data[1];

        setGraticule (map, path);

        let japanPrefectures = topojson.feature(japan, japan.objects.japan_minTable).features;
        console.log(japanPrefectures);

        japanPrefectures = joinData(japanPrefectures, csvData);

        let colorScale = makeColorScale(csvData);
        
        setEnumerationUnits (japanPrefectures, map, path, colorScale);

        setChart(csvData, colorScale);
    };
};

    // join data
function joinData(japanPrefectures, csvData){
        for (let i=0; i<csvData.length; i++){
            let csvPrefecture = csvData[i];
            let csvKey = csvPrefecture.gns_name;

            for (let j=0; j<japanPrefectures.length; j++){
                let geojsonProps = japanPrefectures[j].properties;
                let geojsonKey = geojsonProps.gns_name;

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
    let graticule = d3.geoGraticule().step([5, 5]);

    let gratBackground = map
        .append('path')
        .datum(graticule.outline())
        .attr('class', 'gratBackground')
        .attr('d', path);

    let gratLines = map
        .selectAll('.gratLines')
        .data(graticule.lines())
        .enter()
        .append('path')
        .attr('class', 'gratLines')
        .attr('d', path);
};
       
function setEnumerationUnits(japanPrefectures, map, path, colorScale){
    let prefectures = map
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
        });
};

// COLOR
function makeColorScale(data){
    let colorClasses = [
        '#fef0e9',
        '#fdcc8a',
        '#fc8d59',
        '#e34a33',
        '#b30000'
    ];

    let colorScale = d3.scaleQuantile()
    // let colorScale = d3.scaleThreshold()
        .range(colorClasses)
    
    // quantile
    // let domainArray = [];
    // for (let i=0; i<data.length; i++){
    //     let val = parseFloat(data[i][expressed]);
    //     domainArray.push(val);
    // };
    //
    // colorScale.domain(domainArray);

    // equal interval
    let minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    
    colorScale.domain(minmax);

    // console.log(colorScale.quantiles())

    // let domainArray = [];
    // for (let i=0; i<data.length; i++){
        // let val = parseFloat(data[i][expressed]);
        // domainArray.push(val);
    // };

    // let clusters = ss.ckmeans(domainsArray,  5);
    // domainArray = clusters.map(function(d){
    //     return d3.min(d);
    // });
    // domainArray.shift();
    //
    // colorScale.domain(domainArray);

    return colorScale;
};

function  setChart(csvData, colorScale){
    const chartWidth = window.innerWidth * 0.5,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = 'translate(' + leftPadding + ',' + topBottomPadding + ')';

let chart = d3
    .select('body')
    .append('svg')
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .attr('class', 'chart');

let chartBackground = chart
    .append('rect')
    .attr('class', 'chartBackgound')
    .attr('width', chartInnerWidth)
    .attr('height', chartInnerHeight)
    .attr('transform', translate);

let yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 80]);

let bars = chart
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
    .attr('x', function(d, i){
        return i * (chartInnerWidth / csvData.length) + leftPadding;
    })
    .attr('height', function(d){
        return 463 - yScale(parseFloat(d[expressed]));
    })
    .attr('y', function(d){
        return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
    .style('fill', function(d){
        return colorScale(d[expressed]);
    });

let numbers = chart
    .selectAll('.numbers')
    .data(csvData)
    .enter()
    .append('text')
    .sort(function(a, b){
        return a[expressed]-b[expressed]
    })
    .attr('class', function(d){
        return 'numbers ' + d.gns_name;
    })
    .attr('text-anchor', 'middle')
    .attr('x', function(d, i){
        let fraction = chartWidth / csvData.length;
        return i * fraction + (fraction - 1) / 2;
    })
    .attr('y', function(d){
        return chartHeight - yScale(parseFloat(d[expressed])) + 15;
    })
    .text(function(d){
        return d[expressed];
    });

let chartTitle = chart
    .append('text')
    .attr('x', 40)
    .attr('y', 40)
    .attr('class', 'chartTitle')
    .text('Population Density of ' + expressed[0] + ' per square kilometer');

let yAxis = d3.axisLeft()
    .scale(yScale);

let axis = chart
    .append('g')
    .attr('class', 'axis')
    .attr('transform', translate)
    .call(yAxis);

let chartFrame = chart
    .append('rect')
    .attr('class', 'chartFrame')
    .attr('width', chartInnerWidth)
    .attr('height', chartInnerHeight)
    .attr('transform',translate);
};

})();
