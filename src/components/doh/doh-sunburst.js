import React, { Component } from 'react';
import * as d3 from 'd3';

import dohData from '../../data/flare.json';

class DOH extends Component {

  constructor(props) {
    super(props);

    this.initDataState();
  }

  initDataState = () => {
    this.width = 960;
    this.height = 700;
    this.radius = (Math.min(this.width, this.height) / 2) - 10;

    this.formatNumber = d3.format(",d");

    this.x = d3.scaleLinear()
      .range([0, 2 * Math.PI]);

    this.y = d3.scaleSqrt()
      .range([0, this.radius]);

    this.color = d3.scaleOrdinal(d3.schemeCategory20);

    this.partition = d3.partition();

    this.arc = d3.arc()
      .startAngle(d => Math.max(0, Math.min(2 * Math.PI, this.x(d.x0))))
      .endAngle(d => Math.max(0, Math.min(2 * Math.PI, this.x(d.x1))))
      .innerRadius(d => Math.max(0, this.y(d.y0)))
      .outerRadius(d => Math.max(0, this.y(d.y1)));

    this.root = d3.hierarchy(dohData);
    this.root.sum(d => d.size);
    this.data = this.partition(this.root);
  }

  render() {
    return(
      <div>
        <svg width={ this.width } height={ this.height }>
          <g transform={ `translate(${ this.width / 2 }, ${ this.height / 2 })` }>
          {
            this.data.descendants().map(d => {
              return (
                <path
                  stroke={ '#fff' }
                  key={ d.parent ? `${d.parent.data.name}-${d.data.name}` : d.data.name }
                  d={ this.arc(d) }
                  fill={ this.color((d.children ? d : d.parent).data.name) }
                  ></path>
              )
            })
          }
          </g>
        </svg>
      </div>
    )
  }
}

export default DOH;
