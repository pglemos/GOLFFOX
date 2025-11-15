import 'package:flutter/material.dart';

import '../services/error_service.dart';
import '../services/logger_service.dart';

class GxRouterObserver extends NavigatorObserver {
  final _logger = LoggerService.instance;

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _logger.info('Route push: name=${route.settings.name} path=${route.settings.arguments}');
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _logger.info('Route pop: name=${route.settings.name}');
  }

  @override
  void didRemove(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _logger.debug('Route remove: name=${route.settings.name}');
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    _logger.info('Route replace: new=${newRoute?.settings.name} old=${oldRoute?.settings.name}');
  }

  void onError(Object error, StackTrace stack) {
    ErrorService.instance.reportError(error, stack, context: 'routing');
  }
}

