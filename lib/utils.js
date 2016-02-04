var fs = require('fs');
var glob = require('glob');
var Promise = require("native-promise-only");

var whiteSpaceRe = / /g;

/**
 * Get an id by hyphen separating the name.
 *
 * @param {string} str - String to hyphenate.
 * @returns {string}
 */
function getId(str) {
  return str.toLowerCase().replace(whiteSpaceRe, '-');
}

/**
 * Asynchronously read a list of glob pattern files and pass the list of files to be read.
 *
 * @param {string[]} patterns - List of glob pattern files.
 * @param {function} callback - Callback to execute for each read file.
 * @returns {Promise}
 */
function readFileGlobs(patterns, callback) {
  return new Promise(function(resolve, reject) {
    patterns.forEach(function(pattern, index) {

      glob(pattern, function(err, files) {
        if (err) {
          reject(err);
        }

        if (files.length === 0) {
          console.warn('pattern "' + pattern + '" does not match any file');
        }

        readFiles(files, callback).then(function() {

          // all files have been read
          if (index === patterns.length - 1) {
            resolve();
          }
        });

      });

    });

  });
}

/**
 * Asynchronously read a list of files and call the callback function for each of them.
 *
 * @param {string[]} patterns - List of glob pattern files.
 * @param {function} callback - Callback to execute for each read file.
 * @returns {Promise}
 */
function readFiles(files, callback) {
  return new Promise(function(resolve, reject) {
    files.forEach(function(file, index) {

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          reject(err);
        }

        callback(data, file);

        // all files have been read
        if (index === files.length - 1) {
          resolve();
        }
      });

    });

  });
}

module.exports.getId = getId;
module.exports.readFileGlobs = readFileGlobs;
module.exports.readFiles = readFiles;