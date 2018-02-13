import React, { Component } from 'react';
import * as d3 from 'd3';

// import dohData from '../../data/flare.json';

const dohData = [
  {
    name: "Individual Behavior",
    value: .38
  },
  {
    name: "Social Circumstances",
    value: .23
  },
  {
    name: "Genetics and Biology",
    value: .21
  },
  {
    name: "Medical Care",
    value: .11
  },
  {
    name: "Environment",
    value: .07
  }
];

const treeData = {
  "name": "Top Level",
  "children": [
    {
      "name": "Level 2: A",
      "children": [
        { "name": "Son of A" },
        { "name": "Daughter of A" }
      ]
    },
    { "name": "Level 2: B" }
  ]
};

class DOH extends Component {

  constructor(props) {
    super(props);

    this.initDataState();
  }

  initDataState = () => {
    // Pie stuff
    this.width = 1200;
    this.height = 700;
    this.radius = Math.min(this.width, this.height) / 2;

    this.color = d3.scaleOrdinal(["#f9d7a7", "#b2e5e9", "#e8ed9d", "#f8cbc5", "#90eed4"]);

    this.pie = d3.pie()
      .sort(null)
      .value(d => d.value)

    this.path = d3.arc()
      .outerRadius(this.radius - 10)
      .innerRadius(0);

    // Tree stuff
    this.treeObj = {};
    this.treeObj.margin = { top: 20, right: 90, bottom: 30, left: 90 };
    this.treeObj.width = this.width / 5;
    this.treeObj.height = 100;

    this.treeObj.treemap = d3.tree()
      .size([this.treeObj.height, this.treeObj.width]);

    this.treeObj.nodes = d3.hierarchy(treeData, d => d.children);
    this.treeObj.nodes = this.treeObj.treemap(this.treeObj.nodes);
  }

  render() {
    let offsets = [];
    return(
      <div>
        <svg width={ this.width } height={ this.height }>
          <g transform={ `translate(${this.width / 2}, ${this.height / 2})` }>
            { this.pie(dohData).map(d => {
              return (
                <g
                  key={ d.data.name }
                  className="doh__arc">
                  <path
                    d={ this.path(d) }
                    fill={ this.color(d.data.name) }>
                  </path>
                </g>
              )
            }) }
          </g>
          {dohData.map((item, i) => {
            let offset;

            if (i > 0) {
              offsets[i] = ((item.value) * 360) + offsets[i - 1];
              offset = offsets[i - 1];
            } else {
              offsets[i] = ((item.value) * 360);
              offset = 0;
            }

            return (
              <g
                className="doh__tree-wrapper"
                width={ this.treeObj.width }
                height={ this.treeObj.height }
                transform={ `translate(${ this.width / 2 }, ${ this.height / 2.4 })` }>
                <g
                  className="doh__tree"
                  transform={ `rotate(${((item.value / 2) * 360) + offset - 90})`}>
                  <g className="doh__links">
                    { this.treeObj.nodes.descendants().slice(1).map(d => {
                      return (
                        <path
                          key={ d.parent ? `${d.parent.data.name}-${d.data.name}` : d.data.name }
                          className="doh__link"
                          stroke={ d.data.level }
                          d={ `M${d.y},${d.x}C${(d.y + d.parent.y) / 2},${d.x} ${(d.y + d.parent.y) / 2},${d.parent.x} ${d.parent.y},${d.parent.x}` }>
                        </path>
                      )
                    }) }
                  </g>
                  <g className="doh__nodes">
                    { this.treeObj.nodes.descendants().map((d, i) => {
                      return (
                        <g
                          key={ d.parent ? `${d.parent.data.name}-${d.data.name}` : d.data.name }
                          className={ `doh__node ${ d.children ? 'doh__node--internal' : 'doh__node--leaf' }`}
                          transform={ `translate(${d.y},${d.x})` }>
                          <circle
                            r="10"
                            stroke="steelblue"
                            fill="white">
                          </circle>
                          {
                            i !== 0 ?
                              <text
                                dy=".35em"
                                x={ d.children ? 14 * -1 : 14 }
                                textAnchor={ d.children ? 'end' : 'start' }>
                                { d.data.name }
                              </text>
                            : null
                          }
                        </g>
                      )
                    }) }
                  </g>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }
}

export default DOH;
