import React from 'react';
import floorEditor from './floorEditor'
import 'leaflet/dist/leaflet.css'

class FloorEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fe: null,
      blockForMap: 'MapContainer_' + Math.floor(Math.random() * Math.floor(10000))
    }
  }

  initMap () {
    const _val = new floorEditor(
      {
        data: this.props.data,
        mode: this.props.mode,
        saveCallback: this.props.onSave,
        featureHoverCallback: this.props.onFeatureHover,
        blockId: this.state.blockForMap
      }
    )
    this.setState({
      fe: _val
    })
  }

  toggleName (property) {
    this.state.fe.toggleProperty(property)
  }

  componentDidMount () {
    this.initMap()
  }

  render() {
    return (
      <div>
        <button onClick={() => {this.toggleName('is_hide_name')}}>name</button>
        <button onClick={() => {this.toggleName('is_hide_area')}}>area</button>
        <div id={this.state.blockForMap} style={{width: '900px', height: '900px'}}/>
      </div>
    )
  }
}

export default FloorEditor