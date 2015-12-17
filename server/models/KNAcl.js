/**
 * Created by Vadim on 12/17/15.
 */
'use strict';
var Q = require('q');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AclSchema = new Schema({
    module: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: ''
    },
    entity: {
        type: String,
        default: ''
    },
    permissions: {
        type: Array
    },
    disabled: {
        type: Array
    }
},{collection: 'kn_acls'});

AclSchema.index({role: 1, entity: 1});

AclSchema.statics.updateRow = function (_id, permissions) {
    var deferred = Q.defer();
    var Acl = mongoose.model('Acl');
    Acl.findOne({_id: _id}).exec(function (err, row) {
        if (!row) {
            return deferred.reject(new Error('Row not found'));
        }

        row.permissions = permissions;
        row.save(function (err, row) {
            if (err) {
                console.error(err);
                return deferred.reject(new Error('Mongo error'));
            }

            deferred.resolve(row);
        });
    });
    return deferred.promise;
};

mongoose.model('Acl', AclSchema);