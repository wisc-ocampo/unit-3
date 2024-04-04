// Week 9
window.onload = setMap();

function setMap(){
    // projection
    const width = 460;
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

    let promises = [
        d3.csv('data/JapanPop.csv'),
        d3.json('data/japan_minTable.topojson')
    ];
    Promise.all(promises).then(callback);

    function callback(data){
        const csvData = data[0];
        const japan = data[1];

        let japanPrefectures = topojson.feature(japan, japan.objects.japan_minTable).features;
        console.log(japanPrefectures);
        
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
       
        let prefectures = map.selectAll('.prefectures')
            .data(japanPrefectures)
            .enter()
            .append('path')
            .attr('class', function(d){
                return 'prefectures ' + d.properties.gns_name;
            })
            .attr('d', path);
    };
};
