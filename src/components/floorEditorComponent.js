import React from 'react';
import floorEditor from './floorEditor'
import 'leaflet/dist/leaflet.css'
import '../styles/controllers.css'

class FloorEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fe: null,
      blockForMap: 'MapContainer_' + Math.floor(Math.random() * Math.floor(10000))
    }
    this.historyCoordinates = [];
    this.step = 0;
  }

  undo () {
    this.state.fe.undoHistory()
  }

  repeat () {
    this.state.fe.repeatHistory()
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

  toggleProperty (property) {
    this.state.fe.toggleProperty(property)
  }

  componentDidMount () {
    this.initMap()
  }

  render() {
    return (
      <div className="map-wrapper">
        <div className="app-control" id={'control_' + this.state.blockForMap}>
          <button className="save-changes">Сохранить изменения</button>
          <div className="divider"></div>
          <button className="begin-drawing">
            <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-file" aria-hidden="true">
              <path fill-rule="evenodd" d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"></path>
            </svg>
          </button>
          <div className="divider"></div>
          <button id="undo" className="history-button" onClick={() => {this.undo()}}>
            <svg width="16px" height="16px" viewBox="0 0 16 16">
              <path d="M8 1c-2.21 0-4.21.896-5.657 2.343L0 1v6h6L3.757 4.757C4.843 3.67 6.343 3 8 3c3.314 0 6 2.686 6 6 0 1.792-.786 3.4-2.032 4.5L13.29 15C14.953 13.534 16 11.39 16 9c0-4.418-3.582-8-8-8z"></path>
            </svg>
          </button>
          <button className="history-button" onClick={() => {this.repeat()}}>
            <svg width="16px" height="16px" viewBox="0 0 16 16">
              <path d="M0 9c0 2.39 1.048 4.534 2.71 6l1.322-1.5c-1.246-1.1-2.03-2.708-2.03-4.5 0-3.314 2.685-6 6-6 1.656 0 3.156.672 4.242 1.757L10 7h6V1L13.66 3.343C12.21 1.895 10.21 1 8 1 3.584 1 0 4.582 0 9z"></path>
            </svg>
          </button>
          <div className="divider"></div>
          <div className="toggle-property">
            <div className="input-wrapper">
              <input className="property-input" hidden id="hide-bg" type="checkbox"/>
              <label className="property-label" htmlFor="hide-bg">Непрозрачный фон</label>
            </div>
            <div className="input-wrapper">
              <input className="property-input" hidden onClick={() => {this.toggleProperty('is_hide_name')}} id="hide-title" type="checkbox"/>
              <label className="property-label" htmlFor="hide-title">Скрыть название</label>
            </div>
            <div className="input-wrapper">
              <input className="property-input" hidden onClick={() => {this.toggleProperty('is_hide_area')}} id="hide-area" type="checkbox"/>
              <label className="property-label" htmlFor="hide-area">Скрыть площадь</label>
            </div>
          </div>
        </div>

        <div id={this.state.blockForMap} style={{width: '100%', height: 'calc(100% - 51px)'}}></div>
      </div>
    )
  }
}

export default FloorEditor