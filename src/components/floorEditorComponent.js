import React from 'react';
import floorEditor from './floorEditor'
import 'leaflet/dist/leaflet.css'

class FloorEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      map: ['init']
    }
  }

  initMap () {
    const _val = new floorEditor()
    this.setState({
      map: _val
    })
  }

  componentDidMount () {
    this.initMap()
  }

  render() {
    return (
      <div id="map" style={{width: '900px', height: '900px'}}>
      </div>
    )
  }
}

export default FloorEditor