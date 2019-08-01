var livingcss = require('../../index');

livingcss('buttons.css', {
  preprocess: function(context) {
      console.log(JSON.stringify(context, null, 2));
  }
});