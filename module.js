/**
 * Created by Vadim on 12/8/15.
 */
'use strict';
var Module = require('dolphin-core-modules').Module;
var aclManager = new Module('AclManager', __dirname);
var Q = require('q');
var deferred = Q.defer();

aclManager.configureFactories(function (MongooseConfigurationFactory, WebServerConfigurationFactory) {
    WebServerConfigurationFactory.addPromise(deferred.promise);
    MongooseConfigurationFactory.addModule(aclManager);
});

aclManager.run(function (AclManagerConfigurationFactory, MongooseConfigurationFactory) {
    MongooseConfigurationFactory.events.end.then(function () {
        //load models
        var modules = AclManagerConfigurationFactory.getModules();
        for (var i in modules) {
            require('./acl')(modules[i]);
        }

        //for web server
        deferred.resolve();
    });
});