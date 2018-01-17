import React, { Component } from 'react';
import _ from 'lodash';

import VisControl from '../vis-control/vis-control';

class VisControlGroup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      controls: props.controls || []
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.controls !== nextProps.controls) {
      this.setState({ controls: nextProps.controls });
    }
  }

  handleControlChange = (value, id) => {
    const updatedControlList = _.cloneDeep(this.state.controls);

    updatedControlList.find(control => control.id === id).checked = value;

    this.setState({ controls: updatedControlList });
    this.props.onChange(updatedControlList);
  }

  render() {
    return (
      <ul className={`vis-control-group ${ this.props.stacked ? 'vis-control-group--stacked' : '' }`}>
        {
          this.state.controls.map(control => {
            return (
              <li key={ control.id } className="vis-control-group__item">
                <VisControl
                  id={ control.id }
                  label={ control.label }
                  checked={ control.checked }
                  onChange={ this.handleControlChange }
                  visData={ control.data } />
              </li>
            )
          })
        }
      </ul>
    )
  }
}

export default VisControlGroup;
