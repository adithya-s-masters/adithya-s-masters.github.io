const margins = {top: 50, bottom: 50, left: 100, right: 50};

const width = window.innerWidth - (margins.left + margins.right);
const height = (window.innerHeight * 0.75) - (margins.top + margins.bottom);

let scene = 1;
let data_arr = []

const tooltip = d3.select("#tooltip");
let svg = d3.select('#chart').append('svg').attr('width', window.innerWidth).attr('height', window.innerHeight*0.75).append('g').attr('transform', `translate(${margins.left}, ${margins.top})`);

d3.csv('https://raw.githubusercontent.com/adithya-s-masters/adithya-s-masters.github.io/main/data.csv').then(data => {
   data.forEach(elem => {
        elem.country = elem.country;
        elem.year = elem.year;
        elem.co2_emissions_mt = +elem.co2_emissions_mt;
    });
    data_arr = data;
    drawScene(scene);
});

d3.select("#next").on("click", () =>  {
    if (scene < 3) scene++;
    console.log(scene);
    drawScene(scene);
});

d3.select("#prev").on("click", () =>  {
    if (scene > 1) scene--;
    console.log(scene);
    drawScene(scene);
});

function drawScene(sceneNum) {
    d3.select("#country-select").remove(); 
    drawPlot(data_arr, sceneNum);
}

