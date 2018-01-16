import React, { Component } from 'react';
// import ReactDOM from 'react-dom';
import * as d3 from 'd3';


const setPolygonSelectedState = (polygon, selected, config) => {
  if (selected) {
    d3.selectAll(".polygon__area")
      .each(function() {
        this._selected = false;
      })
      .transition().duration(200)
      .style("fill-opacity", 0.1)
      .select(function() { return this.parentNode; }).selectAll("text")
        .attr("opacity", 0);
    polygon._selected = true;
    d3.select(polygon)
      .transition().duration(200)
        .style("fill-opacity", 0.65)
      .select(function() { return this.parentNode; }).selectAll("text")
        .attr("opacity", 1);
  } else {
    polygon._selected = false;
    d3.selectAll(".polygon__area")
      .transition().duration(200)
        .style("fill-opacity", config.opacityArea)
      .select(function() { return this.parentNode; }).selectAll("text")
        .attr("opacity", 0);
  }
}

class Radar extends Component {

  constructor() {
    super();

    this.state = {
      done: false
    };

    this.config = {
      width: 600,
      height: 600,
      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      levels: 4,
      maxValue: 1,
      labelOffset: 1.1,
      wrapWidth: 60,
      opacityArea: 0.2,
      dotRadius: 4,
      opacityCircles: 0.1,
      strokeWidth: 1,
      roundStrokes: false,
      color: d3.scaleOrdinal(d3.schemeCategory10)
    };
  }

