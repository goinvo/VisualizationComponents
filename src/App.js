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
      windowWidth: 0,
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
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);

    this.mapColorsToData();
    this.initDataState();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  initDataState = () => {
    // Org data
    const orgData = data.map((org, i) => {
      return {
        id: org._id,
        label: org.organization,
        checked: false,
        data: [ this.assembleRadarDataObjectFor(org._id, this.state.currentYear, this.state.currentMonth) ]
      };
    });
    orgData[0].checked = true;
    this.setState({ orgData }, () => {
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
          checked: "",
          data: this.getActiveOrganizations().map(org => {
            return this.assembleRadarDataObjectFor(org.id, dateObj.date.getFullYear(), dateObj.date.getMonth() + 1)
          })
        }
      });
      dateData[dateData.length - 2].checked = "checked";
      this.setState({ dateData })

      // Radar data
      if (this.getActiveOrganizations().length) {
        this.setState({ radarData: this.assembleRadarData() });
      } else {
        this.setState({ radarData: [this.assembleRadarDataObjectFor(data[0]._id, this.state.activeYear, this.state.activeMonth)] });
      }
    });
  }

  updateWindowDimensions = () => {
    this.setState({ windowWidth: window.innerWidth });
  }

  assembleRadarData = () => {
    return this.getActiveOrganizations().map(org => {
      return this.assembleRadarDataObjectFor(org.id, this.state.activeYear, this.state.activeMonth);
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
    this.setState({ orgData: controlList }, () => {
      const dateData = _.cloneDeep(this.state.dateData);

      dateData.forEach(dateObj => {
        dateObj.data = this.getActiveOrganizations().map(org => {
          return this.assembleRadarDataObjectFor(org.id, dateObj.date.getFullYear(), dateObj.date.getMonth() + 1);
        });
      });
      this.setState({
        radarData: this.assembleRadarData(),
        dateData
      });
    });
  }

  handleDateControlListChange = (controlList, indexOfChange) => {
    const newActiveDate = new Date(controlList[indexOfChange].date);
    const newOrgData = _.cloneDeep(this.state.orgData);

    newOrgData.forEach(org => {
      org.data = [ this.assembleRadarDataObjectFor(org.id, newActiveDate.getFullYear(), newActiveDate.getMonth() + 1) ];
    })

    this.setState({
      orgData: newOrgData,
      dateData: controlList,
      activeYear: newActiveDate.getFullYear(),
      activeMonth: newActiveDate.getMonth() + 1
    }, () => {
      this.setState({
        radarData: this.assembleRadarData()
      });
    });
  }

  getActiveOrganizations = () => {
    return this.state.orgData.filter(org => org.checked);
  }

  render() {
    const sizeBasedOnWindow = ((this.state.windowWidth / 3) * 2);
    const size = sizeBasedOnWindow > 500 ? 500 : sizeBasedOnWindow;
    return (
      <div className="App">
        <div className="vis-container">
          <div className="vis-container__main">
            <Radar
              data={ this.state.radarData }
              width={ size }
              height={ size } />
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
