module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    pkg    : grunt.file.readJSON('package.json'),
    uglify : {
      options : {
        report : 'gzip',
        banner : '/*! <%= pkg.name %> (<%= pkg.repository.url %>) | v<%= pkg.version %> | <%= pkg.license %> */\n'
      },
      target  : {
        files : {
          'dm.min.js' : ['dm.js']
        }
      }
    }
  });
}
