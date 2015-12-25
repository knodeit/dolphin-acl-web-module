/**
 * Created by Vadim on 12/22/15.
 */
'use strict';

angular.module('dolphin.aclManager', []).provider('AclManager', function () {
    this.getMatrix = function () {
        return $dolphin.getObject('aclMatrix');
    };

    this.$get = [function () {
        return {};
    }];
});
