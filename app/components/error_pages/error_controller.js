/**
 * @license Ulakbus-UI
 * Copyright (C) 2015 ZetaOps Inc.
 *
 * This file is licensed under the GNU General Public License v3
 * (GPLv3).  See LICENSE.txt for details.
 */

'use strict';

angular.module('ulakbus').config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/error/500', {
            templateUrl: 'components/error_pages/500.html',
            controller: '500Controller'
        })
        .when('/error/404', {
            templateUrl: 'components/error_pages/404.html',
            controller: '404Controller'
        });
}]);

angular.module('ulakbus.error_pages', ['ngRoute'])

    .controller('500Controller', function ($scope, $rootScope, $location) {
    })

    .controller('404Controller', function ($scope, $rootScope, $location) {
    });