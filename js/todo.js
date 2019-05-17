'use strict';

/*
1. Load in the dataEveryYear.csv file instead of the data.csv file.
2. Change the code so that the scatter plot only plots data for the year 2000
3. Make another 500 by 500 SVG and append it to the body tag
4. Add a function to the onmouseover in plotData that fills out the second SVG
5. This function should plot a line graph of time (x-axis) vs life expectancy (y-axis) for the country which the user is hovering over
   Hint: there are already functions defined to make a scatter plot of fertility rate vs life expectancy. You can rewrite some of these functions to be more generalized so that you can reuse them to plot the line graph

*/

(function () {
  let svgContainer = ""; // keep SVG reference in global scope

  let location = "AUS";

  let svgScatterPlot = "";
  let allYearsData = "";

  // load data and make scatter plot after window loads
  window.onload = function () {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        allYearsData = csvData;
        makeLineGraph(location);
      })
  }

  // make scatter plot with trend line
  function makeScatterPlot() {

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = allYearsData.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = allYearsData.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxesScatterPlot(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeScatterPlotLabels();

  }

  // make title and axes labels
  function makeScatterPlotLabels() {
    svgScatterPlot.append('text')
      .attr('x', 0)
      .attr('y', 20)
      .style('font-size', '10pt')
      .text("Life Expectancy vs Fertility Rate for all countries");

    svgScatterPlot.append('text')
      .attr('x', 80)
      .attr('y', 280)
      .style('font-size', '10pt')
      .text('Fertility Rate');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 225)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy');
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Population Size Over Time by Country");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population mlns');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;


    // append data to SVG and plot as points
    svgScatterPlot.selectAll('.dot')
      .data(allYearsData)
      .enter()
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 2)
      .attr('fill', "#4286f4");
  }

  function makeLineGraph(location) {
    let locationData = allYearsData.filter((row) => row["location"] == location);
    let yearData = locationData.map((row) => +row["time"]);
    let pop_mlns = locationData.map((row) => +row["pop_mlns"]);

    let minMaxData = findMinMax(yearData, pop_mlns);
    let funcs = drawAxes(minMaxData, "time", "pop_mlns", svgContainer);

    let locations = allYearsData.map((row) => row["location"]);
    locations = [...new Set(locations)];
    // console.log(locations);
    let select = d3.select('body')
      .append('select')
      .on('change', update);

    select.selectAll('options')
      .data(locations)
      .enter()
      .append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; })
      .property("selected", function (d) {
        return d === location
      });

    plotLineGraph(funcs, locationData);

    // draw title and axes labels
    makeLabels();
  }

  function update() {
    location = d3.select(this).property('value');
    console.log(location);
    d3.selectAll("svg > *").remove();
    d3.selectAll("select").remove();
    makeLineGraph(location);
  }

  function plotLineGraph(funcs, data) {
    let line = d3.line()
      .x((d) => funcs.x(d))
      .y((d) => funcs.y(d));

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("width", "300px")
      .style("height", "300px");

    svgScatterPlot = div
      .append('svg')
      .attr('width', 300)
      .attr('height', 300);


    svgContainer.append('path')
      .datum(data)
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", 1)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY) + "px");

        div.append(makeScatterPlot());
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 5, limits.xMax + 5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 1, limits.yMin - 1]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // draw the axes and ticks
  function drawAxesScatterPlot(limits, x, y, svg) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 1, limits.xMax + 1]) // give domain buffer room
      .range([50, 250]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, 250)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 1, limits.yMin - 1]) // give domain buffer
      .range([50, 250]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
