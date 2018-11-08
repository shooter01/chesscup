var gulp = require('gulp'),
    minifyCSS = require('gulp-minify-css'),
    concat = require('gulp-concat'),
uglify = require('gulp-uglify'),
    prefix = require('gulp-autoprefixer');



gulp.task('styles', function(){
    return gulp.src(['public/js/cg/assets/s.min.css','public/stylesheets/board.css','public/stylesheets/common.css','public/stylesheets/piece/cburnett.css'])
        .pipe(concat('game.css'))
        .pipe(minifyCSS())
        .pipe(prefix('last 2 versions'))
        .pipe(gulp.dest('public/stylesheets'))
});


gulp.task('js', function(){
    return gulp.src(['public/js/bootstrap/js/bootstrap.min.js'])
        .pipe(concat('popboot.js'))
        .pipe(prefix('last 2 versions'))
        .pipe(gulp.dest('public/js/bootstrap/js'))
});

/*
<link rel="stylesheet" href="/js/cg/assets/s.min.css">
    <link rel="stylesheet" href="/stylesheets/board.css">
    <link rel="stylesheet" href="/stylesheets/common.css">
    <link rel="stylesheet" href="/stylesheets/piece/cburnett.css">
    <link href="https://fonts.googleapis.com/css?family=Roboto:700" rel="stylesheet">*/
