/**
 * Created by Vadim on 12/17/15.
 */
'use strict';
var _ = require('lodash');
var Logger = require('dolphin-logger');
var FSUtil = require('dolphin-core-utils').FS;
var util = require('util');
var mongoose = require('mongoose');
var Q = require('q');

function _loadLabel(module, moduleName, item) {
    var AclLabel = mongoose.model('AclLabel');
    AclLabel.count({module: module, entityName: item.name, 'auditing.deleted': false}).exec(function (err, count) {
        if (count > 0) {
            return;
        }
        var row = new AclLabel({
            module: module,
            moduleName: moduleName,
            entityName: item.name,
            labels: item.labels
        });
        row.save();
    });
}

function saveRole(name, role) {
    var AclRole = mongoose.model('AclRole');
    var row = {
        name: name,
        role: role,
        registrationRole: false,
        'auditing.deleted': false,
        'auditing.canbedeleted': false
    };
    AclRole.update({role: role}, {$setOnInsert: row}, {upsert: true}, function (err) {
        if (err) {
            console.error('saveRole', err);
        }
    });
}

function getAction(method) {
    var action = null;
    switch (method) {
        case 'get':
        case 'head':
            action = 'view';
            break;

        case 'post':
            action = 'create';
            break;

        case 'put':
        case 'patch':
            action = 'edit';
            break;

        case 'delete':
            action = 'delete';
            break;
    }
    return action;
}

function _checkAccessByEntity($this, entity, user, method) {
    var deferred = Q.defer();

    if (!entity) {
        return Q.resolve(true);
    }

    if ($this.isDisabled) {
        return deferred.resolve(false);
    }

    $this._getAllow(entity).then(function (rows) {
        var isAllow = false;
        if (!user) {
            user = {
                roles: []
            };
        }
        var roles = user.roles.slice();
        if (user.roles.length > 0) {
            roles.push('authenticated');
        } else {
            roles.push('guest');
        }

        main:
            for (var i in roles) {
                var userRole = roles[i];
                for (var j in rows) {
                    var row = rows[j];
                    if (row.role == userRole && row.permissions.indexOf(method) >= 0) {
                        isAllow = true;
                        break main;
                    }
                }
            }

        return deferred.resolve(isAllow);
    });
    return deferred.promise;
}

