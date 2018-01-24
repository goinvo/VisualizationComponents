import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import Select from 'react-select';

import * as CONSTANTS from './constants/chart-types';

import VisControlGroup from './components/vis-control-group/vis-control-group';
import SpiderChart from './components/spider-chart/spider-chart';

import data from './data/data.json';

import 'react-select/dist/react-select.css';
import './App.css';

const visTypes = [
  {
    value: CONSTANTS.spider,
    label: 'Spider'
  },
  {
    value: CONSTANTS.radar,
    label: 'Radar'
  },
  {
    value: CONSTANTS.hgraph,
    label: 'hGraph'
  }
];

class App extends Component {
  constructor() {
    super();

    this.state = {
      windowWidth: 0,
      currentYear: 2018,
      activeYear: 2018,
      currentMonth: 1,
      activeMonth: 1,
      patientData: [],
      dateData: [],
      radarData: [],
      visType: visTypes[0]
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
    const patientData = data.map((patient, i) => {
      return {
        id: patient._id,
        label: patient.patient,
        checked: false,
        data: [ this.assembleRadarDataObjectFor(patient._id, this.state.currentYear, this.state.currentMonth) ]
      };
    });
    patientData[0].checked = true;
    this.setState({ patientData }, () => {
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
          data: this.getActivepatients().map(patient => {
            return this.assembleRadarDataObjectFor(patient.id, dateObj.date.getFullYear(), dateObj.date.getMonth() + 1)
          })
        }
      });
      dateData[dateData.length - 2].checked = "checked";
      this.setState({ dateData })

      // Radar data
      if (this.getActivepatients().length) {
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
    return this.getActivepatients().map(patient => {
      return this.assembleRadarDataObjectFor(patient.id, this.state.activeYear, this.state.activeMonth);
    });
  }

  mapColorsToData = () => {
    data.forEach((item, i) => {
      item.color = this.color(i);
    });
  }

  assembleRadarDataObjectFor(patientId, year, month) {
    const patientData = data.find(patientItem => patientItem._id === patientId);
    const yearForPatient = patientData.years.find(yearItem => yearItem.year === year);
    const monthForPatient = yearForPatient.months.find(monthItem => monthItem.month === month);
    const valuesForPatient = monthForPatient.values.map(val => {
      return { value: val.value, label: val.measure };
    });

    return {
      id: patientId,
      legendLabel: patientData.patient,
      color: patientData.color,
      values: valuesForPatient
    };
  }

  handlePatientControlListChange = (controlList, indexOfChange) => {
    this.setState({ patientData: controlList }, () => {
      const dateData = _.cloneDeep(this.state.dateData);

      dateData.forEach(dateObj => {
        dateObj.data = this.getActivepatients().map(patient => {
          return this.assembleRadarDataObjectFor(patient.id, dateObj.date.getFullYear(), dateObj.date.getMonth() + 1);
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
    const newPatientData = _.cloneDeep(this.state.patientData);

    newPatientData.forEach(patient => {
      patient.data = [ this.assembleRadarDataObjectFor(patient.id, newActiveDate.getFullYear(), newActiveDate.getMonth() + 1) ];
    })

    this.setState({
      patientData: newPatientData,
      dateData: controlList,
      activeYear: newActiveDate.getFullYear(),
      activeMonth: newActiveDate.getMonth() + 1
    }, () => {
      this.setState({
        radarData: this.assembleRadarData()
      });
    });
  }

  getActivepatients = () => {
    return this.state.patientData.filter(patient => patient.checked);
  }

  handleVisSelectChange = (visType) => {
    this.setState({ visType });
  }

  render() {
    const breakpoint = 650;
    const sizeBasedOnWindow = ((this.state.windowWidth / 3) * 2);
    const size = sizeBasedOnWindow > 500 ? 500 : sizeBasedOnWindow;
    const { visType } = this.state;
    const visTypeValue = visType && visType.value;

    return (
      <div className="App">
        <div className="vis-select-container">
          <Select
            name="vis-select"
            value={ visTypeValue }
            onChange={ this.handleVisSelectChange }
            options={ visTypes }
            clearable={ false }
          />
        </div>
        <div className="vis-container">
          <div className="vis-container__main">
            <SpiderChart
              data={ this.state.radarData }
              width={ size }
              height={ size }
              type={ this.state.visType.value }
              axes={ this.state.visType.value === 'hgraph' ? false : true }
              levelLabel={ this.state.visType.value === 'hgraph' ? false : true }/>
            <div className="vis-container__controls-container">
              <div className={ `vis-container__date-controls ${sizeBasedOnWindow < breakpoint ? 'vis-container__date-controls--mobile ' : ''}` }>
                <p className="label">Time period</p>
                <VisControlGroup
                  type="radio"
                  name="date-control"
                  visType={ this.state.visType.value }
                  stacked={ sizeBasedOnWindow < breakpoint ? true : false }
                  blockLabel={ true }
                  controls={ this.state.dateData }
                  onChange={ this.handleDateControlListChange } />
              </div>
              {
                sizeBasedOnWindow < breakpoint ?
                  <div className="vis-container__patient-controls">
                    <p className="label">Patients</p>
                    <VisControlGroup
                      type="checkbox"
                      visType={ this.state.visType.value }
                      stacked={ true }
                      blockLabel={ true }
                      controls={ this.state.patientData }
                      onChange={ this.handlePatientControlListChange } />
                  </div>
                : null
              }
            </div>
          </div>
          {
            sizeBasedOnWindow >= breakpoint ?
              <div className="vis-container__side-panel">
                <p className="label">Patients</p>
                <VisControlGroup
                  type="checkbox"
                  visType={ this.state.visType.value }
                  stacked={ true }
                  controls={ this.state.patientData }
                  onChange={ this.handlePatientControlListChange } />
              </div>
            : null
          }
        </div>
      </div>
    );
  }
}

export default App;
