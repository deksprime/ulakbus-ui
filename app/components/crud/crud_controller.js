/**
 * @license Ulakbus-UI
 * Copyright (C) 2015 ZetaOps Inc.
 *
 * This file is licensed under the GNU General Public License v3
 * (GPLv3).  See LICENSE.txt for details.
 */

'use strict';

angular.module('ulakbus.crud', ['ui.bootstrap', 'schemaForm', 'formService'])

    /**
     * @name CrudUtility
     * @description
     * Crud Utility is a service to provide functionality for Crud controllers
     * @returns {object}
     */
    .service('CrudUtility', function ($log) {
        return {
            /**
             * @name generateParam
             * @description
             * generateParam is a function to generate required params to post backend api.
             *
             * @param scope
             * @param routeParams
             * @param cmd
             * @returns {*}
             */
            generateParam: function (scope, routeParams, cmd) {
                // define api request url path
                scope.url = routeParams.wf;
                // why do this??
                angular.forEach(routeParams, function (value, key) {
                    if (key.indexOf('_id') > -1 && key !== 'param_id') {
                        scope.param = key;
                        scope.param_id = value;
                    }
                });
                scope.form_params = {
                    cmd: cmd,
                    model: routeParams.model,
                    param: scope.param || routeParams.param,
                    id: scope.param_id || routeParams.param_id,
                    wf: routeParams.wf,
                    object_id: routeParams.key
                };
                scope.model = scope.form_params.model;
                scope.wf = scope.form_params.wf;
                scope.param = scope.form_params.param;
                scope.param_id = scope.form_params.id;
                return scope;
            },
            /**
             * @name listPageItems
             * @description
             * listPageItems is a function to prepare objects to list in list page.
             *
             * @param scope
             * @param pageData
             */
            listPageItems: function (scope, pageData) {
                angular.forEach(pageData, function (value, key) {
                    scope[key] = value;
                });
                angular.forEach(scope.objects, function (value, key) {
                    if (value!=='-1') {
                        var linkIndexes = {};
                        angular.forEach(value.actions, function (v, k) {
                            if (v.show_as === 'link') {linkIndexes = v}
                        });
                        angular.forEach(value.fields, function (v, k) {
                            scope.objects[key].fields[k] = {type: linkIndexes.fields.indexOf(k) > -1 ? 'link' : 'str', content: v, cmd: linkIndexes.cmd};
                        });
                    }
                });
                $log.debug(scope.objects);
            }
        }
    })

    /**
     * @name CRUDCtrl
     * @description
     * CRUDCtrl controller is base controller for crud module to redirect to related controller
     * This controller play an empty role for api calls.
     * With response data, location path change to related controller
     *
     * @returns {object}
     */
    .controller('CRUDCtrl', function ($scope, $routeParams, Generator, CrudUtility) {
        // get required params by calling CrudUtility.generateParam function
        CrudUtility.generateParam($scope, $routeParams);
        Generator.get_wf($scope);
    })

    /**
     * @name CRUDListFormCtrl
     * @description
     * CRUDListFormCtrl is the main controller for crud module
     * Based on the client_cmd parameter it generates its scope items.
     * client_cmd can be in ['show', 'list', 'form', 'reload', 'refresh']
     * There are 3 directives to manipulate controllers scope objects in crud.html
     *
     * The controller works in 2 ways, with and without pageData.
     * If pageData has set, using Generator's getPageData() function, sets its scope items. After getting pageData
     * pageData must be set to `{pageData: false}` for clear scope of next job.
     *
     * If pageData has not set using Generator's get_wf() function gets scope items from api call.
     *
     * @returns {object}
     */
    .controller('CRUDListFormCtrl', function ($scope, $rootScope, $location, $http, $log, $modal, $timeout, Generator, $routeParams, CrudUtility) {
        if ($routeParams.cmd === 'show') {
            CrudUtility.generateParam($scope, $routeParams, $routeParams.cmd);
            // todo: refactor createListObjects func
            var createListObjects = function () {
                angular.forEach($scope.object, function (value, key) {
                    if (typeof value == 'object') {
                        $scope.listobjects[key] = value;
                        delete $scope.object[key];
                    }
                });
            };

            $scope.listobjects = {};

            var pageData = Generator.getPageData();
            if (pageData.pageData === true) {
                $scope.object = pageData.object;
                Generator.setPageData({pageData: false});
            }
            else {
                // call generator's get_single_item func
                Generator.get_single_item($scope).then(function (res) {
                    $scope.object = res.data.object;
                    $scope.model = $routeParams.model;
                });
            }
            createListObjects();
        }

        if ($routeParams.cmd === 'form' || $routeParams.cmd === 'list') {
            // function to set scope objects
            var setpageobjects = function (data) {
                CrudUtility.listPageItems($scope, data);
                Generator.generate($scope, data);
                Generator.setPageData({pageData: false});
            };

            // get pageData from service
            var pageData = Generator.getPageData();

            // if pageData exists do not call get_wf function and manipulate page with pageData
            if (pageData.pageData === true) {
                $log.debug('pagedata', pageData.pageData);
                CrudUtility.generateParam($scope, pageData, $routeParams.cmd);
                setpageobjects(pageData, pageData);
            }
            // if pageData didn't defined or is {pageData: false} go get data from api with get_wf function
            if (pageData.pageData === undefined || pageData.pageData === false) {
                CrudUtility.generateParam($scope, $routeParams, $routeParams.cmd);
                Generator.get_wf($scope);
            }

            // we use form generator for generic forms. this makes form's scope to confuse on the path to generate form
            // object by its name. to manage to locate the form to controllers scope we use a directive called form locator
            // a bit dirty way to find form working on but solves our problem
            $scope.$on('formLocator', function (event) {
                $scope.formgenerated = event.targetScope.formgenerated;
            });

            $scope.onSubmit = function (form) {
                $scope.$broadcast('schemaFormValidate');
                if (form.$valid) {
                    Generator.submit($scope);
                }
            };

            $scope.do_action = function (key, cmd) {
                Generator.doItemAction($scope, key, cmd);
            };

            $scope.getNumber = function (num) {
                return new Array(num);
            };
        }

        if ($routeParams.cmd === 'reload') {
            $scope.reload({});
        }

        if ($routeParams.cmd === 'reset') {
            delete $scope.token;
            $scope.cmd = 'reset';
            Generator.get_wf($scope);
        }

        // reloadData must be a json object
        $scope.reload = function (reloadData) {
            $scope.form_params.cmd = $scope.reload_cmd;
            $scope.form_params = angular.extend($scope.form_params, reloadData);
            $log.debug('reload data', $scope);
            Generator.get_wf($scope);
        };
    })

    .directive('crudListDirective', function () {
        return {
            templateUrl: 'components/crud/templates/list.html',
            restrict: 'E',
            replace: true
        };
    })

    .directive('crudFormDirective', function () {
        return {
            templateUrl: 'components/crud/templates/form.html',
            restrict: 'E',
            replace: true
        };
    })

    .directive('crudShowDirective', function () {
        return {
            templateUrl: 'components/crud/templates/show.html',
            restrict: 'E',
            replace: true
        };
    })

    .directive('formLocator', function () {
        return {
            link: function (scope) {
                scope.$emit('formLocator');
            }
        }
    });