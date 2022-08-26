var LealfletMapBox = new (function(){

    var pub = {
        maps  : {},
        markerlist : {},
        layermarker : {},
        polylinelist : {},
        datasets : {},
        autocenter : true
    };

    pub.init = function()
    {
        document.querySelectorAll('.osy-mapgrid-leaflet').forEach(this.initMapBox);
    };

    pub.initMapBox = function(mapBox)
    {
        let self = LealfletMapBox;
        let mapId = mapBox.getAttribute('id');
        let mapCenter = self.getMapBoxProperty(mapBox, 'center', '41.9100711,12.5359979').split(',');
        let zoomLevel = self.getMapBoxProperty(mapBox, 'zoom', 10);
        mapBox.map = L.map(mapId).setView(mapCenter, zoomLevel);
        mapBox.id = mapId;
        mapBox.map.box = mapBox;
        mapBox.datagrids = [];
        mapBox.layers = [];
        mapBox.markers = [];
        LealfletMapBox.maps[mapId] = mapBox.map;
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' }).addTo(mapBox.map);
        mapBox.setVertex = self.setVertex;
        mapBox.setVertex();
        self.linkDatagridsToMapBox(mapBox);
        mapBox.map.addEventListener('moveend', function(e) {
            console.log('moveEnd');
            this.autocenter = false;
            this.box.setVertex();
            //OclMapLeafletBox.refreshDatagrid(map);
        });
        if (!Osynapsy.isEmpty(mapBox.getAttribute('dataDrawPlugin'))) {
            self.enableDrawPlugin(mapBox.map);
        }
    };

    pub.linkDatagridsToMapBox = function(mapBox)
    {
        document.querySelectorAll('div[data-mapgrid=' + mapBox.getAttribute('id') +']').forEach(function(datagrid){
            mapBox.datagrids.push(datagrid.getAttribute('id'));
        });
    };

    pub.getMapBoxProperty = function(mapBox, property, defaultValue = null)
    {
        let propertyId = '#' + mapBox.getAttribute('id') + '_' + property;
        let propertyValue = document.querySelector(propertyId).value;
        return Osynapsy.isEmpty(propertyValue) ? defaultValue : propertyValue;
    };

    pub.setVertex = function()
    {
        var mapId = this.getAttribute('id');
        var bounds = this.map.getBounds();
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();
        $('#'+mapId+'_ne_lat').val(ne.lat);
        $('#'+mapId+'_ne_lng').val(ne.lng);
        $('#'+mapId+'_sw_lat').val(sw.lat);
        $('#'+mapId+'_sw_lng').val(sw.lng);
        $('#'+mapId+'_center').val(this.map.getCenter().toString().replace('LatLng(','').replace(')',''));
        $('#'+mapId+'_cnt_lat').val((sw.lat + ne.lat) / 2);
        $('#'+mapId+'_cnt_lng').val((sw.lng + ne.lng) / 2);
    };

    pub.enableDrawPlugin = function(map)
    {
        var LeafIcon = L.Icon.extend({
            options: {
                shadowUrl: 'http://leafletjs.com/docs/images/leaf-shadow.png',
                iconSize:     [38, 95],
                shadowSize:   [50, 64],
                iconAnchor:   [22, 94],
                shadowAnchor: [4, 62],
                popupAnchor:  [-3, -76]
            }
        });
        var greenIcon = new LeafIcon({
            iconUrl: 'http://leafletjs.com/docs/images/leaf-green.png'
        });

        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        var drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                polygon: {
                    shapeOptions: {
                            color: 'purple'
                    },
                    allowIntersection: false,
                    drawError: {
                            color: 'orange',
                            timeout: 1000
                    },
                    showArea: true,
                    metric: false,
                    repeatMode: true
                },
                polyline: {
                    shapeOptions: {
                            color: 'red'
                    }
                },
                rect: {
                    shapeOptions: {
                            color: 'green'
                    }
                },
                circle: {
                    shapeOptions: {
                            color: 'steelblue'
                    }
                },
                marker: {
                    icon: greenIcon
                }
            },
            edit: {
                featureGroup: drawnItems
            }
        });
        map.addControl(drawControl);

        map.addEventListener('draw:created', function (e) {
            var type = e.layerType,
                layer = e.layer;
            if (type === 'marker') {
                layer.bindPopup('A popup!');
            }
            drawnItems.addLayer(layer);
        });
        map.addEventListener('draw:drawstop', function (e) {
            alert('finito');
        });
        map.addEventListener('zoomend',function(e){
            document.getElementById(this.id + '_zoom').value = this.getZoom();
        });
    };

    pub.enableRoutingPlugin = function(map)
    {
        L.Routing.control({
            waypoints: [
                L.latLng(57.74, 11.94),
                L.latLng(57.6792, 11.949)
            ]
        }).addTo(map);
    };

    return pub;
});

