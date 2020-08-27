import React from 'react';
import floorEditor from './floorEditor'
import 'leaflet/dist/leaflet.css'

class FloorEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null
    }
  }

  initMap () {
    const _val = new floorEditor(
      {
        data: this.props.data,
        mode: 'editor'
      }
    )
    this.setState({
      map: _val
    })
  }

  componentDidMount () {
    this.initMap()
  }

  render() {
    return (
      <div>
        <button onClick={() => {this.myFunc()}}>click</button>
        <div id="map" style={{width: '900px', height: '900px'}}/>
      </div>
    )
  }
}

export default FloorEditor