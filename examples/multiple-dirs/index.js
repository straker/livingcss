var path = require('path');

var livingcss = require('../../index');

(async function() {
  try {
    // all these methods should work:
    await livingcss('css/buttons.css', 'styleguide');
    // await livingcss(path.join(__dirname, 'css/buttons.css'), 'styleguide');
    // await livingcss(path.join(__dirname, 'css/buttons.css'), path.join(__dirname, 'styleguide'));
    // await livingcss('css/buttons.css', path.join(__dirname, 'styleguide'));
  } catch (err) {
    console.error(err);
    console.error(err.stack);
  }
})();
