/**
 * Created by Vadim on 12/9/15.
 */
'use strict';
var _ = require('lodash');
var modules = [];

module.exports = {
    name: 'Configuration',
    entity: {
        addModule: function (module) {
            modules.push(module);
        },
        getModules: function () {
            return _.uniq(modules);
        }
    }
};