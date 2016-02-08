/**
 * Created by Vadim on 12/8/15.
 */
'use strict';
var Module = require('dolphin-core-modules').Module;
var aclManager = new Module('AclManager', __dirname);
var Q = require('q');
var deferred = Q.defer();

aclManager.configureFactories(function (MongooseConfigurationFactory, JsExporterConfigurationFactory, AngularJsConfigurationFactory, AssetManagerConfigurationFactory) {
    JsExporterConfigurationFactory.addPromise(deferred.promise);
    MongooseConfigurationFactory.addModule(aclManager);
    AngularJsConfigurationFactory.addModule('dolphin.aclManager', aclManager);
});

aclManager.run(function (AclManagerConfigurationFactory, MongooseConfigurationFactory, JsExporterConfigurationFactory) {
    MongooseConfigurationFactory.events.end.then(function () {
        //load models
        var funcs = [];
        var module = null;
        var modules = AclManagerConfigurationFactory.getModules();
        for (var i in modules) {
            require('./acl')(modules[i]);
            funcs.push(modules[i].acl._getPromise());
            module = modules[i];
        }

        Q.all(funcs).then(function () {
            if (!module) {
                //for web server
                return deferred.resolve();
            }

            module.acl.getAngularObj().then(function (matrix) {
                JsExporterConfigurationFactory.addObject('aclMatrix', matrix);
                deferred.resolve();
            });
        });
    });
});