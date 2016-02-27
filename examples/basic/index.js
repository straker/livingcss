var livingcss = require('../../index');

livingcss('buttons.css', 'index.html', {
  preprocess: function(context, Handlebars) {
    // console.log(JSON.stringify(context.sections,null,2));
    console.log(context.sections);

    context.scripts.push('https://cdn.jsdelivr.net/prism/1.4.1/components/prism-j.min.js', 'https://cdn.jsdelivr.net/prism/1.4.1/plugins/show-language/prism-show-language.min.js');
    context.stylesheets.push('https://cdn.jsdelivr.net/prism/1.4.1/plugins/show-language/prism-show-language.css');
  }
});