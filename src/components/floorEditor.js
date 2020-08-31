import L from 'leaflet'
import 'leaflet-editable'

class floorEditor {
  constructor (params) {
    if (params.data === undefined) {
      throw new Error('object with key "data" must be passed in constuctor')
    }
    this.floorMap = null
    this.sourceData = params.data || null
    this.lastUsedData = null
    this.mode = params.mode === 'editor' ? params.mode : 'viewer'
    this.featureHoverCallback = params.featureHoverCallback
    this.featureOutCallback = params.featureOutCallback
    this.saveCallback = params.saveCallback
    this.historyCoordinates = []
    this.step = 0

    this.initMap(params.blockId, params.data).then(succ => {
      this.floorMap = succ
    })
  }

  async initMap(blockId, data) { 
    let floorMap = L.map(blockId, {
      crs: L.CRS.Simple, // обычная Декартова система координат. [0,0] - левый нижний угол
      editable: this.mode === 'editor',
      minZoom: -1
    })

    let imageUrl = data.plan_rooms.content.plan_file // устанавливаем изображение чтобы оно не исказилось и помещалось в координаты 1000 х 1000
    let bounds = await this.getBounds(imageUrl)
    L.imageOverlay(imageUrl, bounds).addTo(floorMap)
    floorMap.fitBounds(bounds)

    if (this.mode === 'editor') {
      this.addEditControls(floorMap)
      this.initEvents(floorMap)
    } else {
      document.getElementById('control_' + blockId).style.display = 'none'
    }

    this.historyCoordinates.push(data)
    this.step = this.historyCoordinates.length - 1

    this.initBaseData(floorMap, data)
    // this.initEvents(floorMap)

    return floorMap
  }

  initEvents (floorMap) {
    floorMap.on('keyup', _e => {
      let e = _e.originalEvent
      console.log(_e)
      if (e.keyCode === 90 && e.ctrlKey) {
        // console.log(e.keyCode, e.ctrlKey)
        this.undoHistory()
      } else if (e.keyCode === 89 && e.ctrlKey) {
        this.repeatHistory()
      }
    })

    floorMap.on('editable:drawing:end', e => {
      this.historyCoordinates.splice(this.step + 1)
      let newData = this.getResultGeoJSON()
      this.historyCoordinates.push(newData)
      this.step = this.historyCoordinates.length - 1
      this.initBaseData(floorMap, newData)
    })

    floorMap.on('editable:vertex:dragend', e => {
      this.historyCoordinates.splice(this.step + 1)
      this.historyCoordinates.push(this.getResultGeoJSON())
      this.step = this.historyCoordinates.length - 1
    })
  
    floorMap.on('editable:vertex:deleted', e => {
      this.historyCoordinates.splice(this.step + 1)
      this.historyCoordinates.push(this.getResultGeoJSON())
      this.step = this.historyCoordinates.length - 1
    })

    floorMap.on('editable:editing', e => {
      if (floorMap.editTools.drawing(e)) {
        return
      }
      this.addTooltip(e.layer)
    })
  }

  initBaseData (floorMap, data) {
    this.clearOldLayers(floorMap)
    let baseDataLayer = L.geoJSON(data.plan_rooms.coordinates)
    baseDataLayer.id = 'baseData' // добавляем ид к изначальным данным чтобы потом их можно было найти
    baseDataLayer.addTo(floorMap)
    baseDataLayer.eachLayer(layer => {
      if (layer.feature.properties.color) { // цвета полигонов
        layer.setStyle({
          color: layer.feature.properties.color
        })
      }

      this.addTooltip(layer) // добавляем подписи на фичи
      if (this.featureHoverCallback !== undefined) {
        let _call = this.featureHoverCallback
        layer.on('mouseover', e => { _call(e)})
      }
      if (this.featureOutCallback !== undefined) {
        let _call = this.featureOutCallback
        layer.on('mouseout', e => { _call(e)})
      }

      if (this.mode === 'editor') { // включаем редактирование объекта
        if (layer.feature.properties.is_mutable) { // если это объект, который можно редактировать
          if (!!layer.feature.geometry.coordinates) { // и у него есть координаты
            layer.enableEdit()
            // layer.setStyle({color: layer.feature.properties.color || 'blue'})
          }
        }
      }
    })
  }

  clearOldLayers (floorMap) {
    floorMap.eachLayer(_layer => {
      if (_layer.id === 'baseData' || this.isAddedFeature(_layer)) {
        floorMap.removeLayer(_layer)
      }
    })
  }

  addTooltip (layer) {
    if (layer.getTooltip()) {
      layer.unbindTooltip()
    }
    let tooltipText = ''
    if (layer.feature.properties.is_hide_name && layer.feature.properties.is_hide_area) {
      return
    }
    if (!layer.feature.properties.is_hide_name) {
      tooltipText += layer.feature.properties.name
    }
    if (!layer.feature.properties.is_hide_area) {
      tooltipText !== '' ? tooltipText += ('<br>' + layer.feature.properties.area) : tooltipText += layer.feature.properties.area
      tooltipText += 'м<sup>2</sup>'
    }
    layer.bindTooltip(tooltipText, {
      permanent: true,
      direction: 'center'
    })

  }

