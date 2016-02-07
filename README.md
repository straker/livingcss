# Style Guide Generator

## Options

* template="defaultTempalte.hbs" - Path to the handlebars template to use for generating the HTML.
* partials=[] - List of glob files of handlebars partials used in the template.
* sectionOrder=[] - List of root section names (a section without a parent) in the order they should be sorted. Any root section not listed will be added to the end in the order encountered.
* tags={} - Custom tags and their callback functions to parse them. The function will have the tag, the parsed comment, the block object, the list of sections, and the file on the `this` object.
* minify=true - If the generated HTML should be minified.
* preprocess - Function that will get executed right before Handlebars is called with the context. Will be passed the context object, the Handlebars object, and the options passed to the StyleGuideGenerator as parameters.
* postprocess - Function that will get executed after the style guide has been created. Will be passed the context object, the Handlebars object, and the options passed to the StyleGuideGenerator as parameters.

## Supported block Tags (aka tags used in the template)

* section
* sectionof
* state
* example
* code=example
* language='markup'
* hideCode
* id=hyphenated section name (auto generated)

## Context

* sections
* allSections
* scripts
* stylesheets
* title

## explain

* tags 
    - how they work
    - how they get parsed (tag, type, name, description)
    - how to create a custom tag
    - the `this` object of a custom tag's function
    - what each object means in a custom tag's function (tag, comment, block, sections, file)
* how to add scripts or styles to page
    - how to add more Prism styles/scripts
* use Prism for code highlighting