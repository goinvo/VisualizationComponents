import React, { Component } from 'react';
import * as d3 from 'd3';

import VisControlGroup from './components/vis-control-group/vis-control-group';
import Radar from './components/radar/radar';

import data from './data/data.json';

import './App.css';

class App extends Component {
  constructor() {
    super();

    this.state = {
      activeOrganizations: [],
      currentYear: 2018,
      activeYear: 2018,
      currentMonth: 1,
      activeMonth: 1,
      radarData: [],
      orgData: [],
    }

    this.color = d3.scaleOrdinal(d3.schemeCategory10);
  }

  componentDidMount() {
    this.mapColorsToData();
    this.assembleMainRadarData();
    this.assembleMainOrgData();
  }

  mapColorsToData = () => {
    data.forEach((item, i) => {
      item.color = this.color(i);
    });
  }

  assembleRadarDataObjectFor(orgId, year, month) {
    const orgData = data.find(orgItem => orgItem._id === orgId);
    const yearForOrg = orgData.years.find(yearItem => yearItem.year === year);
    const monthForOrg = yearForOrg.months.find(monthItem => monthItem.month === month);
    const valuesForOrg = monthForOrg.values.map(val => {
      return { value: val.value, label: val.measure };
    });
    return {
      id: orgId,
      legendLabel: orgData.organization,
      color: orgData.color,
      values: valuesForOrg
    };
  }

  assembleMainRadarData = () => {
    if (this.state.activeOrganizations.length) {
      const newData = [];
      this.state.activeOrganizations.forEach(orgId => {
        newData.push(this.assembleRadarDataObjectFor(orgId, this.state.activeYear, this.state.activeMonth));
      });

      this.setState({ radarData: newData });
    } else {
      this.setState({ radarData: [] });
    }
  }

  assembleMainOrgData = () => {
    const orgData = data.map((org, i) => {
      return {
        id: org._id,
        label: org.organization,
        data: this.assembleRadarDataObjectFor(org._id, this.state.currentYear, this.state.currentMonth)
      };
    });

    this.setState({ orgData });
  }

  handleOrgControlListChange = (controlList) => {
    const newOrgList = controlList.filter(control => control.checked).map(control => {
      return control.id;
    });

    this.updateActiveOrganizations(newOrgList);
  }

  updateActiveOrganizations = (activeOrganizations) => {
    this.setState({ activeOrganizations }, () => {
      this.assembleMainRadarData();
    });
  }

  render() {
    return (
      <div className="App">
        <div className="vis-container">
          <div className="vis-container__vis">
            <Radar data={ this.state.radarData } />
          </div>
          <div className="vis-container__side-panel">
            <VisControlGroup
              stacked={ true }
              controls={ this.state.orgData }
              onChange={ this.handleOrgControlListChange } />
          </div>
        </div>
        <div className="control-container"></div>
      </div>
    );
  }
}

export default App;
