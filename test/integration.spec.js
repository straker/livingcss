/*jshint -W030 */

// test the index.js file and that everything works as expected
var expect = require('chai').expect;
var sinon = require('sinon');
var path = require('path');
var livingcss = require('../index');

describe('livingcss', function() {

  it('should resolve when all pages have been processed', function(done) {
    var file = path.join(__dirname, 'data/page-multiple-tags.css');
    var options = {
      preprocess: function(context) {
        return false;
      }
    };

    sinon.spy(options, 'preprocess');

    livingcss(file, '.', options).then(function() {
      expect(options.preprocess.called).to.be.true;
      expect(options.preprocess.callCount).to.equal(2);

      done();
    })
    .catch(function(e) {
      done(e);
    });
  });

});