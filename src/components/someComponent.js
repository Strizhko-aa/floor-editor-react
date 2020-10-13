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

    let lastPoint = document.getElementById('exampleHoverPoint')
    if (lastPoint !== null) {
      lastPoint.remove()
    }

    let testDiv = document.createElement('div') // просто желтая точка с координатами из блока
    testDiv.style.width = '12px'
    testDiv.style.height = '12px'
    testDiv.style.position = 'absolute'
    testDiv.style.zIndex = 999999999
    testDiv.style.backgroundColor = 'yellow'
    testDiv.style.top = feature.bboxTopCenter.y - 6 + 'px'
    testDiv.style.left = feature.bboxTopCenter.x - 6 + 'px' // bboxTopCenter - новое свойство. Это верх и центр bbox-a фичи на которуб навели в координатах контейнера
    testDiv.id = 'exampleHoverPoint'
    document.getElementById('exampleId').appendChild(testDiv)

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
        <div style={{width: '49%', height: '720px', position: 'relative'}} id="exampleId"> 
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