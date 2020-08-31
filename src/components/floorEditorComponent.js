import React from 'react';
import floorEditor from './floorEditor'
import 'leaflet/dist/leaflet.css'
import '../styles/controllers.css'

class FloorEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fe: null,
      blockForMap: 'MapContainer_' + Math.floor(Math.random() * Math.floor(10000)),
      isOpaque: false,
      isHideName: false,
      isHideArea: false
    }
    this.historyCoordinates = [];
    this.step = 0;
  }

  keyFucn () {
    this.state.fe.keyFucnH()
  }

  undo () {
    this.state.fe.undoHistory()
  }

  setCheckbox(name, value) {
    console.log(name, value)
    this.setState({
      [name]: value
    })
    console.log(this.state.isOpaque)
  }

  repeat () {
    this.state.fe.repeatHistory()
  }

  save () {
    this.state.fe.save()
  }

  initMap () {
    const _val = new floorEditor(
      {
        data: this.props.data,
        mode: this.props.mode,
        saveCallback: this.props.onSave,
        featureHoverCallback: this.props.onFeatureHover,
        featureOutCallback: this.props.onFeatureOut,
        blockId: this.state.blockForMap,
        setCheckboxFunc: (a,b) => this.setCheckbox(a,b),
      }
    )
    this.setState({
      fe: _val
    })
  }

  toggleProperty (property) {
    this.state.fe.toggleProperty(property)
  }

  drawNewPolygon () {
    this.state.fe.drawNewPolygon()
  }

  componentDidMount () {
    this.initMap()
  }

  render() {
    let _mode = this.props.mode
    return (
      <div className="map-wrapper">
        <div className="app-control" id={'control_' + this.state.blockForMap}>
          <button className="save-changes" onClick={() => {this.save()}}>Сохранить изменения</button>
          <div className="divider"></div>
          <button className="begin-drawing" title="Создать" onClick={() => {this.drawNewPolygon()}}>
            <svg version="1.1" width="16" height="16" viewBox="0 -1 16 16">
              <path fillRule="evenodd" d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z"></path>
            </svg>
          </button>
          <button className="remove-drawing" title="Удалить">
            <svg height="16" viewBox="0 0 512 512" width="16" xmlns="http://www.w3.org/2000/svg">
              <path d="m416.875 114.441406-11.304688-33.886718c-4.304687-12.90625-16.339843-21.578126-29.941406-21.578126h-95.011718v-30.933593c0-15.460938-12.570313-28.042969-28.027344-28.042969h-87.007813c-15.453125 0-28.027343 12.582031-28.027343 28.042969v30.933593h-95.007813c-13.605469 0-25.640625 8.671876-29.945313 21.578126l-11.304687 33.886718c-2.574219 7.714844-1.2695312 16.257813 3.484375 22.855469 4.753906 6.597656 12.445312 10.539063 20.578125 10.539063h11.816406l26.007813 321.605468c1.933594 23.863282 22.183594 42.558594 46.109375 42.558594h204.863281c23.921875 0 44.175781-18.695312 46.105469-42.5625l26.007812-321.601562h6.542969c8.132812 0 15.824219-3.941407 20.578125-10.535157 4.753906-6.597656 6.058594-15.144531 3.484375-22.859375zm-249.320312-84.441406h83.0625v28.976562h-83.0625zm162.804687 437.019531c-.679687 8.402344-7.796875 14.980469-16.203125 14.980469h-204.863281c-8.40625 0-15.523438-6.578125-16.203125-14.980469l-25.816406-319.183593h288.898437zm-298.566406-349.183593 9.269531-27.789063c.210938-.640625.808594-1.070313 1.484375-1.070313h333.082031c.675782 0 1.269532.429688 1.484375 1.070313l9.269531 27.789063zm0 0"/>
              <path d="m282.515625 465.957031c.265625.015625.527344.019531.792969.019531 7.925781 0 14.550781-6.210937 14.964844-14.21875l14.085937-270.398437c.429687-8.273437-5.929687-15.332031-14.199219-15.761719-8.292968-.441406-15.328125 5.925782-15.761718 14.199219l-14.082032 270.398437c-.429687 8.273438 5.925782 15.332032 14.199219 15.761719zm0 0"/>
              <path d="m120.566406 451.792969c.4375 7.996093 7.054688 14.183593 14.964844 14.183593.273438 0 .554688-.007812.832031-.023437 8.269531-.449219 14.609375-7.519531 14.160157-15.792969l-14.753907-270.398437c-.449219-8.273438-7.519531-14.613281-15.792969-14.160157-8.269531.449219-14.609374 7.519532-14.160156 15.792969zm0 0"/>
              <path d="m209.253906 465.976562c8.285156 0 15-6.714843 15-15v-270.398437c0-8.285156-6.714844-15-15-15s-15 6.714844-15 15v270.398437c0 8.285157 6.714844 15 15 15zm0 0"/>
            </svg>
          </button>
          <div className="divider"></div>
          <button id="undo" className="history-button" title="Отменить" onClick={() => {this.undo()}}>
            <svg width="16px" height="16px" viewBox="0 0 16 16">
              <path d="M8 1c-2.21 0-4.21.896-5.657 2.343L0 1v6h6L3.757 4.757C4.843 3.67 6.343 3 8 3c3.314 0 6 2.686 6 6 0 1.792-.786 3.4-2.032 4.5L13.29 15C14.953 13.534 16 11.39 16 9c0-4.418-3.582-8-8-8z"></path>
            </svg>
          </button>
          <button className="history-button" title="Вернуть" onClick={() => {this.repeat()}}>
            <svg width="16px" height="16px" viewBox="0 0 16 16">
              <path d="M0 9c0 2.39 1.048 4.534 2.71 6l1.322-1.5c-1.246-1.1-2.03-2.708-2.03-4.5 0-3.314 2.685-6 6-6 1.656 0 3.156.672 4.242 1.757L10 7h6V1L13.66 3.343C12.21 1.895 10.21 1 8 1 3.584 1 0 4.582 0 9z"></path>
            </svg>
          </button>
          <div className="divider"></div>
          <div className="toggle-property">
            <div className="input-wrapper">
              <input className="property-input" readOnly checked={this.state.isOpaque} onClick={() => {this.toggleProperty('is_opaque')}} hidden id="hide-bg" type="checkbox"/>
              <label className="property-label" htmlFor="hide-bg">Непрозрачный фон</label>
            </div>
            <div className="input-wrapper">
              <input className="property-input" readOnly checked={this.state.isHideName} hidden onClick={() => {this.toggleProperty('is_hide_name')}} id="hide-title" type="checkbox"/>
              <label className="property-label" htmlFor="hide-title">Скрыть название</label>
            </div>
            <div className="input-wrapper">
              <input className="property-input" readOnly checked={this.state.isHideArea} hidden onClick={() => {this.toggleProperty('is_hide_area')}} id="hide-area" type="checkbox"/>
              <label className="property-label" htmlFor="hide-area">Скрыть площадь</label>
            </div>
          </div>
        </div>

        <div id={this.state.blockForMap} style={{width: '100%', height: _mode === 'editor' ? 'calc(100% - 51px)' : '100%'}}></div>
      </div>
    )
  }
}

export default FloorEditor