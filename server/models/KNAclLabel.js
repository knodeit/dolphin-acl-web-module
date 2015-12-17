/**
 * Created by Vadim on 12/17/15.
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AclLabelSchema = new Schema({
    module: {
        type: String,
        default: ''
    },
    moduleName: {
        type: String,
        default: ''
    },
    entityName: {
        type: String,
        default: ''
    },
    labels: {
        type: Array
    }
},{collection: 'kn_acl_labels'});

AclLabelSchema.index({module: 1, name: 1});
mongoose.model('AclLabel', AclLabelSchema);