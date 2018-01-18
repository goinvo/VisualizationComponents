import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

import VisControlGroup from './components/vis-control-group/vis-control-group';
import Radar from './components/radar/radar';

import data from './data/data.json';

import './App.css';

class App extends Component {
  constructor() {
    super();

    this.state = {
      activeOrganizations: [ data[0]._id ],
      currentYear: 2018,
      activeYear: 2018,
      currentMonth: 1,
      activeMonth: 1,
      orgData: [],
      dateData: [],
      radarData: []
    }

    this.color = d3.scaleOrdinal(d3.schemeCategory10);
  }

  componentDidMount() {
    this.mapColorsToData();
    this.initDataState();
  }

  initDataState = () => {
    // Org data
    const orgData = data.map((org, i) => {
      return {
        id: org._id,
        label: org.organization,
        data: [ this.assembleRadarDataObjectFor(org._id, this.state.currentYear, this.state.currentMonth) ]
      };
    });
    orgData[0].checked = true;
    this.setState({ orgData });

    // Date data
    const now = new Date('2018:01');
    const nextQuarter = new Date(now);
    const lastQuarter = new Date(now);
    const lastYear = new Date(now);
    const twoYearsAgo = new Date(now);
    nextQuarter.setMonth(now.getMonth() + 3);
    lastQuarter.setMonth(now.getMonth() - 3);
    lastYear.setYear(now.getFullYear() - 1);
    twoYearsAgo.setYear(now.getFullYear() - 2);
    const dates = [
      {
        date: twoYearsAgo,
        label: 'Two Years Ago'
      },
      {
        date: lastYear,
        label: 'Last Year'
      },
      {
        date: lastQuarter,
        label: 'Last Quarter'
      },
      {
        date: now,
        label: 'Today'
      },
      {
        date: nextQuarter,
        label: 'Next Quarter'
      }
    ];
    const dateData = dates.map(dateObj => {
      return {
        id: _.uniqueId('date-'),
        date: dateObj.date,
        label: dateObj.label,
        data: this.state.activeOrganizations.map(org => {
          return this.assembleRadarDataObjectFor(org, dateObj.date.getFullYear(), dateObj.date.getMonth() + 1)
        })
      }
    });
    dateData[dateData.length - 2].checked = true;
    this.setState({ dateData })

    // Radar data
    if (this.state.activeOrganizations.length) {
      this.setState({ radarData: this.assembleRadarData() });
    } else {
      this.setState({ radarData: [this.assembleRadarDataObjectFor(data[0]._id, this.state.activeYear, this.state.activeMonth)] });
    }
  }

  assembleRadarData = () => {
    return this.state.activeOrganizations.map(orgId => {
      return this.assembleRadarDataObjectFor(orgId, this.state.activeYear, this.state.activeMonth);
    });
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

  handleOrgControlListChange = (controlList, indexOfChange) => {
    const newOrgList = controlList.filter(control => control.checked).map(control => {
      return control.id;
    });

    this.updateActiveOrganizations(newOrgList);
  }

  handleDateControlListChange = (controlList, indexOfChange) => {
    const newActiveDate = new Date(controlList[indexOfChange].date);

    this.setState({
      dateData: controlList,
      activeYear: newActiveDate.getFullYear(),
      activeMonth: newActiveDate.getMonth() + 1
    }, () => {
      this.setState({
        radarData: this.assembleRadarData()
      });
    });
  }

  updateActiveOrganizations = (activeOrganizations) => {
    this.setState({ activeOrganizations }, () => {
      const dateData = _.cloneDeep(this.state.dateData);
      dateData.forEach(dateObj => {
        dateObj.data = this.state.activeOrganizations.map(org => {
          return this.assembleRadarDataObjectFor(org, dateObj.date.getFullYear(), dateObj.date.getMonth() + 1);
        });
      });
      this.setState({
        radarData: this.assembleRadarData(),
        dateData
      });
    });
  }

  render() {
    return (
      <div className="App">
        <div className="vis-container">
          <div className="vis-container__main">
            <Radar data={ this.state.radarData } />
            <VisControlGroup
              type="radio"
              name="date-control"
              blockLabel={ true }
              controls={ this.state.dateData }
              onChange={ this.handleDateControlListChange } />
          </div>
          <div className="vis-container__side-panel">
            <VisControlGroup
              type="checkbox"
              stacked={ true }
              controls={ this.state.orgData }
              onChange={ this.handleOrgControlListChange } />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
