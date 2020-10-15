import L from 'leaflet'
import 'leaflet-editable'
import 'leaflet.path.drag'

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
    this.blockId = params.blockId
    this.setCheckboxFunc = params.setCheckboxFunc
    this.viewStyle = {
      isHideName: false,
      isHideArea: false,
      isOpaque: false
    }

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
      // this.addEditControls(floorMap)
      this.initEvents(floorMap)
    } 
    // else {
    //   document.getElementById('control_' + blockId).style.display = 'none'
    // }

    this.historyCoordinates.push(data)
    this.step = this.historyCoordinates.length - 1

    this.initBaseData(floorMap, true)
    
    return floorMap
  }

  initEvents (floorMap) {
    floorMap.on('keyup', _e => {
      let e = _e.originalEvent
      if (e.keyCode === 90 && e.ctrlKey) {
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
      this.initBaseData(floorMap, true)
    })

    floorMap.on('editable:vertex:dragend', e => {
      this.historyCoordinates.splice(this.step + 1)
      this.historyCoordinates.push(this.getResultGeoJSON())
      this.step = this.historyCoordinates.length - 1
      this.initBaseData(floorMap)
    })

    floorMap.on('editable:dragend', e => {
      this.historyCoordinates.splice(this.step + 1)
      this.historyCoordinates.push(this.getResultGeoJSON())
      this.step = this.historyCoordinates.length - 1
      this.initBaseData(floorMap)
    })
  
    floorMap.on('editable:vertex:deleted', e => {
      this.historyCoordinates.splice(this.step + 1)  // почистить действия
      this.historyCoordinates.push(this.getResultGeoJSON())
      this.step = this.historyCoordinates.length - 1
      this.initBaseData(floorMap)
    })

    floorMap.on('editable:editing', e => {
      if (floorMap.editTools.drawing(e)) {
        return
      }
      this.addTooltip(e.layer)
    })
  }

  initBaseData (floorMap, initHook) {
    this.clearOldLayers(floorMap)
    let baseDataLayer = L.geoJSON(this.historyCoordinates[this.step].plan_rooms.coordinates)
    baseDataLayer.id = 'baseData' // добавляем ид к изначальным данным чтобы потом их можно было найти
    baseDataLayer.addTo(floorMap)
    baseDataLayer.eachLayer(layer => {

      if (this.featureHoverCallback !== undefined) {
        let _call = this.featureHoverCallback
        layer.on('mouseover', e => { 
          let bluePoint = this.getBluePointCoords(e.target.feature)
          e.bboxTopCenter = bluePoint
          _call(e)
        })
      }
      if (this.featureOutCallback !== undefined) {
        let _call = this.featureOutCallback
        layer.on('mouseout', e => { _call(e)})
      }

      if (layer.feature.properties.is_mutable) { // если это объект, который можно редактировать
        if (initHook === true) { // если инициализируем карту, то запоминаем состояние пропертис
          this.viewStyle.isHideName = layer.feature.properties.is_hide_name
          this.viewStyle.isHideArea = layer.feature.properties.is_hide_area
          this.viewStyle.isOpaque = layer.feature.properties.is_opaque
          this.setCheckboxFunc('isHideName', this.viewStyle.isHideName)
          this.setCheckboxFunc('isHideArea', this.viewStyle.isHideArea)
          this.setCheckboxFunc('isOpaque', this.viewStyle.isOpaque)
        }
        if (this.mode === 'editor') { // если мод "редактирование"
          if (!!layer.feature.geometry.coordinates) { // и у фичи есть координаты
            layer.enableEdit() // активировать редактирование
            layer.dragging.enable()
          }
        }
      }

      this.addTooltip(layer) // добавляем подписи на фичи
      this.setStyle(layer) // добавляем цвета и прозрачности
    })
    return baseDataLayer
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
    let _isHideName = false
    let _isHideArea = false
    
    if (layer.feature.properties.is_mutable) {
      _isHideName = this.viewStyle.isHideName
      _isHideArea = this.viewStyle.isHideArea
    } else {
      _isHideName = layer.feature.properties.is_hide_name
      _isHideArea = layer.feature.properties.is_hide_area
    }

    if (_isHideName && _isHideArea) {
      return
    }
    if (!_isHideName) {
      tooltipText += layer.feature.properties.name
    }
    if (!_isHideArea) {
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
            // if (_max > 1000) {
              let _koef = 1 / (_max / 1000)
              _width *= _koef
              _height *= _koef
              resolve([[0,0], [_height, _width]])
            // }
          }
        }
        img.src = imageUrl
      } catch (error) {
        console.error('can\'t get image size to create bounds', error)
        resolve([[0,0], [1000, 1000]])
      }
    })
  }

  getResultGeoJSON (saveHook) {
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
            if (saveHook) {
              _sourceDataCopy.plan_rooms.coordinates.features[featureIndex].properties.is_hide_name = this.viewStyle.isHideName
              _sourceDataCopy.plan_rooms.coordinates.features[featureIndex].properties.is_hide_area = this.viewStyle.isHideArea
              _sourceDataCopy.plan_rooms.coordinates.features[featureIndex].properties.is_opaque = this.viewStyle.isOpaque
            }
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
        if (addedData === null) {
          _sourceDataCopy.plan_rooms.coordinates.features[editablePolygonIndex].geometry = null
        } else {
          _sourceDataCopy.plan_rooms.coordinates.features[editablePolygonIndex].geometry = addedData.toGeoJSON().geometry
        }
        if (saveHook) {
          _sourceDataCopy.plan_rooms.coordinates.features[editablePolygonIndex].properties.is_hide_name = this.viewStyle.isHideName
          _sourceDataCopy.plan_rooms.coordinates.features[editablePolygonIndex].properties.is_hide_area = this.viewStyle.isHideArea
          _sourceDataCopy.plan_rooms.coordinates.features[editablePolygonIndex].properties.is_opaque = this.viewStyle.isOpaque
        }
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
      this.initBaseData(this.floorMap)
      this.lastUsedData = newData
    }
  }

  repeatHistory() {
    if (this.step < (this.historyCoordinates.length - 1)) {
      this.step++
      let newData = this.historyCoordinates[this.step]
      this.initBaseData(this.floorMap)
      this.lastUsedData = newData
    }
  }

  save () {
    let resultData = this.getResultGeoJSON(true)
    if (this.saveCallback !== undefined) {
      this.saveCallback(resultData)
    } else {
      console.error('save callback is undefined')
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

  removeEditableObject () {
    let data = JSON.parse(JSON.stringify(this.lastUsedData || this.sourceData))
    let i = data.plan_rooms.coordinates.features.findIndex(feature => {
      return feature.properties.is_mutable
    })
    if (i === -1 || data.plan_rooms.coordinates.features[i].geometry === null) {
      return
    }
    data.plan_rooms.coordinates.features[i].geometry = null
    this.lastUsedData = data
    this.historyCoordinates.splice(this.step + 1)
    this.historyCoordinates.push(data)
    this.step = this.historyCoordinates.length - 1
    this.initBaseData(this.floorMap)
  }

  destr () {
    this.floorMap.remove()
  }

  toggleProperty (propertyName) {
    let _layerWithData = this.getEditableLayer()

    if (_layerWithData !== null) {
      switch (propertyName) {
        case 'is_hide_name':
          this.viewStyle.isHideName = !this.viewStyle.isHideName
          this.addTooltip(_layerWithData)
          this.setCheckboxFunc('isHideName', this.viewStyle.isHideName)
          break

        case 'is_hide_area':
          this.viewStyle.isHideArea = !this.viewStyle.isHideArea
          this.addTooltip(_layerWithData)
          this.setCheckboxFunc('isHideArea', this.viewStyle.isHideArea)
          break

        case 'is_opaque':
          this.viewStyle.isOpaque = !this.viewStyle.isOpaque
          this.setStyle(_layerWithData)
          this.setCheckboxFunc('isOpaque', this.viewStyle.isOpaque)
          break
        
        default:
          break
      }
    }
  }

  setStyle (layer) {
    let _isOpaque = false
    let _color = (layer.feature.properties.color !== undefined) ? layer.feature.properties.color : 'blue'
    if (layer.feature.properties.is_mutable) {
      _isOpaque = this.viewStyle.isOpaque
    } else {
      _isOpaque = layer.feature.properties.is_opaque
    }
    layer.setStyle({
      color: _color,
      fillOpacity: (_isOpaque) ? 1 : 0.3
    })
  }

  getBluePointCoords (feature) {
    if (feature !== undefined && 'geometry' in feature && feature.geometry !== null && 'coordinates' in feature.geometry && feature.geometry.coordinates !== null) {
      let bbox = [9999999, 9999999, -9999999, -9999999] // xMin yMin xMax yMax
      feature.geometry.coordinates[0].forEach(item => {
        let featureX = item[0]
        let featureY = item[1]
        if (featureX < bbox[0]) {
          bbox[0] = featureX
        }
        if (featureX > bbox[2]) {
          bbox[2] = featureX
        }
        if (featureY < bbox[1]) {
          bbox[1] = featureY
        }
        if (featureY > bbox[3]) {
          bbox[3] = featureY
        }
      })
      
      let point = {
        x: (bbox[0] + bbox[2]) / 2,
        y: bbox[3]
      }
      let convertPoint = this.floorMap.latLngToContainerPoint([point.y, point.x])
      if (this.mode === 'editor') {
        let control = document.getElementById('control_' + this.blockId)
        let contolHeight = 55
        if (control !== null) {
          contolHeight = parseInt(control.offsetHeight)
        }
        convertPoint.y += contolHeight // если еще есть и плашка с инструментами
      }
      return convertPoint
    } else {
      return {
        x: null,
        y: null
      }
    }
  }
}

export default floorEditor