  getBounds (imageUrl) { // приводим систему к координатам 1000mu х 1000mu (mu - map unit). Если изображение не квадратное, то большая сторона 1000 другая уменьшается в пропорции
    return new Promise((resolve, reject) => {
      try {
        const img = new Image()
        img.onload = function() {
          let _width = this.width
          let _height = this.height
          if (_width === _height) {
            resolve([[0,0], [1000, 1000]])
          } else {
            let _max = Math.max(_width, _height)
            if (_max > 1000) {
              let _koef = 1 / (_max / 1000)
              _width *= _koef
              _height *= _koef
              resolve([[0,0], [_height, _width]])
            }
          }
        }
        img.src = imageUrl
      } catch (error) {
        console.error('can\'t get image size to create bounds', error)
        resolve([[0,0], [1000, 1000]])
      }
    })
  }

  getResultGeoJSON () {
    let addedData = null
    let _sourceDataCopy = JSON.parse(JSON.stringify(this.lastUsedData || this.sourceData))
    let newData = null
    let isPolygonGeomtryExist = false // флаг того, что у полигона, с которым взаимодействуем есть геометрия
    _sourceDataCopy.plan_rooms.coordinates.features.forEach(_feature => {
      if (_feature.properties.is_mutable && _feature.geometry !== null) {
        isPolygonGeomtryExist = true
        return
      }
    })

    if (isPolygonGeomtryExist) { // если у редактируемого объекта есть геометрия, то она просто изменилась
      // TODO добавление properties is_edited и прочих
      this.floorMap.eachLayer(layer => {
        if (layer.id === 'baseData') {
          let newGeoData = layer.toGeoJSON()
          let changedFeature = null
          newGeoData.features.forEach(_feature => {
            if (_feature.properties.is_mutable) {
              changedFeature = _feature
              return
            }
          })
          if (changedFeature !== null) {
            let featureIndex = _sourceDataCopy.plan_rooms.coordinates.features.findIndex(_feature => {
              return _feature.properties.is_mutable
            })
            _sourceDataCopy.plan_rooms.coordinates.features[featureIndex].geometry = changedFeature.geometry
          }
          this.lastUsedData = _sourceDataCopy
          newData = _sourceDataCopy // выход из floorMap.eachLayer
        }
      })
    } else { // если геометрии нет, то надо её добавить в изначальные данные(leaflet не добавляет фичи, у которых нет геометрии, а properties нужно сохранить)
      this.floorMap.eachLayer(layer => {
        if (this.isAddedFeature(layer)) {
          addedData = layer
        }
      })
      let editablePolygonIndex = _sourceDataCopy.plan_rooms.coordinates.features.findIndex(_feature => {
        return _feature.properties.is_mutable
      })
      
      if (editablePolygonIndex !== -1) {
        _sourceDataCopy.plan_rooms.coordinates.features[editablePolygonIndex].geometry = addedData.toGeoJSON().geometry
      }
      
      this.lastUsedData = _sourceDataCopy
      newData = _sourceDataCopy // выход из floorMap.eachLayer
    }

    return newData
  }

  isAddedFeature (layer) {
    return '_events' in layer && !('_image' in layer) && 'editOptions' in layer.options
  }

  undoHistory() {
    if (this.step !== 0) {
      this.step--
      let newData = this.historyCoordinates[this.step]
      this.initBaseData(this.floorMap, newData)
      this.lastUsedData = newData
    }
  }

  /* _ctrz () {
    let q = document.querySelector('.map-wrapper')
    console.log(q)
    q[0].on('keyup', _e => {
      let e = _e.originalEvent
      console.log(e.keyCode, e.ctrlKey)
      if (e.keyCode === 90 && e.ctrlKey) {
        console.log(e.keyCode, e.ctrlKey)
        this.undoHistory()
      } else if (e.keyCode === 89 && e.ctrlKey) {
        this.repeatHistory()
      }
    })
  } */

  repeatHistory() {
    if (this.step < (this.historyCoordinates.length - 1)) {
      this.step++
      let newData = this.historyCoordinates[this.step]
      this.initBaseData(this.floorMap, newData)
      this.lastUsedData = newData
    }
  }

  save () {
    let resultData = this.getResultGeoJSON()
    if (this.saveCallback !== undefined) {
      this.saveCallback(resultData)
    } else {
      console.error('callback is undefined')
    }
  }

  drawNewPolygon () {
    this.floorMap.editTools.startPolygon()
  }

  addEditControls(floorMap, saveCallback) {

    // var deleteShape = function (e) { // удаление фигур
    //   if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) this.editor.deleteShapeAt(e.latlng);
    // };
    // floorMap.on('layeradd', function (e) {
    //     if (e.layer instanceof L.Path) e.layer.on('click', L.DomEvent.stop).on('click', deleteShape, e.layer);
    //     if (e.layer instanceof L.Path) e.layer.on('dblclick', L.DomEvent.stop).on('dblclick', e.layer.toggleEdit);
    // })
  }

  getEditableLayer () {
    let _layerWithData = null
    this.floorMap.eachLayer(_layer => {
      if (_layer.id === 'baseData') {
        _layerWithData = _layer
        return
      }
    })

    let _editableLayer = null
    if (_layerWithData !== null) {
      _layerWithData.eachLayer(_layer => {
        if (_layer.feature.properties.is_mutable) {
          _editableLayer = _layer
          return
        }
      })
    }
    return _editableLayer
  }

  toggleProperty (propertyName) {
    let _layerWithData = this.getEditableLayer()

    if (_layerWithData !== null) {
      _layerWithData.feature.properties[propertyName] = !_layerWithData.feature.properties[propertyName]
      this.addTooltip(_layerWithData)
      this.historyCoordinates.splice(this.step + 1)
      this.historyCoordinates.push(this.getResultGeoJSON())
      this.step = this.historyCoordinates.length - 1
    }
  }
}

export default floorEditor