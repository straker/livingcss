/*jshint -W030 */

var expect = require('chai').expect;
var utils = require('../lib/utils');

describe('utils', function() {

  // --------------------------------------------------
  // sortSections
  // --------------------------------------------------
  describe('sortSections', function() {
    var sections;

    beforeEach(function() {
      var sectionOne = {
        name: 'Section One',
        parent: 'Section Three'
      };
      var sectionTwo = {
        name: 'Section Two'
      };
      var sectionThree = {
        name: 'Section Three',
        children: [sectionOne],
        parent: 'Section Four'
      };
      var sectionFour = {
        name: 'Section Four',
        children: [sectionThree]
      };

      sections = [sectionTwo, sectionFour];
    });

    it('should sort the root sections by sectionOrder', function() {
      utils.sortSections(sections, {sectionOrder: ['section four', 'section two']});

      expect(sections[0].name).to.equal('Section Four');
      expect(sections[1].name).to.equal('Section Two');
    });

    it('should sort any unlisted sections to the end of the list', function() {
      sections.unshift({name: 'Section Five'});

      utils.sortSections(sections, {sectionOrder: ['section four', 'section two']});

      expect(sections[0].name).to.equal('Section Four');
      expect(sections[1].name).to.equal('Section Two');
      expect(sections[2].name).to.equal('Section Five');
    });

  });

});