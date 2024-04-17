// Ocampo, Francisco - April 2024


// SETTING FUNCTION SCOPE

(function(){


// FUNCTION VARIABLES
    
    const attrArray = ['gns_name', 
        'density_2020', 'density_2015', 'density_2010', 'density_2005', 'density_2000',
        'density_1995', 'density_1990', 'density_1985', 'density_1980', 'density_1975',
        'density_1970', 'density_1965', 'density_1960', 'density_1955', 'density_1950'
    ];
    
    let expressed = attrArray[1];

    const chartWidth = window.innerWidth * 0.5,
        chartHeight = 700,
        leftPadding = 25,
        rightPadding = 2,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight,
        translate = 'translate(' + leftPadding + ')';

    const yScale = d3.scaleLinear()
        .range([chartHeight, 0])
        .domain([51, 6412]);

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

    const path = d3
        .geoPath().projection(projection);


// DATA

    const promises = [
        d3.csv('data/JapanPopDensitySimple.csv'),
        d3.json('data/neB0.topojson'),
        d3.json('data/neB1000.topojson'),
        d3.json('data/neB3000.topojson'),
        d3.json('data/neB5000.topojson'),
        d3.json('data/neJapan.topojson')
    ];
    Promise.all(promises).then(callback);

    function callback(data){

    // implementation

        const csvData = data[0],
            b0 = data[1],
            b1 = data[2],
            b3 = data[3],
            b5 = data[4],
            japan = data[5];

console.log(b0)

        setGraticule (map, path);

        let neB0 = topojson
            .feature(b0, b0.objects.neB0),
            neB1 = topojson
            .feature(b1, b1.objects.neB1000),
            neB3 = topojson
            .feature(b3, b3.objects.neB3000),
            neB5 = topojson
            .feature(b5, b5.objects.neB5000),
            japanPrefectures = topojson
                .feature(japan, japan.objects.neJapan).features;

console.log(b0)

        let drawB0 = map
             .append('path')
             .datum(neB0)
             .attr('class', 'drawB0')
             .attr('d', path),
            drawB1 = map
             .append('path')
             .datum(neB1)
             .attr('class', 'drawB1')
             .attr('d', path),
            drawB3 = map
             .append('path')
             .datum(neB3)
             .attr('class', 'drawB3')
             .attr('d', path),
            drawB5 = map
             .append('path')
             .datum(neB5)
             .attr('class', 'drawB5')
             .attr('d', path);

        console.log(neB0);
        console.log(neB1);
        console.log(neB3);
        console.log(neB5);
        console.log(japanPrefectures);

            japanPrefectures = joinData(japanPrefectures, csvData);

        const interpolation = makeColorScale(csvData);
        setEnumerationUnits (japanPrefectures, map, path, interpolation);
        setChart(csvData, interpolation);
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


// GRATICULE

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


// PREFECTURES

function setEnumerationUnits(japanPrefectures, map, path, interpolation){
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
            if (value) {
                return interpolation(d.properties[expressed]);
            } else {
                return '#ccc';
            }
        })
    //
    // mouse interactions
        .on('mouseover', function(event,d){
            highlight(d.properties);
        })
        .on('mouseout', function(event,d){
            dehighlight(d.properties);
        })
        .on('mousemove', moveLabel);

    const desc = prefectures
        .append('desc')
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};


// COLOR INTERPOLATION

function makeColorScale(data){

    const interpolation = d3
        .scaleSequentialLog([51,6412], d3.interpolateMagma);
    return interpolation
};


// CHART

function setChart(csvData, interpolation){

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
        })
        .on('mousemove', moveLabel);

    const desc = bars
         .append('desc')
         .text('{"stroke": "none", "stroke-width": "0px"}');

    const chartTitle = chart
        .append('text')
        .attr('x', 40)
        .attr('y', 40)
        .attr('class', 'chartTitle')

    updateChart(bars, csvData.length, interpolation);

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
    const interpolation = makeColorScale(csvData);
    
    const prefectures = d3
        .selectAll('.prefectures')
        .transition()
        .duration(1000)
        .style('fill', function (d) {
        let value = d.properties[expressed];
        if (value) {
            return interpolation(d.properties[expressed]);
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
    
    updateChart(bars, csvData.length, interpolation)
}

function updateChart(bars, n, interpolation) {
    
    bars.attr('x', function(d,i) {
        return i * (chartInnerWidth / n) + leftPadding;
    })
        .attr('height', function(d,i) {
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
        .attr('y', function(d,i) {
            return yScale(parseFloat(d[expressed])); 
        })
        .style('fill', function(d) {
            let value = d[expressed];
            if (value) {
                return interpolation(value);
            } else {
                return '#ccc';
            }
        });

    const chartTitle = d3
        .select('.chartTitle')
        .text('Population Density of ' + expressed[1] + ' (people/km^2)');
}

// HIGHLIGHT

function highlight(props){
    const selected = d3
        .selectAll('.' + props.gns_name)
        .style('stroke', 'blue')
        .style('stroke-width', '2');

    setLabel(props);
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

    d3.select('.infolabel').remove();
};

// LABEL

function setLabel(props){
    const labelAttribute = '<h1>' + props[expressed] +
        '</h1><b>' + expressed + '</b>';

    const infolabel = d3
        .select('body')
        .append('div')
        .attr('class', 'infolabel')
        .attr('id', props.gns_name + '_label')
        .html(labelAttribute);

    const prefectureName = infolabel
        .append('div')
        .attr('class', 'labelname')
        .html(props.name);
};

function moveLabel(){
    const labelWidth = d3
        .select('.infolabel')
        .node()
        .getBoundingClientRect()
        .width;

    const x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    const x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    const y = event.clientY < 75 ? y2 : y1;

    d3
        .select('.infolabel')
        .style('left', x + 'px')
        .style('top', y + 'px');
};

})();
