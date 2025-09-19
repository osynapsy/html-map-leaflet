<?php

/*
 * This file is part of the Osynapsy package.
 *
 * (c) Pietro Celeste <p.celeste@osynapsy.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Osynapsy\Map\Leaflet;

use Osynapsy\Html\Tag;
use Osynapsy\Html\Component\AbstractComponent;
use Osynapsy\Html\Component\InputHidden;

class MapBox extends AbstractComponent
{
	private $map;
	private $dataGridParent = [];
        private $center = [
            'coordinates' => [
                '41.9002300',
                '12.4922260'
             ],
            'options' => [
                'awsomeIcon' => 'map-marker',
                'iconSize' => 'fa-3x',
                'iconColor' => 'blue'
             ],
            'popup' => ''
        ];

	public function __construct($name, $draw = true, $routing = true)
	{
            parent::__construct('dummy',$name);
            $this->map = $this->add($this->mapBoxFactory($name));
            $this->requireCss('Lib/leaflet-1.9.4/leaflet.css');
            $this->requireJs('Lib/leaflet-1.9.4/leaflet.js');
            $this->includeAwesomeMarkersPlugin();
            if ($draw) {
                $this->includeDrawPlugin();
            }
            if ($routing) {
                $this->includeRoutingPlugin();
            }
            $this->requireJs('Map/Leaflet/script.js');
            $this->add(new InputHidden($this->id.'_ne_lat'));
            $this->add(new InputHidden($this->id.'_ne_lng'));
            $this->add(new InputHidden($this->id.'_sw_lat'));
            $this->add(new InputHidden($this->id.'_sw_lng'));
            $this->add(new InputHidden($this->id.'_cnt_lat'));
            $this->add(new InputHidden($this->id.'_cnt_lng'));
            $this->add(new InputHidden($this->id.'_center'));
            $this->add(new InputHidden($this->id.'_zoom'));
	}

    protected function mapBoxFactory($id)
    {
        $mapBox = new Tag('div', $id, 'osy-mapgrid osy-mapgrid-leaflet');
        $mapBox->attribute('style', 'width: 100%; min-height: 600px;');
        return $mapBox;
    }

    private function includeAwesomeMarkersPlugin()
    {
        $this->requireCss('Lib/leaflet-awesome-markers-2.0.1/leaflet.awesome-markers.css');
	$this->requireJs('Lib/leaflet-awesome-markers-2.0.1/leaflet.awesome-markers.min.js');
    }

    private function includeRoutingPlugin()
    {
        $this->map->attribute('data-routing-plugin', true);
        $this->requireCss('Lib/leaflet-routing-machine-3.2.7/leaflet-routing-machine.css');
	$this->requireJs('Lib/leaflet-routing-machine-3.2.7/leaflet-routing-machine.min.js');
    }

    private function includeDrawPlugin()
    {
        $this->map->attribute('data-draw-plugin', true);
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

    public function preBuild()
    {
        if (!empty($this->center)) {
            $this->map->attribute('data-center', json_encode($this->center, JSON_HEX_APOS | JSON_HEX_QUOT));
        }
        if (empty($_REQUEST[$this->id.'_center'])) {
            $_REQUEST[$this->id.'_center'] = implode(',', $this->center['coordinates']);
        }
        $this->map->attribute('data-datagrid-parent', json_encode($this->dataGridParent));
    }

    public function setGridParent($gridId, $refreshOnMove = true)
    {
        $this->dataGridParent[] = ['id' => '#'.$gridId, 'refresh' => $refreshOnMove];
    }

    public function setCenter($latitude, $longitude, $popup = false, $awesomeIcon = 'map-marker', $iconColor = 'blue', $iconSize = 'fa-3x')
    {
        $this->center = [
            'coordinates' => [
                $latitude,
                $longitude
            ],
            'options' => [
                'awesomeIcon' => $awesomeIcon,
                'iconSize' => $iconSize,
                'iconColor' => $iconColor
            ],
            'popup' => $popup
        ];
    }

    public function setZoomLevel($level)
    {
        $this->map->attribute('zoomLevel', $level);
    }
}
