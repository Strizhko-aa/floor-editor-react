import React from 'react';
// import axios from 'axios';
import FloorEditor from './floorEditorComponent';
import testData from './testData.json'
import testData2 from './testData2.json'

class SomeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data1: null,
      data2: null,
      // url: 'http://localhost:3000/floor',
      // url: 'http://rental.webworkers.pro/floor_plan/2',
      loading: true,
      savedData: null,
      lastHoveredFeature: null
    }
  }

  onSaveCallback (data) {
    // some code with edited data
    this.setState({
      savedData: data
    })
    console.log('this.state.savedData', data)
  }

  onFeatureHoverCallback (feature) {
    // do some with hovered feature
    console.log('feature from component', feature)
    // this.setState({
    //   lastHoveredFeature: feature
    // })
  }

  onFeatureOutCallback (feature) {
    // console.log('mouse out', feature)
  }

  getData () {
    // axios.get(this.state.url).then((response) => {
    //   console.log('response', response)
    //   this.setState({
    //     data: response.data,
    //     loading: false
    //   })
    // })

    this.setState({
      data1: testData,
      data2: testData2,
      loading: false
    })
  }

  componentDidMount () {
    this.getData()
  }

  render() {
    let loading = this.state.loading
    let mapComponent = null
    if (loading) {
      mapComponent = <div>loading map ...</div>
    } else {
      mapComponent = 
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div style={{width: '50%', height: '720px'}}> 
          <FloorEditor
            data={this.state.data1}
            mode={'viewer'}
            onSave={data => this.onSaveCallback(data)}
            onFeatureHover={data => {this.onFeatureHoverCallback(data)}}
            onFeatureOut={data => {this.onFeatureOutCallback(data)}}
          />
        </div>
        <div style={{width: '49%', height: '720px'}}> 
          <FloorEditor
            data={this.state.data2}
            mode={'editor'}
            onSave={data => this.onSaveCallback(data)}
            onFeatureHover={data => {this.onFeatureHoverCallback(data)}}
            onFeatureOut={data => {this.onFeatureOutCallback(data)}}
          />
        </div>
      </div>
    }
    return mapComponent
  }
}

export default SomeComponent