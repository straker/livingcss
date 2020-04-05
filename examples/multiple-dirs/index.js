var path = require('path');

var livingcss = require('../../index');

livingcss('css/buttons.css', 'styleguide');
livingcss(path.join(__dirname, 'css/buttons.css'), 'styleguide');
livingcss(path.join(__dirname, 'css/buttons.css'), path.join(__dirname, 'styleguide'));
livingcss('css/buttons.css', path.join(__dirname, 'styleguide'));
