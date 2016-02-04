var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var parseComments = require('../lib/parseComments');

describe('parseComments', function() {

  it('should parse a single comment', function(done) {
    var file = path.join(__dirname, 'data/simple-tag.css');

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, function(block) {
        expect(block['tagName']).to.equal('tagValue');
        done();
      });
    });
  });

});