  componentDidMount() {
    if (this.props.data !== null) {
      this.setState({
        chartRendered: true
      }, () => {
        this.renderChart(this.props.data);
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== null && this.props.data !== nextProps.data) {
      if (!this.state.chartRendered) {
        this.setState({
          chartRendered: true
        }, () => {
          this.renderChart(nextProps.data);
        });
      } else {
        if (this.props.data.length !== nextProps.data.length) {
          this.renderChart(nextProps.data);
        } else {
          this.updateChart(nextProps.data, this.config);
        }
      }
    }
  }

  // shouldComponentUpdate() {
  //   return false;
  // }

  wrapText = (text, width) => {
    text.each(function() {
      let text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.4, // ems
      y = text.attr("y"),
      x = text.attr("x"),
      dy = parseFloat(text.attr("dy")),
      tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));

        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }

  renderAxes = () => {
    const axisGrid = this.outerGroup.append("g")
      .attr("class", "axis__wrapper");

    //Draw the background circles
    axisGrid.selectAll(".axis__level")
      .data(d3.range(1, (this.config.levels + 1)).reverse())
        .enter()
      .append("circle")
      .attr("class", "axis__circle")
      .attr("r", (d, i) => this.radius / this.config.levels * d)
      .style("fill", "#CDCDCD")
      .style("stroke", "#CDCDCD")
      .style("fill-opacity", this.config.opacityCircles)
      .style("filter" , "url(#glow)");

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
      .data(d3.range(1, (this.config.levels + 1)).reverse())
        .enter()
      .append("text")
      .attr("class", "axis__label")
      .attr("x", 4)
      .attr("y", d => -d * this.radius / this.config.levels)
      .attr("dy", "0.4em")
      .style("font-size", "10px")
      .attr("fill", "#737373")
      .text((d,i) => this.Format(this.maxValue * d / this.config.levels));

    const axis = axisGrid.selectAll(".axis")
      .data(this.allAxis)
        .enter()
      .append("g")
      .attr("class", "axis");

    //Append the lines
    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => this.scaleRadial(this.maxValue * 1.1) * Math.cos(this.angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => this.scaleRadial(this.maxValue * 1.1) * Math.sin(this.angleSlice * i - Math.PI / 2))
      .attr("class", "line")
      .style("stroke", "white")
      .style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
      .attr("class", "legend")
      .style("font-size", "11px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => (this.scaleRadial(this.maxValue * this.config.labelOffset) * Math.cos(this.angleSlice * i - Math.PI / 2)))
      .attr("y", (d, i) => (this.scaleRadial(this.maxValue * this.config.labelOffset) * Math.sin(this.angleSlice * i - Math.PI / 2)))
      .text(d => d)
      .call(this.wrapText, this.config.wrapWidth);
  }

  renderPolygons = (data, config) => {
    // The radial line function
    const radarLine = d3.radialLine()
      .radius(d => this.scaleRadial(d.value))
      .angle((d,i) => i * this.angleSlice);

    if (this.config.roundStrokes) {
      radarLine.curve(d3.curveCardinalClosed);
    } else {
      radarLine.curve(d3.curveLinearClosed);
    }

    // Build the polygons and points
    this.polygonWrapper = this.outerGroup.selectAll(".polygon-wrapper")
      .data(data).enter()
      .append("g")
        .attr("class", "polygon-wrapper")
      .select(function() { return this; })
      .append("polygon")
        .attr("points", (d, j) => {
          return d.values.map((val, i) => {
            return [(this.scaleRadial(val.value) * Math.cos(this.angleSlice * i - Math.PI / 2)), (this.scaleRadial(val.value) * Math.sin(this.angleSlice * i - Math.PI / 2))].join(",");
          }).join(" ");
        })
        .attr("class", "polygon__area")
        .attr("stroke", (d, i) => this.config.color(i))
        .attr("stroke-width", this.config.strokeWidth)
        .style("fill", (d, i) => this.config.color(i))
        .style("fill-opacity", this.config.opacityArea)
        .style("filter" , "url(#glow)")
        .on("click", function(d, i) {
          setPolygonSelectedState(this, !this._selected, config);
          d3.event.stopPropagation();
        })
      .each(function(d, i) {
        d3.select(this.parentNode).selectAll("polygon__point-wrapper")
          .data(d => {
            return d.values.map(val => {
              return {
                value: val.value,
                color: config.color(i)
              };
            });
          }).enter()
          .append("g")
            .attr("class", "polygon__point-wrapper")
          .select(function() { return this; })
          .append("circle")
            .attr("class", "polygon__point")
            .attr("r", config.dotRadius)
            .attr("cx", (d, i) => config.scaleRadial(d.value) * Math.cos(config.angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => config.scaleRadial(d.value) * Math.sin(config.angleSlice * i - Math.PI / 2))
            .style("fill", (d) => d.color)
            .style("fill-opacity", 0.8)
          .select(function() { return this.parentNode; })
          .append("text")
            .attr("x", (d, i) => {
              let xPos = config.scaleRadial(d.value) * Math.cos(config.angleSlice * i - Math.PI / 2);
              if (xPos < 0) {
                xPos -= 40;
              } else {
                xPos += 7;
              }
              return xPos;
            })
            .attr("y", (d, i) => {
              let yPos = config.scaleRadial(d.value) * Math.sin(config.angleSlice * i - Math.PI / 2);
              yPos += 5;
              return yPos;
            })
            .attr("opacity", 0)
            .text(d => config.Format(d.value));
      });
  }

  renderChart = (data) => {
    d3.select(this.chart).select("svg").remove();

    this.maxValue = Math.max(this.config.maxValue, d3.max(data, item => {
      return d3.max(item.values, value => value.value);
    }));

    // NOTE: data[0] means currently this code assumes all entries have the same axis data
    this.allAxis = (data[0].values.map(function(val) { return val.label } ));  //Names of each axis
    this.radius = Math.min( (this.config.width / 2), (this.config.height / 2) );  //Radius of the outermost circle
    this.Format = d3.format('.0%');  //Percentage formatting
    this.angleSlice = (Math.PI * 2) / this.allAxis.length;  //The width in radians of each "slice"

    this.scaleRadial = d3.scaleLinear()
      .range([0, this.radius])
      .domain([0, this.maxValue]);

    this.config.scaleRadial = this.scaleRadial;
    this.config.angleSlice = this.angleSlice;
    this.config.Format = this.Format;

    this.svg = d3.select(this.chart).append("svg")
      .attr("width",  this.config.width + this.config.margin.left + this.config.margin.right)
      .attr("height", this.config.height + this.config.margin.top + this.config.margin.bottom)
      .attr("class", "radar");

    this.outerGroup = this.svg.append("g")
      .attr("transform", "translate(" + ((this.config.width / 2) + this.config.margin.left) + "," + ((this.config.height / 2) + this.config.margin.top) + ")");

    const filter = this.outerGroup.append('defs').append('filter').attr('id','glow');
    filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in','coloredBlur');
    feMerge.append('feMergeNode').attr('in','SourceGraphic');

    const config = this.config;

    this.svg.on("click", function() {
      d3.select(this).selectAll(".polygon__area")
      .each(function() {
        setPolygonSelectedState(this, false, config);
      });
      d3.event.stopPropagation();
    })

    this.renderAxes();
    this.renderPolygons(data, this.config);
  }

  updateChart = (data, config) => {
    this.polygonWrapper
    .data(data)
    .transition().duration(750)
      .attr("points", (d, j) => {
        return d.values.map((val, i) => {
          return [(this.scaleRadial(val.value) * Math.cos(this.angleSlice * i - Math.PI / 2)), (this.scaleRadial(val.value) * Math.sin(this.angleSlice * i - Math.PI / 2))].join(",");
        }).join(" ");
      })
    .each(function(d, j) {
      d3.select(this.parentNode).selectAll(".polygon__point")
        .data((oldD, i) => {
          const newValues = d.values.map(val => {
            return { value: val.value };
          });
          return newValues;
        })
        .transition().duration(750)
          .attr("cx", (d, i) => config.scaleRadial(d.value) * Math.cos(config.angleSlice * i - Math.PI / 2))
          .attr("cy", (d, i) => config.scaleRadial(d.value) * Math.sin(config.angleSlice * i - Math.PI / 2));

        d3.select(this.parentNode).selectAll("text")
          .data((oldD, i) => {
            const newValues = d.values.map(val => {
              return { value: val.value };
            });
            return newValues;
          })
          .transition().duration(750)
            .attr("x", (d, i) => {
              let xPos = config.scaleRadial(d.value) * Math.cos(config.angleSlice * i - Math.PI / 2);
              if (xPos < 0) {
                xPos -= 40;
              } else {
                xPos += 7;
              }
              return xPos;
            })
            .attr("y", (d, i) => {
              let yPos = config.scaleRadial(d.value) * Math.sin(config.angleSlice * i - Math.PI / 2);
              yPos += 5;
              return yPos;
            })
            .text(d => config.Format(d.value));
    });
  }

  render() {
    return(
      <div ref={node => this.chart = node}></div>
    )
  }
}

export default Radar;