function drawPlot(data, sceneNum) {
    const color = d3.scaleOrdinal().domain([...new Set(data.map(d => d.country))]).range(d3.schemeCategory10);

    if (sceneNum == 1) {
        svg.selectAll('*').remove(); // clear svg elements
        addAnnotation("CO2 Emissions in Metric Tons from 2000-2020", width/2, -margins.top/5)

        const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, width]);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.co2_emissions_mt)]).range([height, 0]);

        svg.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
        svg.append('g').call(d3.axisLeft(y));
        
        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.year))
            .attr('cy', d => y(d.co2_emissions_mt))
            .attr('r', 5)
            .attr('fill', d => color(d.country))

        const countries = d3.group(data, d => d.country);
        
        countries.forEach((values, country) => {
            values.sort((a, b) => a.year - b.year);

            svg.append('path')
                .datum(values)
                .attr('fill', 'none')
                .attr('stroke', color(country))
                .attr('stroke-width', 1.5)
                .attr('d', d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.co2_emissions_mt))
                );
        });

        addLegend(svg, color, [...countries.keys()]);
    } else if (sceneNum == 2) {
        svg.selectAll('*').remove(); // clear svg elements

        addAnnotation("CO2 Emissions: Developed vs. Developing Countries (2000-2020)", width/2, -margins.top/5);

        const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, width]);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.co2_emissions_mt)]).range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));
        svg.append('g')
            .call(d3.axisLeft(y));

        const industrialized = ["USA", "Germany"];
        const rapidlyIndustrializing = ["China", "India", "Brazil"];

        const groupColor = d3.scaleOrdinal()
            .domain(["industrialized", "rapidlyIndustrializing"])
            .range(["#db2d95", "#36691a"]); 

        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.year))
            .attr('cy', d => y(d.co2_emissions_mt))
            .attr('r', 5)
            .attr('fill', d => {
                if (industrialized.includes(d.country)) return groupColor("industrialized");
                if (rapidlyIndustrializing.includes(d.country)) return groupColor("rapidlyIndustrializing");
                return groupColor("other");
            });

        const countries = d3.group(data, d => d.country);

        countries.forEach((values, country) => {
            values.sort((a, b) => a.year - b.year);

            let group = "other";
            if (industrialized.includes(country)) group = "industrialized";
            else if (rapidlyIndustrializing.includes(country)) group = "rapidlyIndustrializing";

            svg.append('path')
                .datum(values)
                .attr('fill', 'none')
                .attr('stroke', groupColor(group))
                .attr('stroke-width', group === "other" ? 1.5 : 2.5)
                .attr('opacity', group === "other" ? 0.4 : 1)
                .attr('d', d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.co2_emissions_mt))
                );
        });

        const legendData = [
            { label: "Developed Countries", color: groupColor("industrialized") },
            { label: "Developing Countries", color: groupColor("rapidlyIndustrializing") },
        ];

        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 200}, 0)`);

        legend.selectAll('rect')
            .data(legendData)
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', (d, i) => i * 20 + 50)
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', d => d.color);

        legend.selectAll('text')
            .data(legendData)
            .enter()
            .append('text')
            .attr('x', 20)
            .attr('y', (d, i) => i * 20 + 65)
            .text(d => d.label)
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');
        
        const milestones = [
            { year: 2005, label: "Kyoto Protocol Enforced" },
            { year: 2008, label: "EU Climate and Energy Package" },
            { year: 2015, label: "Paris Agreement" },
            { year: 2019, label: "Global Climate Strikes" }
        ];

        milestones.forEach(milestone => {
            // Vertical line
            svg.append('line')
                .attr('x1', x(milestone.year))
                .attr('x2', x(milestone.year))
                .attr('y1', 0)
                .attr('y2', height)
                .attr('stroke', 'red')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4 4');

            // Annotation text
            svg.append('text')
                .attr('x', x(milestone.year) - 100)
                .attr('y', 30)
                .text(milestone.label)
                .style('font-size', '12px')
                .style('fill', 'red')
                .style('font-weight', 'bold')
                .attr('transform', `rotate(-90, ${x(milestone.year)}, 20)`) // rotate for clarity
                .style('text-anchor', 'end');
        });
    } else if (sceneNum == 3) {
        svg.selectAll('*').remove(); // clear svg elements
        addAnnotation("CO2 Emissions in Metric Tons from 2000-2020", width/2, -margins.top/5)

        const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, width]);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.co2_emissions_mt)]).range([height, 0]);

        svg.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
        svg.append('g').call(d3.axisLeft(y));
        
        const countries = d3.group(data, d => d.country);

        d3.select("#country-select").remove();
        const dropdown = d3.select("#chart")
            .append("select")
            .attr("id", "country-select")
            .style("margin-bottom", "10px");

        dropdown.append("option").attr("value", "all").text("Show All");
        [...countries.keys()].forEach(country => {
            dropdown.append("option")
                .attr("value", country)
                .text(country);
        });

        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', d => `dot dot-${d.country.replace(/\s+/g, '_')}`)
            .attr('cx', d => x(d.year))
            .attr('cy', d => y(d.co2_emissions_mt))
            .attr('r', 5)
            .attr('fill', d => color(d.country))
            .on("mouseover", (event, d) => setTooltipVisibility(event, d, true))
            .on('mouseout', (event, d) => setTooltipVisibility(event, d, false));

        countries.forEach((values, country) => {
            values.sort((a, b) => a.year - b.year);

            svg.append('path')
                .datum({ key: country, values })
                .attr('class', `country-line line-${country.replace(/\s+/g, '_')}`)
                .attr('fill', 'none')
                .attr('stroke', color(country))
                .attr('stroke-width', 1.5)
                .attr('d', d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.co2_emissions_mt))
                    (values)
                );
        });

        dropdown.on("change", function () {
            const selectedCountry = this.value;

            if (selectedCountry === "all") {
                svg.selectAll(".country-line").attr("opacity", 1);
                svg.selectAll(".dot").attr("opacity", 1);
            } else {
                svg.selectAll(".country-line")
                    .attr("opacity", d => d.key === selectedCountry ? 1 : 0.1);

                svg.selectAll(".dot").attr("opacity", 0.1);
                svg.selectAll(`.dot-${selectedCountry.replace(/\s+/g, '_')}`).attr("opacity", 1);
            }
        });
        addLegend(svg, color, [...countries.keys()]);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#fff")
            .text("Tip: Hover over points to see tooltips. Use the dropdown below to filter by country.");
    }
}

function addAnnotation(text, x, y) {
    const annotations = [{
        note: { label: text },
        x: x,
        y: y,
        dy: 0,
        dx: 0
    }];

    const makeAnnotations = d3.annotation().annotations(annotations);
    svg.append("g").call(makeAnnotations);
}

function setTooltipVisibility(event, data, visible) {
    if (visible) {
        tooltip.transition().duration(250).style('opacity', .9);
        tooltip.html(`Year: ${data.year}<br/>CO2 Emissions (metric tons): ${data.co2_emissions_mt}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    } else {
        tooltip.transition().duration(250).style('opacity', 0);
    }
}

function addLegend(svg, color, countriesList) {
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 75}, 0)`);

    legend.selectAll('rect')
        .data(countriesList)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 20 + 20)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => color(d));

    legend.selectAll('text')
        .data(countriesList)
        .enter()
        .append('text')
        .attr('x', 20)
        .attr('y', (d, i) => i * 20 + 30)
        .text(d => d)
        .style('font-size', '12px')
        .attr('alignment-baseline', 'middle');
}







