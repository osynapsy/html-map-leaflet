<?php

/*
 * This file is part of the Osynapsy package.
 *
 * (c) Pietro Celeste <p.celeste@osynapsy.org>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Osynapsy\Ocl\Map\Leaflet;

use Osynapsy\Html\Tag;
use Osynapsy\Html\Component;
use Osynapsy\Ocl\HiddenBox;

class MapBox extends Component
{
	private $map;
	private $dataGridParent = [];

	public function __construct($name, $draw = true, $routing = true)
	{
		parent::__construct('dummy',$name);
        $this->map = $this->add(new Tag('div'))->att([
            'id' => $name,
            'style' => 'width: 100%; min-height: 600px;',
            'class' => 'osy-mapgrid osy-mapgrid-leaflet'
        ]);
		$this->requireCss('Lib/leaflet-1.3.1/leaflet.css');
		$this->requireJs('Lib/leaflet-1.3.1/leaflet.js');
		$this->includeAwesomeMarkersPlugin();
        if ($draw) {
            $this->includeDrawPlugin();
        }
        if ($routing) {
            $this->includeRoutingPlugin();
        }
        $this->requireJs('Ocl/MapLeafletBox/script.js');
        $this->add(new HiddenBox($this->id.'_ne_lat'));
        $this->add(new HiddenBox($this->id.'_ne_lng'));
        $this->add(new HiddenBox($this->id.'_sw_lat'));
        $this->add(new HiddenBox($this->id.'_sw_lng'));
        $this->add(new HiddenBox($this->id.'_center'));
        $this->add(new HiddenBox($this->id.'_cnt_lat'));
        $this->add(new HiddenBox($this->id.'_cnt_lng'));
		$this->add(new HiddenBox($this->id.'_zoom'));
	}

    private function includeAwesomeMarkersPlugin()
    {
        $this->requireCss('Lib/leaflet-awesome-markers-2.0.1/leaflet.awesome-markers.css');
		$this->requireJs('Lib/leaflet-awesome-markers-2.0.1/leaflet.awesome-markers.min.js');
    }

    private function includeRoutingPlugin()
    {
        $this->map->att('data-routing-plugin', true);
        $this->requireCss('Lib/leaflet-routing-machine-3.2.7/leaflet-routing-machine.css');
		$this->requireJs('Lib/leaflet-routing-machine-3.2.7/leaflet-routing-machine.min.js');
    }

    private function includeDrawPlugin()
    {
        $this->map->att('data-draw-plugin', true);
        $this->requireCss('Lib/leaflet-draw-0.4.2/leaflet.draw.css');
        $this->requireJs('Lib/leaflet-draw-0.4.2/Control.Draw.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/Leaflet.draw.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/Leaflet.Draw.Event.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/Toolbar.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/Tooltip.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/ext/GeometryUtil.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/ext/LatLngUtil.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/ext/LineUtil.Intersect.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/ext/Polygon.Intersect.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/ext/Polyline.Intersect.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/ext/TouchEvents.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/DrawToolbar.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/handler/Draw.Feature.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/handler/Draw.SimpleShape.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/handler/Draw.Polyline.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/handler/Draw.Marker.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/handler/Draw.Circle.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/handler/Draw.CircleMarker.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/handler/Draw.Polygon.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/draw/handler/Draw.Rectangle.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/edit/EditToolbar.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/edit/handler/EditToolbar.Edit.js');
        $this->requireJs('Lib/leaflet-draw-0.4.2/edit/handler/EditToolbar.Delete.js');
    }

	public function __build_extra__()
	{

        /*foreach($this->att as $k => $v) {

			if (is_numeric($k)) {
                continue;
            }
			$this->map->att($k, $v, true);
		}*/
		if (empty($res)){
		  	$res = array(array('lat'=>41.9100711, 'lng'=>12.5359979));
		}
        $coordinateStart = $res[0]['lat'].','.$res[0]['lng'];
        $coordinateStart .= isset($res[0]['ico']) ? ','.$res[0]['ico'] : '';
		$this->map->att('coostart', $coordinateStart);
		if (empty($_REQUEST[$this->id.'_center'])) {
			$_REQUEST[$this->id.'_center'] = $res[0]['lat'].','.$res[0]['lng'];
		}
        $this->map->att('data-datagrid-parent', json_encode($this->dataGridParent));
	}

    public function setGridParent($gridId, $refreshOnMove = true)
    {
        $this->dataGridParent[] = ['id' => '#'.$gridId, 'refresh' => $refreshOnMove];
    }
}
