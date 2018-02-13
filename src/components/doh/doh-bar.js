import React, { Component } from 'react';
import * as d3 from 'd3';

// import dohData from '../../data/flare.json';

import dohCSV from '../../data/doh.csv';

const dohData = [
  {
    item: "main",
    "Individual Behavior": .38,
    "Social Circumstances": .23,
    "Genetics and Biology": .21,
    "Medical Care": .11,
    "Environment": .07
  }
];

const data = [
  {month: "Q1-2016", apples: 3840, bananas: 1920, cherries: -1960, dates: -400},
  {month: "Q2-2016", apples: 1600, bananas: 1440, cherries: -960, dates: -400},
  {month: "Q3-2016", apples:  640, bananas:  960, cherries: -640, dates: -600},
  {month: "Q4-2016", apples:  320, bananas:  480, cherries: -640, dates: -400}
];

class DOH extends Component {

  constructor(props) {
    super(props);

    this.initDataState();
  }

  initDataState = () => {
    this.margin = { top: 20, right: 30, bottom: 30, left: 60 }
    this.width = 960 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    // this.series = d3.stack()
    //   .keys(["Individual Behavior", "Social Circumstances", "Genetics and Biology", "Medical Care", "Environment"])
    //   (dohData);

    this.keys = ["apples", "bananas", "cherries", "dates"];

    this.series = d3.stack()
      .keys(this.keys)
      .offset(d3.stackOffsetDiverging)
      (data);

    this.x = d3.scaleBand()
      .domain(dohData.map(d => d.item))
      .rangeRound([this.margin.left, this.width - this.margin.right])
      .padding(0.1);

    this.y = d3.scaleLinear()
      .domain([d3.min(this.series, this.stackMin), d3.max(this.series, this.stackMax)])
      .rangeRound([this.height - this.margin.bottom, this.margin.top]);

    this.z = d3.scaleOrdinal(["#f9d7a7", "#b2e5e9", "#e8ed9d", "#f8cbc5", "#90eed4"]);
  }

  stackMin = (serie) => {
    return d3.min(serie, d => d[0]);
  }

  stackMax = (serie) => {
    return d3.max(serie, d => d[1]);
  }

  render() {
    return(
      <div>
        <svg width={ this.width } height={ this.height }>
          <g transform={ `translate(${ this.margin.left }, ${ this.margin.top })` }>
            { this.series.map(d => {
              return (
                <g
                  fill={ this.z(d.key) }>
                  { data.map((obj, i) => {
                    return (
                      <rect
                        width={ this.x.bandwidth() }
                        height={ this.y(d[i][0]) - this.y(d[i][1]) }
                        x={ this.x(d[i].data.month) }
                        y={ this.y(d[i][1]) }>
                      </rect>
                    )
                  }) }
                </g>
              )
            }) }
          </g>
        </svg>
      </div>
    )
  }
}

export default DOH;
