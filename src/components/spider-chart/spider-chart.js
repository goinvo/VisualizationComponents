import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import Text from 'react-svg-text';

import * as CONSTANTS from '../../constants/chart-types';

import Polygon from '../polygon/polygon';

class SpiderChart extends Component {

  static defaultProps = {
    type: CONSTANTS.spider,
    width: 500,
    height: 500,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    maxValue: 1,
    axes: true,
    axisLabel: true,
    labelOffset: 1.1,
    wrapWidth: 60,
    levels: 4,
    levelLabel: true,
    levelsOpacity: 0.1,
    strokeWidth: 1,
    strokeColor: '#eaeaea',
    highlightStrokeColor: '#8F85FF',
    thresholdLower: 0.25,
    thresholdUpper: 0.75,
    activePointOffset: 0.025
  }

  constructor(props) {
    super(props);

    this.state = {
      data: props.data || [],
      activeNodeId: ''
    };

    this.Format = d3.format('.0%');

    if (props.data) {
      this.initConfig(props);
    }
  }

  componentWillReceiveProps(nextProps) {
    // TODO: There may be a way to refine this a bit to occur less often
    if (nextProps !== this.props) {
      this.initConfig(nextProps);
      this.setState({ data: nextProps.data });
    }
  }

  initConfig = (props) => {
    if (props.data.length) {
      // NOTE: data[0] means currently this code assumes all entries have the same axis data
      this.allAxis = props.data[0].values.map(val => val.label);  // Names of each axis
      this.maxValue = Math.max(props.maxValue, d3.max(props.data, item => {
        return d3.max(item.values, value => value.value);
      }));
    } else {
      this.allAxis = this.allAxis ? this.allAxis : []; // A.k.a. If it has been set before, then leave it. If not, use empty array as placeholder.
      this.maxValue = props.maxValue;
    }

    this.radius = Math.min((props.width / 2), (props.height / 2));  // Radius of the outermost circle
    this.rangeBottom = props.type === CONSTANTS.hgraph ? this.radius / 2.5 : 0;
    this.angleSlice = (Math.PI * 2) / this.allAxis.length;  // The width in radians of each "slice"

    this.scaleRadial = d3.scaleLinear()
      .range([this.rangeBottom, this.radius])
      .domain([0, this.maxValue]);
  }

  handlePolygonClick = (data) => () => {
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
        activeCx: this.scaleRadial(parseFloat(val.value) + this.props.activePointOffset) * Math.cos(this.angleSlice * i - Math.PI / 2),
        activeCy: this.scaleRadial(parseFloat(val.value) + this.props.activePointOffset) * Math.sin(this.angleSlice * i - Math.PI / 2),
        color: this.thresholdColor(val.value, data.color),
        activeText: this.Format(val.value).slice(0, -1)
      };
    });
  }

  thresholdColor = (value, color) => {
    if (this.props.type === CONSTANTS.hgraph) {
      return (value < this.props.thresholdLower || value > this.props.thresholdUpper) ? '#e1604f' : color;
    } else {
      return color;
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
          fill={ this.props.highlight ? this.props.highlightStrokeColor : '#97be8c' }
          fillOpacity=".75">
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

  render() {
    const sortedData = this.state.data.sort((a, b) => {
      return (a.id === this.state.activeNodeId)-(b.id === this.state.activeNodeId);
    });

    return(
      <div>
          <svg
            width={ this.props.width + this.props.margin.left + this.props.margin.right }
            height={ this.props.height + this.props.margin.top + this.props.margin.bottom }
            onClick={ this.handlePolygonClick({ id: '' }) }>
            <g
              transform={ "translate(" + ((this.props.width / 2) + this.props.margin.left) + "," + ((this.props.height / 2) + this.props.margin.top) + ")" }>
              <g className="axis-container">
                { this.renderAxes() }
              </g>
              <g className="polygons-container">
                {
                  sortedData.map(d => {
                    return (
                      <Polygon
                        key={ d.id }
                        color={ d.color }
                        points={ this.assemblePointsData(d) }
                        areaOpacity={ this.props.areaOpacity }
                        strokeWidth={ this.props.type === CONSTANTS.hgraph ? 0 : this.props.strokeWidth }
                        pointRadius={ this.props.pointRadius }
                        scoreEnabled={ true }
                        score={ d.score }
                        showScore={ this.props.scoreEnabled && (sortedData.length === 1 || d.id === this.state.activeNodeId) }
                        scoreSize={ this.props.scoreSize }
                        scoreColor={ this.props.scoreColor }
                        isActive={ d.id === this.state.activeNodeId }
                        onClick={ this.handlePolygonClick(d) }
                        />
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
