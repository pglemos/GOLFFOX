import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class GxMap extends StatelessWidget {
  const GxMap({
    required this.center,
    this.zoom = 12,
    this.markers = const {},
    this.polylines = const {},
    this.polygons = const {},
    this.legend,
    super.key,
  });

  final LatLng center;
  final double zoom;
  final Set<Marker> markers;
  final Set<Polyline> polylines;
  final Set<Polygon> polygons;
  final Widget? legend;

  @override
  Widget build(BuildContext context) => Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: center,
              zoom: zoom,
            ),
            markers: markers,
            polylines: polylines,
            polygons: polygons,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
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
