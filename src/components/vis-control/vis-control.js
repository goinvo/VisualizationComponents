import React, { Component } from 'react';

import Radar from '../radar/radar';

class VisControl extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isChecked: props.checked || false
    }
  }

  handleChange = (e) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    this.setState({ isChecked: value });
    this.props.onChange(value, this.props.id);
  }

  render() {
    return (
      <label className={`vis-control ${ this.state.isChecked ? 'selected' : '' }`}>
        <input
          className="vis-control__input"
          type="checkbox"
          checked={ this.state.isChecked }
          onChange={ this.handleChange } />
        <div className="vis-control__vis">
          <Radar
            data={ [this.props.visData] }
            width={ 50 }
            height={ 50 }
            margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            levels={ 1 }
            levelLabel={ false }
            axes={ false }
            dotRadius={ 2 }
          />
        </div>
        <span className="vis-control__label">{ this.props.label }</span>
      </label>
    )
  }
}

export default VisControl;
