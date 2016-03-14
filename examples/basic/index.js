var livingcss = require('../../index');

livingcss('buttons.css', {
  sortOrder: {'test this': ['buttons']},
  preprocess: function(context) {
    context.scripts.push('test.js');
  }
});