import React from 'react';
import axios from 'axios';
import FloorEditor from './floorEditorComponent'

class SomeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      url: 'http://localhost:3000/floor',
      loading: true,
      options: {
        type: 'editor'
      }
    }
  }

  onSaveCallback (data) {
    console.log('save callback', data)
  }

  getData () {
    axios.get(this.state.url).then((response) => {
      console.log('response', response)
      this.setState({
        data: response.data,
        loading: false
      })
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
      mapComponent = <div> 
        <FloorEditor
          data={this.state.data}
          mode={'editor'}
          // onSave={() => this.onSaveCallback}
        />
      </div>
    }
    return mapComponent
  }
}

export default SomeComponent