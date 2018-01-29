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

    if (this.props.type === "radio") {
      updatedControlList.forEach(control => {
        control.checked = "";
      });
    }

    const targetIndex = updatedControlList.findIndex(control => control.id === id);
    updatedControlList[targetIndex].checked = value;

    this.setState({ controls: updatedControlList });
    this.props.onChange(updatedControlList, targetIndex);
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
                  type={ this.props.type }
                  name={ this.props.name }
                  label={ control.label }
                  blockLabel={ this.props.blockLabel }
                  checked={ control.checked }
                  onChange={ this.handleControlChange }
                  visData={ control.data }
                  visType={ this.props.visType }
                  scoreEnabled={ this.props.scoreEnabled }
                  scoreSize={ this.props.scoreSize }
                  scoreColor={ this.props.scoreColor } />
              </li>
            )
          })
        }
      </ul>
    )
  }
}

export default VisControlGroup;
