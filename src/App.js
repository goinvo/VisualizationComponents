import React, { Component } from 'react';

import Radar from './components/radar/radar';

import data from './data/data.json';

import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor() {
    super();

    this.state = {
      activeOrganizations: ['apple', 'banana'],
      activeYear: 2018,
      activeMonth: 1,
      radarData: null,
    }
  }

  componentDidMount() {
    this.assembleRadarData();

    // setTimeout(() => {
    //   this.setState({
    //     activeOrganizations: ['apple', 'banana', 'peach'],
    //   }, () => {
    //     this.assembleRadarData();
    //
    //     setTimeout(() => {
    //       this.setState({
    //         activeMonth: 2,
    //       }, () => {
    //         this.assembleRadarData();
    //       })
    //     }, 2000)
    //   })
    // }, 1000)
  }

  assembleRadarData = () => {
    if (this.state.activeOrganizations.length) {
      const newData = [];
      this.state.activeOrganizations.forEach(orgName => {
        const org = data.find(org => org.organization === orgName);
        const yearForOrg = org.years.find(year => year.year === this.state.activeYear);
        const monthForOrg = yearForOrg.months.find(month => month.month === this.state.activeMonth);
        const valuesForOrg = monthForOrg.values.map(val => {
          return { value: val.value, label: val.measure };
        });
        newData.push({
          legendLabel: org.organization,
          values: valuesForOrg
        });
      });
      this.setState({ radarData: newData });
    } else {
      this.setState({ radarData: null });
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <Radar data={ this.state.radarData } />
      </div>
    );
  }
}

export default App;
