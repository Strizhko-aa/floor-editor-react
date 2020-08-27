import React from 'react';
import floorEditor from './floorEditor'
import 'leaflet/dist/leaflet.css'
import '../styles/controllers.css'

class FloorEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      map: ['init']
    }
    this.historyCoordinates = [];
    this.step = 0;
  }

  undoAction() {
    let button = document.getElementById('undo')
    button.addEventListener('click', e => {
      if (this.step !== 0) {
        this.step--
        let newData = this.historyCoordinates[this.step]
        console.log(this.historyCoordinates)
        this.initBaseData(this.floorMap, newData)
      }
    })
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
      <div className="map-wrapper">
        <div className="app-control">
          <button id="undo" className="history-button">Назад</button>
          <button className="history-button">Вперед</button>
          <div className="toggle-property">
            <div className="input-wrapper">
              <input id="hide-bg" type="checkbox"/>
              <label for="hide-bg">Непрозрачный фон</label>
            </div>
            <div className="input-wrapper">
              <input id="hide-title" type="checkbox"/>
              <label for="hide-title">Скрыть название</label>
            </div>
            <div className="input-wrapper">
              <input id="hide-area" type="checkbox"/>
              <label for="hide-area">Скрыть площадь</label>
            </div>
          </div>
        </div>

        <div id="map" style={{width: '100%', height: '600px'}}></div>
      </div>
    )
  }
}

export default FloorEditor