OclMapLeafletBox =
{
    datagrid : [],
    maplist  : {},
    markerlist : {},
    layermarker : {},
    layerlist : {},
    polylinelist : {},
    datasets : {},
    autocenter : true,
    init : function()
    {
        self = this;
        $('.osy-mapgrid-leaflet').each(function(){
            var mapId = $(this).attr('id');
            var center = $('#' + mapId + '_center').val().split(',');
            var zoom = 10;
            if (document.getElementById(mapId + '_zoom').value > 0){
                zoom = document.getElementById(mapId + '_zoom').value;
            }
            center[0] = parseFloat(center[0]);
            center[1] = parseFloat(center[1]);
            var map = L.map(mapId).setView(center, zoom);
            map.mapid = mapId;
            self.maplist[mapId] = map;
            L.tileLayer(
                'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
                { attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' }
            ).addTo(map);
            self.setVertex(map);
            $('div[data-mapgrid=' + $(this).attr('id') +']').each(function(){
                OclMapLeafletBox.datagrid.push($(this).attr('id'));
            });

            //Enable listener moveend event
            map.on('moveend', function(e) {
                OclMapLeafletBox.autocenter = false;
                OclMapLeafletBox.setVertex(map);
                //OclMapLeafletBox.refreshDatagrid(map);
            });

            if (!Osynapsy.isEmpty($(this).data('draw-plugin'))) {
               self.activateDrawPlugin(map);
            }
            if (!Osynapsy.isEmpty($(this).data('routing-plugin'))) {
               self.activateRoutingPlugin(map);
            }
            if ($(this).attr('coostart')){
                var start = $(this).attr('coostart').split(',');
                OclMapLeafletBox.markersAdd(mapId,'start-layer',[{
                    lat : parseFloat(start[0]),
                    lng : parseFloat(start[1]),
                    oid : mapId + '-start',
                    ico : {
                        text : start[2],
                        color:'green'
                    },
                    popup : 'MAIN'
                }]);
            }
        });
	this.refreshDatagrid();
    },
    activateRoutingPlugin : function(map)
    {
        return;
        L.Routing.control({
            waypoints: [
                L.latLng(57.74, 11.94),
                L.latLng(57.6792, 11.949)
            ]
        }).addTo(map);
    },
    activateDrawPlugin : function(map)
    {
        var LeafIcon = L.Icon.extend({
            options: {
                shadowUrl: 'http://leafletjs.com/docs/images/leaf-shadow.png',
                iconSize:     [38, 95],
                shadowSize:   [50, 64],
                iconAnchor:   [22, 94],
                shadowAnchor: [4, 62],
                popupAnchor:  [-3, -76]
            }
        });
        var greenIcon = new LeafIcon({
            iconUrl: 'http://leafletjs.com/docs/images/leaf-green.png'
        });

        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        var drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                polygon: {
                    shapeOptions: {
                            color: 'purple'
                    },
                    allowIntersection: false,
                    drawError: {
                            color: 'orange',
                            timeout: 1000
                    },
                    showArea: true,
                    metric: false,
                    repeatMode: true
                },
                polyline: {
                    shapeOptions: {
                            color: 'red'
                    }
                },
                rect: {
                    shapeOptions: {
                            color: 'green'
                    }
                },
                circle: {
                    shapeOptions: {
                            color: 'steelblue'
                    }
                },
                marker: {
                    icon: greenIcon
                }
            },
            edit: {
                featureGroup: drawnItems
            }
        });
        map.addControl(drawControl);

        map.on('draw:created', function (e) {
            var type = e.layerType,
                layer = e.layer;
            if (type === 'marker') {
                    layer.bindPopup('A popup!');
            }
            drawnItems.addLayer(layer);
        }).on('draw:drawstop', function (e) {
            alert('finito');
        }).on('zoomend',function(e){
            $('#'+this.mapid+'_zoom').val(this.getZoom());
        });
    },
    calc_dist : function(sta, end)
    {
	var a = L.latLng(sta);
	var b = L.latLng(end);
	return a.distanceTo(b);
    },
    calc_next : function(sta,dat)
    {
        //console.log(dat);
	//Alert impostando una distanza troppo bassa va in errore;
  	var dst_min = parseFloat(100000000);
	var coo_min = null;
	for (i in dat) {
            var dst_cur = this.calc_dist(sta, dat[i]);
            dst_min = Math.min(dst_min,dst_cur);
            if (dst_min == dst_cur){
		coo_min = dat[i];
            }
	}
	return coo_min;
    },
    calc_perc : function(mapid, dat)
    {
        var polid = 'prova';
   	var prc = [];
        var arr = [];
        var nxt = dat.shift();
        arr.push([parseFloat(nxt.lat),parseFloat(nxt.lng)]);
	var i = 0;
	while ((dat.length > 0) && (i < 1000)){
            nxt = this.calc_next(nxt,dat);
            try{
            arr.push([parseFloat(nxt.lat),parseFloat(nxt.lng)]);
                    dat.splice( dat.indexOf(nxt),1);
            } catch (err){
                    //console.log(err,nxt,arr);
                    i = 100;
            }
	}
	  //console.log(arr);
	if (mapid in this.maplist){
	    if (polid in this.polylinelist){
                this.maplist[mapid].removeLayer(this.polylinelist[polid]);
            }
            this.polylinelist[polid] = new L.polyline(arr,{color : 'red'});
            this.polylinelist[polid].addTo(this.maplist[mapid]);
            //this.layerlist[map].addLayer(pol);
	}
    },
    datasetAdd : function(datid,dats)
    {
   	this.datasets[datid] = dats;
    },
    dataset_calc_route : function(mapid, datid, sta)
    {
        if (datid in this.datasets) {
            var data = this.datasets[datid].slice();
            if (sta){
                data.unshift(sta);
            }
            this.calc_perc(mapid,data);
        }
    },
    getLayer : function(mapId, layerId, clean)
    {
        if (!(layerId in this.layerlist)){
            this.layerlist[layerId] = new L.FeatureGroup();
            this.maplist[mapId].addLayer(this.layerlist[layerId]);
        } else if (clean){
            this.cleanLayer(layerId);
        }
        return this.layerlist[layerId];
    },
    cleanLayer : function(layerId)
    {
        if (layerId in this.layerlist){
            this.layerlist[layerId].clearLayers();
	}
    },
    computeCenter : function(mapId, dataset)
    {
        if (dataset.length === 0) {
            return;
        }
        var center = {'lat' : 0, 'lng' : 0};
        for (var i in dataset) {
            var rec = dataset[i];
            center.lat += rec['lat'];
            center.lng += rec['lng'];
        }
        center.lat = center.lat / (parseInt(i) + 1);
        center.lng = center.lng / (parseInt(i) + 1);
        this.setCenter(mapId, center);
    },
   markersClean : function(mapid)
   {
   },
   markersAdd : function(mapId, layerId, markers)
   {
        if (!(markers instanceof Array)){
            return;
        }
        for (var i in markers){
            var marker = markers[i];
            if (Osynapsy.isEmpty(marker.ico)) {
                continue;
            }
            if (!Osynapsy.isEmpty(marker.ico.text) && marker.ico.text.indexOf('fa-') === 0){
                var ico = L.AwesomeMarkers.icon({icon: marker.ico.text, prefix: 'fa', markerColor: marker.ico.color, spin:false});
            } else {
                var ico = L.divIcon({className: layerId+'-icon', html : marker.ico.text, iconSize:null});
            }
            var markerObject = L.marker(
                [marker.lat, marker.lng],
                {icon: ico}
            );
            if (marker.popup !== undefined){
                markerObject.bindPopup(marker.popup);
            }
            this.markerAppend(mapId, layerId, markerObject);
        }
   },
   markerAppend : function(mapId, layerId, marker)
   {
        if (!(layerId in this.layermarker)){
            this.layermarker[layerId] = {};
        }
        this.layermarker[layerId][mapId] = marker;
        this.getLayer(mapId, layerId).addLayer(marker);
   },
   polyline : function(mapId, layerId, dataset, polylineColor)
   {
        if (polylineColor === undefined || polylineColor === null) {
            polylineColor = 'red';
        }
        if (mapId in this.maplist) {
            var layer = this.getLayer(mapId, layerId, false);
            var polyline = new L.polyline(dataset, {color : polylineColor});
            polyline.addTo(layer);
        }
   },
   refreshDatagrid : function()
   {
        if (this.datagrid.length === 0) {
            return;
        }
        for(var i in this.datagrid) {
            var gridId = this.datagrid[i]; //Datagrid id
            ODataGrid.refreshAjax($('#'+gridId));
        }
   },
   refreshMarkers : function(mapId, dataGridId)
   {
        if (this.datagrid.length === 0){
            return;
	}
	var dataGrid = $('#'+dataGridId);
	if (!(f = dataGrid.data('mapgrid-infowindow-format'))) {
            f = null;
        }
	var dataset = [];
        //Se esiste pulisco il layer corrente
        this.cleanLayer(dataGridId);
        $('tr',dataGrid).each(function(){
            var frm = f;
            var i = 1;
            $(this).children().each(function(){
               if (f){
                   if (frm.indexOf('['+i+']') > -1) {
                       frm = frm.replace('['+i+']',$(this).html());
                    }
                } else {
                    frm += $(this).text() + '<br>';
                }
                i++;
            });
            if ($(this).attr('lat')){
                dataset.push({
                    lat : parseFloat($(this).attr('lat')),
                    lng : parseFloat($(this).attr('lng')),
                    oid : $(this).attr('oid'),
                    ico : {
                        text : 'fa-circle-o',
                        color: (Osynapsy.isEmpty($(this).attr('mrk')) ? 'blue' : $(this).attr('mrk'))
                    },
                    popup : '<div style="width: 250px; height: 120px; overflow: hidden;">'+ frm +'</div>'
                });
            }
        });
        if (this.autocenter) {
           this.computeCenter(mapId, dataset);
        }
        this.markersAdd(mapId, dataGridId, dataset);
        this.datasetAdd(dataGridId, dataset);
        this.autocenter = true;
    },
    setVertex : function(map)
    {
	var mapId = map.getContainer().getAttribute('id');
	var bounds = map.getBounds();
	var ne = bounds.getNorthEast();
	var sw = bounds.getSouthWest();
	$('#'+mapId+'_ne_lat').val(ne.lat);
	$('#'+mapId+'_ne_lng').val(ne.lng);
	$('#'+mapId+'_sw_lat').val(sw.lat);
	$('#'+mapId+'_sw_lng').val(sw.lng);
	$('#'+mapId+'_center').val(map.getCenter().toString().replace('LatLng(','').replace(')',''));
	$('#'+mapId+'_cnt_lat').val((sw.lat + ne.lat) / 2);
	$('#'+mapId+'_cnt_lng').val((sw.lng + ne.lng) / 2);
    },
    openId : function(oid,lid)
    {
   	console.log(oid,lid)
   	if (lid){
            if ((lid in this.layermarker) && (oid in this.layermarker[lid])){
		this.layermarker[lid][oid].openPopup();
            }
	} else {
            this.markerlist[oid].openPopup();
	}
    },
    resize : function(mapId)
    {
        if (mapId in this.maplist){
            this.maplist[mapId].invalidateSize();
	}
    },
    setCenter: function(mapId, cnt, zoom)
    {
   	self.maplist[mapId].setView(cnt, zoom);
    }
}

if (window.Osynapsy){
    Osynapsy.plugin.register('OclMapLeafletBox',function(){
        //OclMapLeafletBox.init();
        LealfletMapBox.init();
    });
}