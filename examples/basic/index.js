var StyleGuideGenerator = require('../../index');

StyleGuideGenerator('buttons.css', 'index.html', { minify: false,
  preprocess: function(context) {
    // console.log(JSON.stringify(context,null,2));

    context.scripts.push('https://cdn.jsdelivr.net/prism/1.4.1/components/prism-j.min.js', 'https://cdn.jsdelivr.net/prism/1.4.1/plugins/show-language/prism-show-language.min.js');
    context.stylesheets.push('https://cdn.jsdelivr.net/prism/1.4.1/plugins/show-language/prism-show-language.css');
  }
});