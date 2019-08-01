var livingcss = require('../../index');

livingcss('styles.css', {
  allSectionPages: true,
  preprocess: function(context) {
      console.log('\n\n');
      console.log(JSON.stringify(context.singleSection, null, 2));
  }
});