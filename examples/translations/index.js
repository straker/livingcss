var livingcss = require('../../index');

livingcss('buttons.css', {
  tags: {
    // translate tag name into English name
    sección: function() {
      this.tag.tag = 'section';
      livingcss.tags.section.call(this);
    },
    ejemplo: function() {
      this.tag.tag = 'example';
      livingcss.tags.example.call(this);
    }
  },
  preprocess: function(context) {
    context.menuButtonHTML = '☰ Menú',
    context.footerHTML = 'Guía de Estilo generado con <a href="https://github.com/straker/livingcss">LivingCSS</a>.',
    context.title = 'LivingCSS Guía de Estilo'
  }
});