import React, { Component } from 'react';
import * as d3 from 'd3';

import NodeGroup from 'react-move/NodeGroup';

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
    this.initConfig(nextProps.data);

    if (nextProps.data !== this.props.data) {
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
      this.allAxis = data[0].values.map(val => val.label);  //Names of each axis
    } else {
      this.allAxis = [];
    }
    this.radius = Math.min( (this.props.width / 2), (this.props.height / 2) );  //Radius of the outermost circle
    this.rangeBottom = 0;
    if (this.props.type === 'hgraph') {
      this.rangeBottom = this.radius / 2.5;
    }
    // const Format = d3.format('.0%');  //Percentage formatting
    this.angleSlice = (Math.PI * 2) / this.allAxis.length;  //The width in radians of each "slice"

    this.scaleRadial = d3.scaleLinear()
      .range([this.rangeBottom, this.radius])
      .domain([0, this.maxValue]);
  }

  handlePolygonClick = (data) => (e) => {
    if (data.id === this.state.activeNodeId) {
      this.setState({ activeNodeId: '' });
    } else {
      this.setState({ activeNodeId: data.id });
    }
  }

  assemblePoints = (data) => {
    return data.values.map((val, i) => {
      return {
        key: val.label.replace(/\s/g,''),
        x: this.scaleRadial(val.value) * Math.cos(this.angleSlice * i - Math.PI / 2),
        y: this.scaleRadial(val.value) * Math.sin(this.angleSlice * i - Math.PI / 2),
        color: data.color
      };
    });
  }

  assembleActivePoints = (data) => {
    return data.values.map((val, i) => {
      return {
        key: val.label.replace(/\s/g,''),
        value: val.value,
        x: this.scaleRadial(parseFloat(val.value) + this.props.activeDotOffset) * Math.cos(this.angleSlice * i - Math.PI / 2),
        y: this.scaleRadial(parseFloat(val.value) + this.props.activeDotOffset) * Math.sin(this.angleSlice * i - Math.PI / 2),
        color: data.color
      };
    });
  }

  assemblePointsStr = (data) => {
    let str = "";
    data.values.forEach((val, i) => {
      str += `${this.scaleRadial(val.value) * Math.cos(this.angleSlice * i - Math.PI / 2)},${this.scaleRadial(val.value) * Math.sin(this.angleSlice * i - Math.PI / 2)} `;
    });
    return str;
  }

  renderPolygons = (data) => {
    return (
      <NodeGroup
        data={ [data] }
        keyAccessor={ (d) => d.id }
        start={(data, index) => ({
          pointsStr: this.assemblePointsStr(data),
          fillOpacity: data.id === this.state.activeNodeId ? .7 : this.props.opacityArea
        })}
        enter={(data, index) => ({
          pointsStr: this.assemblePointsStr(data),
          fillOpacity: data.id === this.state.activeNodeId ? .7 : this.props.opacityArea
        })}
        update={(data, index) => ([
          {
            pointsStr: [this.assemblePointsStr(data)],
            timing: { duration: 750, ease: d3.easeExp }
          },
          {
            fillOpacity: data.id === this.state.activeNodeId ? .7 : this.props.opacityArea,
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
                      filter="url(#glow)"
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
          data={ this.assemblePoints(data) }
          keyAccessor={ (d) => d.key }
          start={(data, index) => ({
            cx: data.x,
            cy: data.y
          })}
          enter={(data, index) => ({
            cx: data.x,
            cy: data.y
          })}
          update={(data, index) => ({
            cx: [data.x],
            cy: [data.y],
            timing: { duration: 750, ease: d3.easeExp }
          })}
        >
          {(nodes) => {
            return (
              <g>
                {nodes.map(({ key, data, state }) => {
                  return (
                    <circle
                      key={ data.key }
                      className="polygon__point"
                      r="4"
                      cx={ state.cx }
                      cy={ state.cy }
                      fill={ data.color }>
                    </circle>
                  )
                })}
              </g>
            );
          }}
        </NodeGroup>
      </g>
    );
  }

  renderActivePoints = (data) => {
    return (
      <g className="polygon__active-points-wrapper">
        <NodeGroup
          data={ this.assembleActivePoints(data) }
          keyAccessor={ (d) => d.key }
          start={(d, index) => ({
            cx: d.x,
            cy: d.y,
            opacity: this.state.activeNodeId === data.id ? 1 : 0,
          })}
          enter={(d, index) => ({
            cx: d.x,
            cy: d.y,
            opacity: this.state.activeNodeId === data.id ? 1 : 0
          })}
          update={(d, index) => ([
            {
              cx: [d.x],
              cy: [d.y],
              timing: { duration: 750, ease: d3.easeExp }
            },
            {
              opacity: [this.state.activeNodeId === data.id ? 1 : 0],
              timing: { duration: 250, ease: d3.easeExp }
            }
          ])}
        >
          {(nodes) => {
            return (
              <g>
                {nodes.map(({ key, data, state }) => {
                  return (
                    <g key={ data.key } opacity={ state.opacity }>
                      <circle
                        className="polygon__point"
                        r="20"
                        cx={ state.cx }
                        cy={ state.cy }
                        fill={ this.props.activeDotFillColor }
                        stroke={ data.color }
                        strokeWidth="1px">
                      </circle>
                      <text
                        x={ state.cx }
                        y={ state.cy }
                        fontSize="20px"
                        fill={ data.color }>
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
            height={ this.props.height + this.props.margin.top + this.props.margin.bottom }>
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
              <g className="polygons-container">
                {
                  this.state.data.map(d => {
                    return (
                      <g className="polygon-wrapper" key={ d.id }>
                        { this.renderPolygons(d) }
                        { this.renderPoints(d) }
                        { this.renderActivePoints(d) }
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

export default Radar;
