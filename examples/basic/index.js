var livingcss = require('../../index');

livingcss('buttons.css', 'index.html', {
  preprocess: function(resolve, reject) {
    // console.log(arguments);
    // console.log(this);

    // console.log(JSON.stringify(this.context.sections,null,2));
    // console.log(this.context.sections);

    // console.log(this.context);

    this.context.scripts.push('https://cdn.jsdelivr.net/prism/1.4.1/components/prism-j.min.js', 'https://cdn.jsdelivr.net/prism/1.4.1/plugins/show-language/prism-show-language.min.js');
    this.context.stylesheets.push('https://cdn.jsdelivr.net/prism/1.4.1/plugins/show-language/prism-show-language.css');

    resolve();
  }
});