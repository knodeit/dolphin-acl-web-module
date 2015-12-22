/**
 * Created by Vadim on 12/8/15.
 */
'use strict';
var Module = require('dolphin-core-modules').Module;
var aclManager = new Module('AclManager', __dirname);
var Q = require('q');
var fs = require('fs');
var deferred = Q.defer();

aclManager.configureFactories(function (MongooseConfigurationFactory, AssetManagerConfigurationFactory, AngularJsConfigurationFactory) {
    AssetManagerConfigurationFactory.addPromise(deferred.promise);
    MongooseConfigurationFactory.addModule(aclManager);
    MongooseConfigurationFactory.plugins.push(__dirname + '/auditing.js');
    AngularJsConfigurationFactory.addModule('dolphin.aclManager', aclManager);
});

aclManager.run(function (AclManagerConfigurationFactory, MongooseConfigurationFactory, AssetManagerConfigurationFactory) {
    MongooseConfigurationFactory.events.end.then(function () {
        //load models
        var funcs = [];
        var module = null;
        var modules = AclManagerConfigurationFactory.getModules();
        for (var i in modules) {
            require('./acl')(modules[i]);
            funcs.push(modules[i]._getPromise());
            module = modules[i];
        }

        Q.all(funcs).then(function () {
            if (!module) {
                //for web server
                return deferred.resolve();
            }

            module.getAngularObj().then(function (obj) {

                //making a file
                var file = __dirname + '/matrix.js';
                fs.writeFileSync(file, 'window.dolphin.aclMatrix=' + JSON.stringify(obj) + ';', 'utf-8');
                AssetManagerConfigurationFactory.addCustomScript(file);

                deferred.resolve();
            });
        });
    });
});