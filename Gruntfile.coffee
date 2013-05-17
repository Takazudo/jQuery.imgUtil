module.exports = (grunt) ->
  
  grunt.task.loadTasks 'gruntcomponents/tasks'
  grunt.task.loadNpmTasks 'grunt-contrib-coffee'
  grunt.task.loadNpmTasks 'grunt-contrib-watch'
  grunt.task.loadNpmTasks 'grunt-contrib-concat'
  grunt.task.loadNpmTasks 'grunt-contrib-uglify'

  grunt.initConfig

    pkg: grunt.file.readJSON('package.json')
    banner: """
/*! <%= pkg.name %> (<%= pkg.repository.url %>)
 * lastupdate: <%= grunt.template.today("yyyy-mm-dd") %>
 * version: <%= pkg.version %>
 * author: <%= pkg.author %>
 * License: MIT */

"""

    growl:

      ok:
        title: 'COMPLETE!!'
        msg: '＼(^o^)／'

    coffee:

      imgutil:
        src: [ 'jquery.imgutil.coffee' ]
        dest: 'jquery.imgutil.js'
      test:
        src: ["tests/test.coffee"]
        dest: "tests/test.js"

    concat:

      banner:
        options:
          banner: '<%= banner %>'
        src: [ '<%= coffee.imgutil.dest %>' ]
        dest: '<%= coffee.imgutil.dest %>'
        
    uglify:

      options:
        banner: '<%= banner %>'
      imgutil:
        src: '<%= concat.banner.dest %>'
        dest: 'jquery.imgutil.min.js'

    watch:

      imgutil:
        files: '<%= coffee.imgutil.src %>'
        tasks: [
          'coffee:imgutil'
          'concat'
          'uglify'
          'growl:ok'
        ]
      test: 
        files: '<%= coffee.test.src %>'
        tasks: [
          'coffee:test'
          'growl:ok'
        ]

  grunt.registerTask 'default', [
    'coffee'
    'concat'
    'uglify'
    'growl:ok'
  ]

