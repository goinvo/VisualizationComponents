import React, { Component } from 'react';

import SpiderChart from '../spider-chart/spider-chart';

class VisControl extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isChecked: props.checked || false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.checked !== this.props.checked) {
      this.setState({ isChecked: nextProps.checked });
    }
  }

  handleChange = (e) => {
    const target = e.target;
    const value = target.checked;

    this.setState({ isChecked: value }, () => {
      this.forceUpdate();
    });
    this.props.onChange(value, this.props.id);
  }

  render() {
    return (
      <label className={`vis-control ${ this.props.blockLabel ? 'vis-control--block-label' : '' } ${ this.state.isChecked ? 'selected' : '' }`}>
        <input
          className="vis-control__input"
          type={ this.props.type }
          checked={ this.state.isChecked }
          value={ this.props.label }
          onChange={ this.handleChange } />
        <div className="vis-control__vis">
          <SpiderChart
            type={ this.props.visType }
            data={ this.props.visData }
            width={ 50 }
            height={ 50 }
            margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
            levels={ 1 }
            levelLabel={ false }
            axes={ false }
            axisLabel={ false }
            pointRadius={ 2 }
            canFocus={ false }
            highlight={ this.state.isChecked }
            scoreEnabled={ this.props.scoreEnabled }
            showScore={ true }
            scoreSize={ this.props.scoreSize }
            scoreColor={ this.props.scoreColor }
          />
        </div>
        <span className="vis-control__label">{ this.props.label }</span>
      </label>
    )
  }
}

export default VisControl;
