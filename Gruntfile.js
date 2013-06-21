module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    uglify: {
      options: {
        report : 'gzip'
      },
      target: {
        files: {
          'dm.min.js': ['dm.js']
        }
      }
    }
  });
}
