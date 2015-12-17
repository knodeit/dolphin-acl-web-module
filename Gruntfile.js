'use strict';

var paths = {
    js: ['*.js', './server']
};

module.exports = function (grunt) {

    if (process.env.NODE_ENV !== 'production') {
        require('time-grunt')(grunt);
    }

    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: {
                src: paths.js,
                options: {
                    jshintrc: true
                }
            }
        }
    });

    //Load NPM tasks
    require('load-grunt-tasks')(grunt);

    //Default task(s).
    grunt.registerTask('default', ['jshint']);
};
