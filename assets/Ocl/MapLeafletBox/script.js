
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
    constructor(mapBox) 
    {        
        this.markerlist = {};
        this.layermarker = {};
        this.polylinelist = {};
        this.datasets = {};
        this.autocenter = true;

        if (mapBox) {
            this.initMapBox(mapBox);
        }
    }

    static initAll()
    {
        document.querySelectorAll('.osy-mapgrid-leaflet').forEach(el => new LeafletMapBox(el));
    }

    initMapBox(mapBox)
    {
        this.mapBox = mapBox;
        this.mapId = mapBox.getAttribute('id');

        let start = mapBox.getAttribute('coostart').split(',');
        let mapCenter = this.getMapBoxProperty(mapBox, 'center', mapBox.getAttribute('coostart')).split(',');
        let zoomLevel = this.getMapBoxProperty(mapBox, 'zoom', 10);        

        this.mapBoxFactory(mapBox, this.mapId, mapCenter, zoomLevel);                        
        this.assocDatagridsToMapBox(mapBox);
        mapBox.setVertex();
        if (!Osynapsy.isEmpty(mapBox.getAttribute('dataDrawPlugin'))) {
            this.enableDrawPlugin(mapBox.map);
        }        
        this.addMarker(mapBox.map, [start[0], start[1]], {'awesoneIcon' : 2 in start ? start[2] : 'map-marker'}); 
    }

    mapBoxFactory(mapBox, id, center, zlevel)
    {
        mapBox.map = L.map(id).setView(center, zlevel);
        mapBox.id = id;
        mapBox.map.box = mapBox;
        mapBox.datagrids = [];
        mapBox.layers = [];
        mapBox.markers = [];
        mapBox.setVertex = this.setVertex.bind(mapBox);        
        mapBox.addMarkersFromDatagrids = this.addMarkersFromDatagrids.bind(mapBox);
        mapBox.addMarker = this.addMarker;
        mapBox.map.addEventListener('moveend', function(e) {
            this.autocenter = false;
            this.box.setVertex();
        });

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { 
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' 
        }).addTo(mapBox.map);
    }

    assocDatagridsToMapBox(mapBox)
    {
        document.querySelectorAll('div[data-mapgrid=' + mapBox.getAttribute('id') +']').forEach(function(datagrid){
            mapBox.datagrids.push(datagrid.getAttribute('id'));
        });
    }

    getMapBoxProperty(mapBox, property, defaultValue = null)
    {
        let propertyId = '#' + mapBox.getAttribute('id') + '_' + property;
        let propertyEl = document.querySelector(propertyId);
        let propertyValue = propertyEl ? propertyEl.value : null;
        return Osynapsy.isEmpty(propertyValue) ? defaultValue : propertyValue;
    }

    setVertex()
    {
        let mapId = this.getAttribute('id');
        let bounds = this.map.getBounds();
        let ne = bounds.getNorthEast();
        let sw = bounds.getSouthWest();
        document.getElementById(mapId+'_ne_lat').value = ne.lat;
        document.getElementById(mapId+'_ne_lng').value = ne.lng;
        document.getElementById(mapId+'_sw_lat').value = sw.lat;
        document.getElementById(mapId+'_sw_lng').value = sw.lng;
        document.getElementById(mapId+'_center').value = this.map.getCenter().toString().replace('LatLng(','').replace(')','');
        document.getElementById(mapId+'_cnt_lat').value = (sw.lat + ne.lat) / 2;
        document.getElementById(mapId+'_cnt_lng').value = (sw.lng + ne.lng) / 2;
        Osynapsy.refreshComponents(this.datagrids, () => {this.addMarkersFromDatagrids(); });
    }

    addMarkersFromDatagrids()
    {
        let self = this;
        this.datagrids.forEach(did => {
            let dg = document.getElementById(did);
            dg.querySelectorAll('div.row').forEach(elm => {
                let mrk = elm.getAttribute('marker');
                let popup = elm.firstElementChild.innerHTML;
                if (mrk) {
                    let dat = mrk.split(',');
                    self.addMarker(self.map, [dat[0], dat[1]], {'awesomeIcon' : dat[2], 'popup' : popup});
                }
            });
        });
    }

    addMarker(map, coords, options = {})
    {        
        if (!map.box.markerlist) {
            map.box.markerlist = [];
        }

        // controllo se le coordinate sono già presenti
        let exists = map.box.markerlist.some(m => {
            let ll = m.getLatLng();
            return ll.lat === coords[0] && ll.lng === coords[1];
        });

        if (exists) {
            console.log("Marker già presente in queste coordinate:", coords);
            return null; // esco senza aggiungere
        }
        let markerOptions = {};
        if (options.iconUrl) {
            markerOptions.icon = L.icon({
                iconUrl: options.iconUrl,
                iconSize: options.iconSize || [25, 41],
                iconAnchor: options.iconAnchor || [12, 41],
                popupAnchor: options.popupAnchor || [0, -41]
            });
        }
        if (options.awesomeIcon) {
            let color = options.iconColor || "red";   // colore del pin
            let size  = options.iconSize || "fa-3x";  // es. fa-sm, fa-lg, fa-2x, ecc.
            let icon  = options.awesomeIcon;          // es. "fa-solid fa-coffee"
            markerOptions.icon = L.divIcon({
                html: `<i class="fa fa-${icon} ${size}" style="color:${color}"></i>`,
                className: 'custom-fa-marker',
                iconSize: options.divIconSize || [30, 42],
                iconAnchor: options.iconAnchor || [15, 42],
                popupAnchor: options.popupAnchor || [0, -42]
            });
        }        
        if (options.draggable) {
            markerOptions.draggable = true;
        }
        let marker = L.marker(coords, markerOptions).addTo(map);
        if (options.popup) {
            marker.bindPopup(options.popup);
        }       
        map.box.markerlist.push(marker);
        return marker;
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
