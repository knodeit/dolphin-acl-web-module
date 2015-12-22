/**
 * Created by Vadim on 12/22/15.
 */
'use strict';

angular.module('dolphin.aclManager', []).provider('AclManager', function () {
    this.$get = [function () {
        return {
            getMatrix: function () {
                return window.dolphin.aclMatrix;
            }
        };
    }];
});