var acl = {
    _run: function (module) {
        this.matrix = null;
        this.aclPromise = Q.resolve();

        //load own acl
        var files = FSUtil.readDirSync(module.source + '/server/acl/**/*.js');
        files.forEach(function (file) {
            console.log(file);
            this.matrix = require(file)();

            //load acl
            if (this.matrix.routers) {
                this._saveRoles(this.matrix.routers);
                this.aclPromise = this._init(this.matrix.routers);
            }
        }.bind(this));

        this._loadLabels();
    },
    _getPromise: function () {
        return this.aclPromise;
    },
    _loadLabels: function () {
        if (!this.matrix) {
            return;
        }

        this.matrix.labels.forEach(function (item) {
            _loadLabel(this.name, this.matrix.label, item);
        }.bind(this));
    },
    _saveRoles: function (routers) {
        if (!util.isArray(routers)) {
            routers = [routers];
        }

        for (var i in routers) {
            var router = routers[i];
            var roles = router.roles;

            for (var j in roles) {
                if (typeof roles[j] === 'string') {
                    saveRole(roles[j], roles[j]);
                } else {
                    saveRole(roles[j].name, roles[j].role);
                }
            }
        }
    },
    _init: function (routers) {
        var deferred = Q.defer();

        if (!util.isArray(routers)) {
            routers = [routers];
        }

        var funcs = [];
        for (var i in routers) {
            var router = routers[i];
            var roles = router.roles;
            if (!util.isArray(roles)) {
                roles = [roles];
            }

            for (var j in roles) {
                var role = roles[j];

                for (var k in router.allows) {
                    if (typeof role === 'object') {
                        role = role.role;
                    }
                    funcs.push(this._createIfExists(role, router.allows[k].entity, router.allows[k].permissions, router.allows[k].disabled, router.allows[k].canbedeleted));
                }
            }
        }
        Q.all(funcs).then(function () {
            deferred.resolve();
        });
        return deferred.promise;
    },
    _createIfExists: function (role, entity, permissions, disabled, canbedeleted) {
        var deferred = Q.defer();
        var Acl = mongoose.model('Acl');
        Acl.count({role: role, entity: entity}).exec(function (err, count) {
            if (count > 0) {
                return deferred.resolve();
            }

            this._allow(role, entity, permissions, disabled, canbedeleted).then(function () {
                Logger.info('Acl installing role:', role, 'for entity:', entity);
                deferred.resolve();
            });
        }.bind(this));
        return deferred.promise;
    },
    _allow: function (role, entity, permissions, disabled, canbedeleted) {
        var deferred = Q.defer();
        var Acl = mongoose.model('Acl');
        var row = new Acl({
            module: this.name,
            role: role,
            entity: entity,
            permissions: util.isArray(permissions) ? permissions : [permissions],
            disabled: util.isArray(disabled) ? disabled : [disabled],
            'auditing.canbedeleted': typeof canbedeleted == 'undefined' ? false : canbedeleted
        });
        row.save(function (err, row) {
            deferred.resolve();
        });
        return deferred.promise;
    },
    _getAllow: function (entity) {
        var deferred = Q.defer();
        var Acl = mongoose.model('Acl');
        var query = {
            'auditing.deleted': false
        };
        if (entity) {
            query.entity = entity;
        }
        Acl.find(query).exec(function (err, rows) {
            deferred.resolve(rows);
        });
        return deferred.promise;
    },
    getRolesByEntity: function (entity) {
        var deferred = Q.defer();
        this._getAllow(entity).then(function (rows) {
            var roles = [];
            for (var i in rows) {
                roles.push(rows[i].role);
            }
            deferred.resolve(roles);
        });
        return deferred.promise;
    },
    getAngularObj: function () {
        var deferred = Q.defer();
        this._getAllow().then(function (rows) {
            var abilities = {};
            for (var i in rows) {
                var row = rows[i];
                if (!abilities[row.role]) {
                    abilities[row.role] = [];
                }

                var actions = row.permissions.map(function (method) {
                    return row.entity + '_' + getAction(method);
                });

                abilities[row.role] = abilities[row.role].concat(actions);
            }
            deferred.resolve(abilities);
        }.bind(this));
        return deferred.promise;
    },
    checkAccess: function (entity) {
        var $this = this;
        return function (req, res, next) {
            if (!req.user) {
                return res.status(403).send('User is not authorized');
            }

            $this._getAllow(entity).then(function (rows) {
                if (rows.length === 0) {
                    return next();
                }

                var method = req.method.toLowerCase();
                var roles = req.user.roles.slice();
                var isAllow = false;

                roles.push('authenticated');
                main:
                    for (var i in roles) {
                        var userRole = roles[i];
                        for (var j in rows) {
                            var row = rows[j];
                            if (row.role == userRole && row.permissions.indexOf(method) >= 0) {
                                isAllow = true;
                                break main;
                            }
                        }
                    }

                if (!isAllow) {
                    return res.status(403).send('Access denied');
                }

                if ($this.isDisabled) {
                    return res.status(404).send('Package disabled');
                }

                //allow
                next();
            });
        };
    },
    canReadEntity: function (entity, user) {
        return _checkAccessByEntity(this, entity, user, 'get');
    },
    canCreateEntity: function (entity, user) {
        return _checkAccessByEntity(this, entity, user, 'post');
    },
    canUpdateEntity: function (entity, user) {
        return _checkAccessByEntity(this, entity, user, 'put');
    },
    canDeleteEntity: function (entity, user) {
        return _checkAccessByEntity(this, entity, user, 'delete');
    }
};

module.exports = function (module) {
    //merge
    module.acl = {};
    _.assign(module.acl, acl);
    module.acl._run(module);
};
