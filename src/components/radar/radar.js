import React, { Component } from 'react';
import * as d3 from 'd3';


const setPolygonSelectedState = (polygon, selected, config) => {
  if (selected) {
    d3.selectAll(config.chart.querySelectorAll(".polygon__area"))
      .each(function() {
        this._selected = false;
      })
      .transition().duration(200)
      .style("fill-opacity", 0.1)
      .style("stroke-opacity", 0.25)
      .select(function() { return this.parentNode; }).selectAll(".polygon__active-point-wrapper")
        .attr("opacity", 0);
    polygon._selected = true;
    d3.select(polygon)
      .transition().duration(200)
        .style("fill-opacity", 0.5)
        .style("stroke-opacity", 1)
      .select(function() { return this.parentNode; }).selectAll(".polygon__active-point-wrapper")
        .attr("opacity", 1);
  } else {
    polygon._selected = false;
    d3.selectAll(config.chart.querySelectorAll(".polygon__area"))
      .transition().duration(200)
        .style("fill-opacity", config.opacityArea)
        .style("stroke-opacity", 1)
      .select(function() { return this.parentNode; }).selectAll(".polygon__active-point-wrapper")
        .attr("opacity", 0);
  }
}

const thresholdColor = (d, config) => {
  if (config.visType === 'hgraph') {
    return (d.value < config.thresholdLower || d.value > config.thresholdUpper) ? 'red' : d.color;
  } else {
    return d.color;
  }
}

class Radar extends Component {

  static defaultProps = {
    type: 'radar',
    width: 500,
    height: 500,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    axes: true,
    axisLabel: true,
    levels: 4,
    levelLabel: true,
    maxValue: 1,
    labelOffset: 1.1,
    activeDotOffset: 0.025,
    activeDotFillColor: '#fff',
    wrapWidth: 60,
    opacityArea: 0.25,
    dotRadius: 4,
    levelsOpacity: 0.1,
    strokeWidth: 1,
    strokeColor: '#eaeaea',
    highlightStrokeColor: '#8F85FF',
    canFocus: true,
    color: d3.scaleOrdinal(d3.schemeCategory10),
    thresholdLower: 0.25,
    thresholdUpper: 0.75
  }

  constructor() {
    super();

    this.state = {
      chartRendered: false
    };

    this.config = {};
  }

