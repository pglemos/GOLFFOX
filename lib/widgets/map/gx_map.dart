import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart' as flutter_map;
import 'package:latlong2/latlong.dart';

class GxMap extends StatelessWidget {
  final LatLng center;
  final double zoom;
  final List<flutter_map.Marker> markers;
  final List<flutter_map.Polyline> polylines;
  final List<flutter_map.Polygon> polygons;
  final Widget? legend;

  const GxMap({
    super.key,
    required this.center,
    this.zoom = 12,
    this.markers = const [],
    this.polylines = const [],
    this.polygons = const [],
    this.legend,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        flutter_map.FlutterMap(
          options:
              flutter_map.MapOptions(initialCenter: center, initialZoom: zoom),
          children: [
            flutter_map.TileLayer(
              urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              subdomains: const ['a', 'b', 'c'],
              userAgentPackageName: 'com.golffox.app',
            ),
            if (polylines.isNotEmpty)
              flutter_map.PolylineLayer(polylines: polylines),
            if (polygons.isNotEmpty)
              flutter_map.PolygonLayer(polygons: polygons),
            if (markers.isNotEmpty) flutter_map.MarkerLayer(markers: markers),
          ],
        ),
        if (legend != null)
          Positioned(
            bottom: 12,
            right: 12,
            child: legend!,
          ),
      ],
    );
  }
}
