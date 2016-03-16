var livingcss = require('../../index');
var Handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');

livingcss('buttons.css', {
  tags: {
    handlebarsExample: function() {
      var template = this.tag.description.trimRight();
      var resolvedPath = path.resolve(path.dirname(this.file), template);

      template = fs.readFileSync(resolvedPath, 'utf-8');

      this.tag.description = Handlebars.compile(template)(this.block);
      this.tag.tag = 'example';

      livingcss.tags.example.call(this);
    }
  }
});