  componentDidMount() {
    if (this.props.data.length) {
      this.setState({
        chartRendered: true
      }, () => {
        this.renderChart(this.props.data);
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data.length && this.props.data !== nextProps.data) {
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
    } else if (this.state.chartRendered && nextProps.data.length < 1) {
      this.outerGroup.select(".polygon-wrapper").remove();
    } else if (this.state.chartRendered && nextProps.width !== this.props.width) {
      this.renderChart(nextProps.data);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.highlight !== this.props.highlight) {
      this.renderChart(this.props.data);
    } else if (prevProps.type !== this.props.type) {
      this.renderChart(this.props.data);
    }
  }

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
    this.outerGroup.select(".axis__wrapper").remove();
    const axisGrid = this.outerGroup.append("g")
      .attr("class", "axis__wrapper");

    if (this.props.levels > 0) {
      if (this.props.type === 'radar') {
        axisGrid.selectAll(".axis__level")
          .data(d3.range(1, (this.props.levels + 1)).reverse())
            .enter()
          .append("circle")
          .attr("class", "axis__circle")
          .attr("r", (d, i) => this.radius / this.props.levels * d)
          .style("fill", this.props.highlight ? this.props.highlightStrokeColor : this.props.strokeColor)
          .style("stroke", this.props.highlight ? this.props.highlightStrokeColor : this.props.strokeColor)
          .style("fill-opacity", this.props.levelsOpacity)
          .style("filter" , "url(#glow)");
      } else if (this.props.type === 'spider') {
        const levelWrapper = axisGrid.append("g")
          .attr("class", "level-wrapper")
          .attr("transform", "translate(" + (-(this.props.width / 2)) + ", " + (-(this.props.height / 2)) + ")");

        for (var level = 0; level < this.props.levels; level++) {
          let levelFactor = this.radius * ((level + 1) / this.props.levels);

          levelWrapper.selectAll(".axis__level")
            .data(this.allAxis).enter()
            .append("svg:line").classed("level-lines", true)
            .attr("x1", (d, i) => levelFactor * (1 - Math.sin(i * this.angleSlice)))
            .attr("y1", (d, i) => levelFactor * (1 - Math.cos(i * this.angleSlice)))
            .attr("x2", (d, i) => levelFactor * (1 - Math.sin((i + 1) * this.angleSlice)))
            .attr("y2", (d, i) => levelFactor * (1 - Math.cos((i + 1) * this.angleSlice)))
            .attr("transform", "translate(" + (this.props.width / 2 - levelFactor) + ", " + (this.props.height / 2 - levelFactor) + ")")
            .attr("stroke", this.props.highlight ? this.props.highlightStrokeColor : this.props.strokeColor)
            .attr("stroke-width", this.props.highlight ? "2px" : "1px");
        }
      } else if (this.props.type === 'hgraph') {
        const tau = 2 * Math.PI;
        const arc = d3.arc()
          .outerRadius(this.scaleRadial(this.props.thresholdUpper))
          .innerRadius(this.scaleRadial(this.props.thresholdLower))
          .startAngle(0)
          .endAngle(tau);

        axisGrid.append("path")
          .attr("class", "axis__threshold")
          .attr("d", arc)
          .style("fill", this.props.highlight ? this.props.highlightStrokeColor : "green")
          .style("fill-opacity", this.props.highlight ? .75 : .25);
      }

      if (this.props.levelLabel) {
        //Text indicating at what % each level is
        axisGrid.selectAll(".axisLabel")
          .data(d3.range(1, (this.props.levels + 1)).reverse())
            .enter()
          .append("text")
          .attr("class", "axis__label")
          .attr("x", 4)
          .attr("y", d => -d * this.radius / this.props.levels)
          .attr("dy", "0.4em")
          .style("font-size", "10px")
          .attr("fill", "#737373")
          .text((d, i) => this.Format(this.maxValue * d / this.props.levels));
      }
    }

    if (this.props.axes || this.props.axisLabel) {
      const axis = axisGrid.selectAll(".axis")
        .data(this.allAxis)
          .enter()
        .append("g")
        .attr("class", "axis");

      //Append the lines
      if (this.props.axes) {
        axis.append("line")
          .attr("x1", (d, i) => this.scaleRadial(0) * Math.cos(this.angleSlice * i - Math.PI / 2))
          .attr("y1", (d, i) => this.scaleRadial(0) * Math.sin(this.angleSlice * i - Math.PI / 2))
          .attr("x2", (d, i) => this.scaleRadial(this.maxValue) * Math.cos(this.angleSlice * i - Math.PI / 2))
          .attr("y2", (d, i) => this.scaleRadial(this.maxValue) * Math.sin(this.angleSlice * i - Math.PI / 2))
          .attr("class", "line")
          .style("stroke", this.props.strokeColor)
          .style("stroke-width", "1px");
      }

      if (this.props.axisLabel) {
        //Append the labels at each axis
        axis.append("text")
          .attr("class", "legend")
          .style("font-size", "11px")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("x", (d, i) => (this.scaleRadial(this.maxValue * this.props.labelOffset) * Math.cos(this.angleSlice * i - Math.PI / 2)))
          .attr("y", (d, i) => (this.scaleRadial(this.maxValue * this.props.labelOffset) * Math.sin(this.angleSlice * i - Math.PI / 2)))
          .text(d => d)
          .call(this.wrapText, this.props.wrapWidth);
      }
    }
  }

  renderPolygons = (data, config) => {
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
        .attr("stroke", (d, i) => d.color || this.props.color(i))
        .attr("stroke-width", this.props.strokeWidth)
        .style("fill", (d, i) => d.color || this.props.color(i))
        .style("fill-opacity", this.props.opacityArea)
        .style("filter" , "url(#glow)")
        .on("click", function(d, i) {
          if (config.canFocus) {
            setPolygonSelectedState(this, !this._selected, config);
          }
          d3.event.stopPropagation();
        })
      // .select(function() { return this.parentNode; })
      //   .append("text")
      //     .attr("x", 0)
      //     .attr("y", 0)
      //     .attr("alignment-baseline", "middle")
      //     .style("text-anchor", "middle")
      //     .style("font-size", "68px")
      //     .style("fill", d => d.color)
      //     .text("100")
      .each(function(d, i) {
        d3.select(this.parentNode).selectAll("polygon__point-wrapper")
          .data(d => {
            return d.values.map(val => {
              return {
                value: val.value,
                color: d.color || config.color(i)
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
            .style("fill", (d) => thresholdColor(d, config))
            .style("fill-opacity", 1)
          .select(function() { return this.parentNode; })
          .append("g")
            .attr("class", "polygon__active-point-wrapper")
            .attr("opacity", 0)
          .append("circle")
            .attr("class", "polygon__active-point")
            .attr("r", 20)
            .attr("cx", (d, i) => config.scaleRadial(parseFloat(d.value) + config.activeDotOffset) * Math.cos(config.angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => config.scaleRadial(parseFloat(d.value) + config.activeDotOffset) * Math.sin(config.angleSlice * i - Math.PI / 2))
            .style("fill", config.activeDotFillColor)
            .style("stroke", (d) => thresholdColor(d, config))
            .style("stroke-width", "1px")
          .select(function() { return this.parentNode; })
          .append("text")
            .attr("x", (d, i) => config.scaleRadial(parseFloat(d.value) + config.activeDotOffset) * Math.cos(config.angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => config.scaleRadial(parseFloat(d.value) + config.activeDotOffset) * Math.sin(config.angleSlice * i - Math.PI / 2))
            .style("font-size", "20px")
            .style("fill", (d) => thresholdColor(d, config))
          .append("svg:tspan")
            .attr("class", "polygon__active-point-percentage")
            .attr("alignment-baseline", "middle")
            .style("text-anchor", "middle")
            .text(d => config.Format(d.value).slice(0, -1))
          .select(function() { return this.parentNode; })
          .append("svg:tspan")
            .attr("class", "polygon__active-point-percent-sign")
            .style("font-size", "10px")
            .attr("alignment-baseline", "mathematical")
            .text("%");
      });
  }

  renderChart = (data) => {
    d3.select(this.chart).select("svg").remove();

    this.maxValue = Math.max(this.props.maxValue, d3.max(data, item => {
      return d3.max(item.values, value => value.value);
    }));

    // NOTE: data[0] means currently this code assumes all entries have the same axis data
    this.allAxis = (data[0].values.map(function(val) { return val.label } ));  //Names of each axis
    this.radius = Math.min( (this.props.width / 2), (this.props.height / 2) );  //Radius of the outermost circle
    this.rangeBottom = 0;
    if (this.props.type === 'hgraph') {
      this.rangeBottom = this.radius / 2.5;
    }
    this.Format = d3.format('.0%');  //Percentage formatting
    this.angleSlice = (Math.PI * 2) / this.allAxis.length;  //The width in radians of each "slice"

    this.scaleRadial = d3.scaleLinear()
      .range([this.rangeBottom, this.radius])
      .domain([0, this.maxValue]);

    // Use config to pass along items needed for functions that lose the component level scope
    this.config.chart = this.chart;
    this.config.scaleRadial = this.scaleRadial;
    this.config.angleSlice = this.angleSlice;
    this.config.Format = this.Format;
    this.config.visType = this.props.type;
    this.config.opacityArea = this.props.opacityArea;
    this.config.dotRadius = this.props.dotRadius;
    this.config.canFocus = this.props.canFocus;
    this.config.color = this.props.color;
    this.config.activeDotOffset = this.props.activeDotOffset;
    this.config.strokeColor = this.props.strokeColor;
    this.config.highlightStrokeColor = this.props.highlightStrokeColor;
    this.config.activeDotFillColor = this.props.activeDotFillColor;
    this.config.thresholdLower = this.props.thresholdLower;
    this.config.thresholdUpper = this.props.thresholdUpper;

    this.svg = d3.select(this.chart).append("svg")
      .attr("width",  this.props.width + this.props.margin.left + this.props.margin.right)
      .attr("height", this.props.height + this.props.margin.top + this.props.margin.bottom)
      .attr("class", "radar");

    this.outerGroup = this.svg.append("g")
      .attr("transform", "translate(" + ((this.props.width / 2) + this.props.margin.left) + "," + ((this.props.height / 2) + this.props.margin.top) + ")");

    const filter = this.outerGroup.append('defs').append('filter').attr('id','glow');
    filter.append('feGaussianBlur').attr('stdDeviation','2').attr('result','coloredBlur');
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
    this.polygonWrapper.data(data)
    .transition().duration(750)
      .attr("points", (d, j) => {
        return d.values.map((val, i) => {
          return [(this.scaleRadial(val.value) * Math.cos(this.angleSlice * i - Math.PI / 2)), (this.scaleRadial(val.value) * Math.sin(this.angleSlice * i - Math.PI / 2))].join(",");
        }).join(" ");
      })
    .each(function(d, j) {
      const newData = d.values.map(val => {
        return { value: val.value, color: d.color };
      });

      d3.select(this.parentNode).selectAll(".polygon__point")
        .data(newData)
        .transition().duration(750)
          .style("fill", (d) => thresholdColor(d, config))
          .attr("cx", (d, i) => config.scaleRadial(d.value) * Math.cos(config.angleSlice * i - Math.PI / 2))
          .attr("cy", (d, i) => config.scaleRadial(d.value) * Math.sin(config.angleSlice * i - Math.PI / 2));

      d3.select(this.parentNode).selectAll(".polygon__active-point")
        .data(newData)
        .transition().duration(750)
          .style("stroke", (d) => thresholdColor(d, config))
          .attr("cx", (d, i) => config.scaleRadial(parseFloat(d.value) + config.activeDotOffset) * Math.cos(config.angleSlice * i - Math.PI / 2))
          .attr("cy", (d, i) => config.scaleRadial(parseFloat(d.value) + config.activeDotOffset) * Math.sin(config.angleSlice * i - Math.PI / 2));

      d3.select(this.parentNode).selectAll(".polygon__active-point-wrapper text")
        .data(newData)
        .transition().duration(750)
          .style("fill", (d) => thresholdColor(d, config))
          .attr("x", (d, i) => config.scaleRadial(parseFloat(d.value) + config.activeDotOffset) * Math.cos(config.angleSlice * i - Math.PI / 2))
          .attr("y", (d, i) => config.scaleRadial(parseFloat(d.value) + config.activeDotOffset) * Math.sin(config.angleSlice * i - Math.PI / 2));

      d3.select(this.parentNode).selectAll(".polygon__active-point-percentage")
        .data(newData)
          .text(d => config.Format(d.value).slice(0, -1));
    });
  }

  render() {
    return(
      <div ref={node => this.chart = node} className="vis vis--radar"></div>
    )
  }
}

export default Radar;
