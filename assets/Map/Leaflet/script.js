
/*
 * This file is part of the Osynapsy package.
 *
 * (c) Pietro Celeste <p.celeste@osynapsy.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class LeafletMapBox
{
    datagrids = [];
    layers = {};    
    markers = [];
    polylinelist = {};
    autocenter = false;
    
    constructor(box) 
    {
        if (!box.classList.contains('osy-leaflet-mapbox')) {
            throw new Error('Element isn\'t mapgrid-leaflet element');
        }
        let containerId = box.getAttribute('id'); 
        let start = JSON.parse(box.getAttribute('data-center')); 
        this.map = this.mapFactory(
            containerId,
            this.getMapBoxProperty(box, 'center', start.coordinates),
            this.getMapBoxProperty(box, 'zoom', box.getAttribute('zoomLevel') ?? 10)
        );
        this.assocDatagridsToMapBox(containerId);
        this.addMarker(this.map, this.getLayer('center'), start); 
        this.setVertex(containerId);        
    }
    
    mapFactory(containerId, center, zoomlevel)
    {        
        let self = this;
        let map = L.map(containerId).setView(
            typeof center === 'string' ?  center.split(',').map(Number) : center,
            zoomlevel
        );        
        map.addEventListener('moveend', (e) => {            
            self.autocenter = false;
            self.setVertex(containerId);
        });
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { 
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' 
        }).addTo(map);
        return map;
    }
    
    assocDatagridsToMapBox(containerId)
    {
        let self = this;
        document.querySelectorAll('div[data-mapgrid=' + containerId +']').forEach((datagrid) => {
            let datagridId = datagrid.getAttribute('id');
            self.datagrids.push(datagridId);
            document.addEventListener('afterRefresh', e => {                
                if (e.detail.componentId === datagridId) {
                   self.addMarkersFromDatagrids();
                }
            });            
        });
    }
    
    addMarkersFromDatagrids()
    {
        let self = this;        
        this.datagrids.forEach(datagridId => {            
            let dg = document.getElementById(datagridId);
            self.removeLayer(datagridId);
            dg.querySelectorAll('div.row').forEach(elm => {                
                if (elm.getAttribute('marker')) {                    
                    let marker = JSON.parse(elm.getAttribute('marker'));
                    marker.popup = Array.from(elm.querySelectorAll('.popup')).map(el => el.innerHTML).join('');                    
                    self.markers.push(self.addMarker(self.map, this.getLayer(datagridId), marker));
                }
            });
        });
    }

    addMarker(map, layer, rawMarker)
    {        
        // controllo se le coordinate sono già presenti
        let exists = this.markers.some(m => {
            let ll = m.getLatLng();
            return ll.lat === rawMarker.coordinates[0] && ll.lng === rawMarker.coordinates[1];
        });

        if (exists) {
            console.log("Marker già presente in queste coordinate:", rawMarker.coordinates);
            return null; // esco senza aggiungere
        }        
        let markerOptions = {};        
        if (rawMarker.options.awesomeIcon) {
            let color = rawMarker.options.iconColor || "green";   // colore del pin
            let size  = rawMarker.options.iconSize || "fa-3x";  // es. fa-sm, fa-lg, fa-2x, ecc.
            let icon  = rawMarker.options.awesomeIcon;          // es. "fa-solid fa-coffee"
            markerOptions.icon = L.divIcon({
                html: `<i class="fa fa-${icon} ${size}" style="color:${color}"></i>`,
                className: 'custom-fa-marker',
                iconSize: rawMarker.options.divIconSize || [30, 42],
                iconAnchor: rawMarker.options.iconAnchor || [15, 42],
                popupAnchor: rawMarker.options.popupAnchor || [0, -42]
            });
        } else if (rawMarker.options.iconUrl) {
            markerOptions.icon = L.icon({
                iconUrl: rawMarker.options.iconUrl,
                iconSize: rawMarker.options.iconSize || [25, 41],
                iconAnchor: rawMarker.options.iconAnchor || [12, 41],
                popupAnchor: rawMarker.options.popupAnchor || [0, -41]
            });            
        }        
        if (rawMarker.options.draggable) {
            markerOptions.draggable = true;
        }
        let marker = L.marker(rawMarker.coordinates, markerOptions).addTo(layer);        
        if (rawMarker.popup) {
            marker.bindPopup(rawMarker.popup);
        }
        if (rawMarker.options.markerId) {
            let row = document.getElementById(rawMarker.options.markerId);
            if (row) {
                row.addEventListener("click", () => marker.openPopup());
            }
        }       
        return marker;
    }

    getLayer(layerId)
    {
        if (!this.layers.hasOwnProperty(layerId)) {
            this.layers[layerId] = L.layerGroup().addTo(this.map);
        }
        return this.layers[layerId];
    }

    removeLayer(layerId)
    {        
        if (this.layers.hasOwnProperty(layerId)) {            
            this.map.removeLayer(this.layers[layerId]);
            delete this.layers[layerId];
            console.log('Layer '+ layerId + ' eliminato');
        }
    }

    setVertex(mapId)
    {        
        let self = this;
        let bounds = this.map.getBounds();
        let ne = bounds.getNorthEast();
        let sw = bounds.getSouthWest();
        console.log(this.datagrids);
        document.getElementById(mapId+'_ne_lat').value = ne.lat;
        document.getElementById(mapId+'_ne_lng').value = ne.lng;
        document.getElementById(mapId+'_sw_lat').value = sw.lat;
        document.getElementById(mapId+'_sw_lng').value = sw.lng;
        document.getElementById(mapId+'_center').value = this.map.getCenter().toString().replace('LatLng(','').replace(')','');
        document.getElementById(mapId+'_cnt_lat').value = (sw.lat + ne.lat) / 2;
        document.getElementById(mapId+'_cnt_lng').value = (sw.lng + ne.lng) / 2;
        document.getElementById(mapId+'_zoom').value = this.map.getZoom();        
        Osynapsy.refreshComponents(this.datagrids, () => { self.addMarkersFromDatagrids(); });
    }
    
    getMapBoxProperty(mapBox, property, defaultValue = null)
    {
        let propertyId = '#' + mapBox.getAttribute('id') + '_' + property;
        let propertyEl = document.querySelector(propertyId);
        let propertyValue = propertyEl ? propertyEl.value : null;
        return Osynapsy.isEmpty(propertyValue) ? defaultValue : propertyValue;
    }
    
    static initAll()
    {
        document.querySelectorAll('.osy-leaflet-mapbox').forEach(el => new LeafletMapBox(el));
    }
    
    enableDrawPlugin(map)
    {
        let LeafIcon = L.Icon.extend({
            options: {
                shadowUrl: 'http://leafletjs.com/docs/images/leaf-shadow.png',
                iconSize:     [38, 95],
                shadowSize:   [50, 64],
                iconAnchor:   [22, 94],
                shadowAnchor: [4, 62],
                popupAnchor:  [-3, -76]
            }
        });
        let greenIcon = new LeafIcon({
            iconUrl: 'http://leafletjs.com/docs/images/leaf-green.png'
        });

        let drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        let drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                polygon: {
                    shapeOptions: { color: 'purple' },
                    allowIntersection: false,
                    drawError: { color: 'orange', timeout: 1000 },
                    showArea: true,
                    metric: false,
                    repeatMode: true
                },
                polyline: { shapeOptions: { color: 'red' } },
                rect: { shapeOptions: { color: 'green' } },
                circle: { shapeOptions: { color: 'steelblue' } },
                marker: { icon: greenIcon }
            },
            edit: { featureGroup: drawnItems }
        });
        map.addControl(drawControl);

        map.addEventListener('draw:created', function (e) {
            let type = e.layerType,
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
    }

    enableRoutingPlugin(map)
    {
        L.Routing.control({
            waypoints: [
                L.latLng(57.74, 11.94),
                L.latLng(57.6792, 11.949)
            ]
        }).addTo(map);
    }
}

if (window.Osynapsy){
    Osynapsy.plugin.register('OclMapLeafletBox',function(){        
       LeafletMapBox.initAll();
    });
}
