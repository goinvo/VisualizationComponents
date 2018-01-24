import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import Text from 'react-svg-text';
import NodeGroup from 'react-move/NodeGroup';

import * as CONSTANTS from '../../constants/chart-types';

class SpiderChart extends Component {

  static defaultProps = {
    type: CONSTANTS.spider,
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

  constructor(props) {
    super(props);

    this.state = {
      data: props.data || [],
      activeNodeId: ''
    };

    if (props.data) {
      this.initConfig(props.data);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.initConfig(nextProps.data);
      this.setState({ data: nextProps.data });
    }
  }

  initConfig = (data) => {
    this.Format = d3.format('.0%');

    this.maxValue = Math.max(this.props.maxValue, d3.max(data, item => {
      return d3.max(item.values, value => value.value);
    }));

    // NOTE: data[0] means currently this code assumes all entries have the same axis data
    if (data.length) {
      this.allAxis = data[0].values.map(val => val.label);  // Names of each axis
    } else {
      this.allAxis = [];
    }
    this.radius = Math.min( (this.props.width / 2), (this.props.height / 2) );  // Radius of the outermost circle
    this.rangeBottom = 0;
    if (this.props.type === CONSTANTS.hgraph) {
      this.rangeBottom = this.radius / 2.5;
    }

    this.angleSlice = (Math.PI * 2) / this.allAxis.length;  // The width in radians of each "slice"

    this.scaleRadial = d3.scaleLinear()
      .range([this.rangeBottom, this.radius])
      .domain([0, this.maxValue]);
  }

  handlePolygonClick = (data) => (e) => {
    e.stopPropagation();
    if (data.id === this.state.activeNodeId) {
      this.setState({ activeNodeId: '' });
    } else {
      this.setState({ activeNodeId: data.id });
    }
  }

  assemblePointsData = (data) => {
    return data.values.map((val, i) => {
      return {
        key: val.label.replace(/\s/g,''),
        value: val.value,
        cx: this.scaleRadial(val.value) * Math.cos(this.angleSlice * i - Math.PI / 2),
        cy: this.scaleRadial(val.value) * Math.sin(this.angleSlice * i - Math.PI / 2),
        activeX: this.scaleRadial(parseFloat(val.value) + this.props.activeDotOffset) * Math.cos(this.angleSlice * i - Math.PI / 2),
        activeY: this.scaleRadial(parseFloat(val.value) + this.props.activeDotOffset) * Math.sin(this.angleSlice * i - Math.PI / 2),
        color: data.color
      };
    });
  }

  assemblePointsDataStr = (data) => {
    let str = "";
    data.values.forEach((val, i) => {
      str += `${this.scaleRadial(val.value) * Math.cos(this.angleSlice * i - Math.PI / 2)},${this.scaleRadial(val.value) * Math.sin(this.angleSlice * i - Math.PI / 2)} `;
    });
    return str;
  }

  thresholdColor = (d) => {
    if (this.props.type === CONSTANTS.hgraph) {
      return (d.value < this.props.thresholdLower || d.value > this.props.thresholdUpper) ? 'red' : d.color;
    } else {
      return d.color;
    }
  }

  renderLevels = () => {
    if (this.props.type === CONSTANTS.spider) {
      return (
        <g
          transform={ `translate(${ -(this.props.width / 2) }, ${ -(this.props.height / 2) })` }>
          {_.times(this.props.levels, (level) => {
            const levelFactor = this.radius * ((level + 1) / this.props.levels);
            return (
              this.allAxis.map((axis, i) => {
                return (
                  <line
                    key={ axis }
                    x1={ levelFactor * (1 - Math.sin(i * this.angleSlice)) }
                    y1={ levelFactor * (1 - Math.cos(i * this.angleSlice)) }
                    x2={ levelFactor * (1 - Math.sin((i + 1) * this.angleSlice)) }
                    y2={ levelFactor * (1 - Math.cos((i + 1) * this.angleSlice)) }
                    transform={ `translate(${ this.props.width / 2 - levelFactor }, ${ this.props.height / 2 - levelFactor })` }
                    stroke={ this.props.highlight ? this.props.highlightStrokeColor : this.props.strokeColor }
                    strokeWidth={ this.props.highlight ? "2px" : "1px" }>
                  </line>
                )
              })
            )
          })}
        </g>
      )
    } else if (this.props.type === CONSTANTS.radar) {
      const levels = d3.range(1, (this.props.levels + 1)).reverse();
      return (
        levels.map((level, i) => {
          return (
            <circle
              key={ level }
              r={ this.radius / this.props.levels * level }
              fill={ this.props.highlight ? this.props.highlightStrokeColor : this.props.strokeColor }
              fillOpacity={ this.props.levelsOpacity }
              stroke={ this.props.highlight ? this.props.highlightStrokeColor : this.props.strokeColor }>
              { /* filter="url(#glow)"> */ }
            </circle>
          )
        })
      )
    } else if (this.props.type === CONSTANTS.hgraph) {
      const tau = 2 * Math.PI;
      const arc = d3.arc()
        .outerRadius(this.scaleRadial(this.props.thresholdUpper))
        .innerRadius(this.scaleRadial(this.props.thresholdLower))
        .startAngle(0)
        .endAngle(tau);
      return (
        <path
          d={ arc() }
          fill={ this.props.highlight ? this.props.highlightStrokeColor : "green" }
          fillOpacity={ this.props.highlight ? .75 : .25 }>
        </path>
      )
    }
  }

  renderLevelLabels = () => {
    const levels = d3.range(1, (this.props.levels + 1)).reverse();
    return (
      <g>
        {levels.map((level, i) => {
          return (
            <text
              key={ level }
              x="4"
              y={ (-level * this.radius / this.props.levels) }
              dy=".35em"
              fontSize="10px"
              fill="#737373">
              { this.Format(this.maxValue * level / this.props.levels) }
            </text>
          )
        })}
      </g>
    )
  }

  renderAxesParts = () => {
    return (
      <g>
        {this.allAxis.map((axis, i) => {
          return (
            <g key={ axis }>
              {
                this.props.axes ?
                  <line
                    x1={ this.scaleRadial(0) * Math.cos(this.angleSlice * i - Math.PI / 2) }
                    y1={ this.scaleRadial(0) * Math.sin(this.angleSlice * i - Math.PI / 2) }
                    x2={ this.scaleRadial(this.maxValue) * Math.cos(this.angleSlice * i - Math.PI / 2) }
                    y2={ this.scaleRadial(this.maxValue) * Math.sin(this.angleSlice * i - Math.PI / 2) }
                    stroke={ this.props.strokeColor }
                    strokeWidth="1px">
                  </line>
                : null
              }
              {
                this.props.axisLabel ?
                  <Text
                    x={ this.scaleRadial(this.maxValue * this.props.labelOffset) * Math.cos(this.angleSlice * i - Math.PI / 2) }
                    y={ this.scaleRadial(this.maxValue * this.props.labelOffset) * Math.sin(this.angleSlice * i - Math.PI / 2) }
                    dy=".35em"
                    fontSize="12px"
                    textAnchor="middle"
                    width={ this.props.wrapWidth }>
                    { axis }
                  </Text>
                : null
              }
            </g>
          )
        })}
      </g>
    )
  }

  renderAxes = () => {
    return (
      <g>
        { this.props.levels > 0 ? this.renderLevels() : null }
        { this.props.levelLabel ? this.renderLevelLabels() : null }
        { this.props.axes || this.props.axisLabel ? this.renderAxesParts() : null }
      </g>
    )
  }

  renderPolygons = (data) => {
    return (
      <NodeGroup
        data={ [data] }
        keyAccessor={ (d) => d.id }
        start={(data, index) => ({
          pointsStr: this.assemblePointsDataStr(data),
          fillOpacity: data.id === this.state.activeNodeId ? .7 : this.props.opacityArea
        })}
        enter={(data, index) => ({
          pointsStr: this.assemblePointsDataStr(data),
          fillOpacity: data.id === this.state.activeNodeId ? .7 : this.props.opacityArea
        })}
        update={(data, index) => ([
          {
            pointsStr: [this.assemblePointsDataStr(data)],
            timing: { duration: 750, ease: d3.easeExp }
          },
          {
            fillOpacity: [data.id === this.state.activeNodeId ? .7 : this.props.opacityArea],
            timing: { duration: 250, ease: d3.easeExp }
          }
        ])}
      >
        {(nodes) => {
          return (
            <g>
              {nodes.map(({ key, data, state }) => {
                return (
                  <g key={ key }>
                    <polygon
                      className="polygon"
                      points={ state.pointsStr }
                      stroke={ data.color }
                      strokeWidth={ this.props.strokeWidth }
                      fill={ data.color }
                      fillOpacity={ state.fillOpacity }
                      // filter="url(#glow)"
                      onClick={ this.handlePolygonClick(data) }>
                    </polygon>
                  </g>
                )
              })}
            </g>
          );
        }}
      </NodeGroup>
    )
  }

  renderPoints = (data) => {
    return (
      <g className="polygon__points-wrapper">
        <NodeGroup
          data={ this.assemblePointsData(data) }
          keyAccessor={ (d) => d.key }
          start={(d, index) => ({
            cx: d.cx,
            cy: d.cy,
            activeCx: d.activeX,
            activeCy: d.activeY,
            color: this.thresholdColor(d),
            activeOpacity: this.state.activeNodeId === data.id ? 1 : 0
          })}
          enter={(d, index) => ({
            cx: d.cx,
            cy: d.cy,
            activeCx: d.activeX,
            activeCy: d.activeY,
            color: this.thresholdColor(d),
            activeOpacity: this.state.activeNodeId === data.id ? 1 : 0
          })}
          update={(d, index) => ([
            {
              cx: [d.cx],
              cy: [d.cy],
              activeCx: [d.activeX],
              activeCy: [d.activeY],
              color: this.thresholdColor(d),
              timing: { duration: 750, ease: d3.easeExp }
            },
            {
              activeOpacity: [this.state.activeNodeId === data.id ? 1 : 0],
              timing: { duration: 250, ease: d3.easeExp }
            }
          ])}
        >
          {(nodes) => {
            return (
              <g>
                {nodes.map(({ key, data, state }) => {
                  return (
                    <g key={ data.key }>
                      <circle
                        className="polygon__point"
                        r={ this.props.dotRadius }
                        cx={ state.cx }
                        cy={ state.cy }
                        fill={ state.color }>
                      </circle>
                      <g opacity={ state.activeOpacity } className="polygon__active-point-wrapper">
                        <circle
                          r="20"
                          cx={ state.activeCx }
                          cy={ state.activeCy }
                          fill={ this.props.activeDotFillColor }
                          stroke={ state.color }
                          strokeWidth="1px">
                        </circle>
                        <text
                          x={ state.activeCx }
                          y={ state.activeCy }
                          fontSize="20px"
                          fill={ state.color }>
                          <tspan
                            alignmentBaseline="middle"
                            textAnchor="middle">
                            { this.Format(data.value).slice(0, -1) }
                          </tspan>
                          <tspan
                            alignmentBaseline="middle"
                            textAnchor="middle"
                            fontSize="10px">
                            %
                          </tspan>
                        </text>
                      </g>
                    </g>
                  )
                })}
              </g>
            );
          }}
        </NodeGroup>
      </g>
    );
  }

  render() {
    return(
      <div>
          <svg
            width={ this.props.width + this.props.margin.left + this.props.margin.right }
            height={ this.props.height + this.props.margin.top + this.props.margin.bottom }
            onClick={ this.handlePolygonClick({ id: '' }) }>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g
              transform={ "translate(" + ((this.props.width / 2) + this.props.margin.left) + "," + ((this.props.height / 2) + this.props.margin.top) + ")" }>
              <g className="axis-container">
                { this.renderAxes() }
              </g>
              <g className="polygons-container">
                {
                  this.state.data.map(d => {
                    return (
                      <g className="polygon-wrapper" key={ d.id }>
                        { this.renderPolygons(d) }
                        { this.renderPoints(d) }
                      </g>
                    )
                  })
                }
              </g>
            </g>
          </svg>
      </div>
    )
  }
}

export default SpiderChart;
