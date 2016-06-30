var livingcss = require('../../index');
var sass = require('node-sass');
var fs = require('fs');

// output the css file
fs.writeFileSync('buttons.css',
  sass.renderSync({
    file: 'buttons.scss'
  }).css
);

// parse the preprocessor file for comments
livingcss('buttons.scss', '.', {

  // load the processed css file for the examples
  preprocess: function(context, template, Handlebars) {
    context.stylesheets.push('buttons.css');
  }
});