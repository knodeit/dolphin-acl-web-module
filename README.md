### Installation
```npm install dolphin-acl-web-package --save```


### AclManagerConfigurationFactory

The factory has default methods:

methods:
* addModule - registration custom module

When you call "addModule" the plugin will apply new methods on your module. Also you must configure your acl files.

### Example

* Folder structure 
```
package_folder
   server
      acl
        some acl files.js 
```

* Acl file

```
module.exports = function () {
    return {
        label: 'Test', // any name
        package: 'test', // name of package
        get entities() {
            return {
                index: this.package + '_index' // some entities
            };
        },
        get routers() {
            return [
                {
                    roles: ['authenticated'], // role also can be [{name:'', role:''}] if you need to create new role 
                    allows: [
                        {entity: this.entities.index, permissions: ['get', 'post', 'put', 'delete'], disabled: ['get', 'post', 'put', 'delete']}
                    ]
                }
            ];
        },
        get labels() {
            return [
                {
                    name: 'Global',
                    labels: [
                        {
                            key: this.entities.index,
                            value: 'Index page'
                        }
                    ]
                }
            ];
        }
    };
};
```

* Your module will get the following methods: 

1) getRolesByEntity(entity) - return list of roles

2) checkAccess(entity) - return a function for express

3) canReadEntity(entity, user) - return a boolean value

4) canCreateEntity(entity, user) - return a boolean value

5) canUpdateEntity(entity, user) - return a boolean value

6) canDeleteEntity(entity, user) - return a boolean value
 


### Example
```
myModule.configureFactories(function (AclManagerConfigurationFactory) {
    //the first parameter is name of module for AngularJS
    //the second is variable of module
    AclManagerConfigurationFactory.addModule(myModule);
});
```

### Express

```
module.exports = function (WebServerConfigurationFactory) {
    var app = WebServerConfigurationFactory.getApp();
    
    //protection
    app.get('/', myModule.acl.checkAccess(myModule.acl.matrix.entities.index), ctrl.index);
};
```
