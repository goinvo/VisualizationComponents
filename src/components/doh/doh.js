import React, { Component } from 'react';
import * as d3 from 'd3';
import NodeGroup from 'react-move/NodeGroup';
import Text from 'react-svg-text';

import dohData from '../../data/doh.json';

const dohBarData = [
  {
    name: "Patient",
    individualBehavior: .38,
    socialCircustances: .23,
    geneticsAndBiology: .21,
    medicalCare: .11,
    environment: .07
  }
];

const treeData = dohData.children[1];

const treeTransitionDuration = 600;

const barHeight = 50;

class DOH extends Component {

  constructor(props) {
    super(props);

    this.state = {
      bars: [],
      nodes: [],
      margin: { top: 40, right: 90, bottom: 50, left: 90 },
      color: d3.scaleOrdinal(["#f9d7a7", "#b2e5e9", "#e8ed9d", "#f8cbc5", "#90eed4"])
    };

    this.state.width = 1400 - this.state.margin.left - this.state.margin.right;
    this.state.height = 800 - this.state.margin.top - this.state.margin.bottom;

    this.paths = {};
  }

  initDataState = () => {
    function separation(a, b) {
      return 1;
    }
    const treemap = d3.tree()
      .size([this.state.width, this.state.height])
      .separation(separation);

    const rawNodes = d3.hierarchy(treeData, d => d.children);
    const nodes = treemap(rawNodes);

    const stack = d3.stack()
      .keys(["individualBehavior", "socialCircustances", "geneticsAndBiology", "medicalCare", "environment"])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const bars = stack(dohBarData);

    this.barX = d3.scaleLinear()
      .rangeRound([0, this.state.width])
      .domain([0, 1]).nice();

    this.setState({
      bars: bars,
      nodes: nodes.descendants()
    });
  }

  componentDidMount = () => {
    this.initDataState()
  }

  setPathLength = (key, path) => {
    if (path) {
      this.paths[key] = d3.select(path).node().getTotalLength();
    }
  }

  renderNodeLinks = (data) => {
    return (
      <NodeGroup
        data={ data }
        keyAccessor={ d => d.data.name }
        start={(d, i) => {
          return {
            line: `M${d.parent.x},${d.parent.y} C${(d.x + d.parent.x) / 2},${d.parent.y} ${(d.x + d.parent.x) / 2},${d.y} ${d.x},${d.y}`,
            opacity: 0,
            strokeDasharray: "0 0",
            strokeDashoffset: 0
          }
        }}
        enter={(d, i) => {

        }}
        update={(d, i) => {
          const key = d.data.name;
          const length = this.paths[key] ? this.paths[key] : 0;
          return [
            {
              opacity: length > 0 ? [1] : 0,
              strokeDasharray: `${length} ${length}`,
              strokeDashoffset: length,
              timing: { duration: 1 }
            },
            {
              strokeDashoffset: [0],
              timing: { delay: d.depth * treeTransitionDuration, duration: treeTransitionDuration }
            }
          ]
        }}
        exit={(d, i) => {
          const key = d.data.name;
          const length = this.paths[key] ? this.paths[key] : 0;
          return {
            opacity: [0],
            strokeDashoffset: [length],
            timing: { delay: d.depth * treeTransitionDuration, duration: treeTransitionDuration }
          }
        }}
      >
        {(nodes) => {
          return (
            <g>
              {nodes.map(({ key, data, state }) => {
                const d = data;
                return (
                  <path
                    ref={ path => this.setPathLength(key, path) }
                    key={ d.data.name }
                    className="doh__link"
                    opacity={ state.opacity }
                    stroke={ d.data.level }
                    strokeDashoffset={ state.strokeDashoffset }
                    strokeDasharray={ state.strokeDasharray }
                    d={ state.line }>
                  </path>
                )
              })}
            </g>
          )
        }}
      </NodeGroup>
    )
  }

  renderNodes = (data) => {
    return (
      <NodeGroup
        data={ data }
        keyAccessor={ d => d.data.name }
        start={(d, i) => ({
          opacity: 0
        })}
        enter={(d, i) => ({
          opacity: [1],
          timing: { delay: i === 0 ? 0 : (d.depth + 1) * treeTransitionDuration, duration: treeTransitionDuration }
        })}
        update={(d, i) => {

        }}
        exit={(d, i) => ({
          opacity: 0
        })}
      >
        {(nodes) => {
          return (
            <g>
              {nodes.map(({ key, data, state }) => {
                const d = data;
                if (d.data.name) {
                  return (
                    <g
                      key={ d.data.name }
                      opacity={ state.opacity }
                      className={ `doh__node ${ d.children ? 'doh__node--internal' : 'doh__node--leaf' }`}
                      transform={ `translate(${d.x},${d.y})` }>
                      {/* <ellipse
                        rx="40"
                        ry="15"
                        fill="#fff"
                        filter="url(#glow)">
                      </ellipse> */}
                      <Text
                        width={80}
                        // dy={ d.data.children ? ".35em" : "50px" }
                        textAnchor="middle">
                        { d.data.name }
                      </Text>
                    </g>
                  )
                } else {
                  return (<g></g>)
                }
              })}
            </g>
          )
        }}
      </NodeGroup>
    )
  }

  render() {
    return(
      <div>
        <svg
          width={ this.state.width + this.state.margin.left + this.state.margin.right }
          height={ this.state.height + this.state.margin.top + this.state.margin.right }>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g
            className="doh__bars"
            transform={ `translate(${ this.state.margin.left }, ${ this.state.margin.top })` }>
            {
              this.state.bars.map(d => {

                return (
                  <rect
                    fill={ this.state.color(d.key) }
                    x={ this.barX(d[0][0]) }
                    y={ 0 }
                    width={ this.barX(d[0][1] - d[0][0]) }
                    height={ barHeight }>

                  </rect>
                )
              })
            }
          </g>
          <g
            className="doh__tree"
            transform={ `translate(${ this.state.margin.left }, ${ this.state.margin.top + barHeight })` }>
            <g
              className="doh__tree">
              <g className="doh__links">
                { this.renderNodeLinks(this.state.nodes.slice(1)) }
              </g>
              <g className="doh__nodes">
                { this.renderNodes(this.state.nodes) }
              </g>
            </g>
          </g>
        </svg>
      </div>
    )
  }
}

export default DOH;
