/**
 * Created by Vadim on 12/22/15.
 */
'use strict';

angular.module('dolphin.aclManager', ['mm.acl']).factory('AccessService', ['AclService', function (AclService) {
    return {
        canRead: function (entity) {
            return AclService.can(entity + '_view');
        },
        canCreate: function (entity) {
            return AclService.can(entity + '_create');
        },
        canEdit: function (entity) {
            return AclService.can(entity + '_edit');
        },
        canDelete: function (entity) {
            return AclService.can(entity + '_delete');
        }
    };
}
]).run(['AclService', function (AclService) {
    //init ACL
    AclService.setAbilities($dolphin.getObject('aclMatrix'));
}]);
