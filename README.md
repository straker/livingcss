[![GitHub version](https://badge.fury.io/gh/straker%2Flivingcss.svg)](https://badge.fury.io/gh/straker%2Flivingcss)
[![Build Status](https://travis-ci.org/straker/livingcss.svg?branch=master)](https://travis-ci.org/straker/livingcss)

# LivingCSS

Parse comments in your CSS to generate a living style guide. Uses [Handlebars](http://handlebarsjs.com/) templates and [Prism](http://prismjs.com/) syntax highlighter to generate the style guide.

## Installation

`$ npm install --save livingcss`

## Usage

```js
var livingcss = require('livingcss');

// livingcss(source, dest, options)
livingcss('input.css', 'styleguide.html', options);
```

* source - A single file, list of files, or glob file paths to be parsed to generate the style guide. Any file type can be used so long as it allows `/** */` type comments.
* dest - Path of the file for the generated HTML.
* options - optional list of [options](#options).

## How it works

LivingCSS parses JSDoc-like comments for documentation in order to create a living style guide. A documentation comment follows the following format.

```css
/**
 * A shot description or lengthy explanation about the style. Will be parsed
 * using `markdown`.
 *
 * @section Section Name
 * @example
 * <div class="my-awesome-class">Example</div>
 */
```

What makes LivingCSS different than other tag-like comment parsers is that it does not try to impose a strict tag rule set. Instead, it defines a few basic tags for you to use, but any tag will be parsed so long as it follows the `@tag {type} name - description` format (where type, name, and description are all optional).

It also generates a JSON object of the parsed comments that can be used to generate style guides using other templating languages.

## Defined tags

* `@tag {type} name - description` - Any tag that follows this format will be parsed. The type, name, and description are all optional. If only the `tag` is defined, the description will be set to `true`.

* `@section` - Add a new section to the style guide. The `@section` tag can define the name of the section or the first line of the comment description will be used as the section name.
    
    ```css
    /**
     * My Section
     *
     * A description of the section and how to use it.
     *
     * @section
     */

    /**
     * A description of the section and how to use it.
     *
     * @section My Section
     */
    ```

* `@sectionof` - Add a section as a child of another section. There is no limit to the number of nested sections.

    ```css
    /**
     * A description of the parent section.
     *
     * @section Parent Section
     */

    /**
     * A description of the child section.
     *
     * @section Child Section
     * @sectionof Parent Section
     */
    ```

* `@example` - Provide an example that will be displayed in the style guide. Can provide a type to change the language for code highlighting, and you can also provide a file path to be used as the example. See Prisms [supported languages](http://prismjs.com/#languages-list) for valid types.

    ```css
    /**
     * A simple example.
     *
     * @section Example
     * @example
     * <div>foo</div>
     */

    /**
     * An example with a language type.
     *
     * @section Example
     * @example {javascript}
     * console.log('foo');
     */

    /**
     * An example from a file
     *
     * @section Example
     * @example
     * path/to/file.html
     */
    ```

* `@code` - Same as `@example`, but can be used to override the code output to be different than the example output. Useful if you need to provide extra context for the example that does not need to be shown in the code.

    ```css
    /**
     * Different example output than code output
     *
     * @section Code Example
     * @example
     * <div class="container">
     *   <div class="my-awesome-class">Example</div>
     * </div>
     *
     * @code
     * <div class="my-awesome-class">Example</div>
     */
    ```

* `@hideCode` -Hide the code output of the example.

    ```css
    /**
     * You can only see the example, the code is hidden.
     *
     * @section hideCode Example
     * @example
     * <div class="container">
     *   <div class="my-awesome-class">Example</div>
     * </div>
     * @hideCode
     */
    ```

## Options

* `loadcss` - If the style guide should load the css files that were used to generate it. The style guide will not move the styles to the output directory but will merely link to the styles in their current directory (so relative paths from the styles still work). Defaults to `true`.
* `minify` - If the generated HTML should be minified. Defaults to `false`.
* `preprocess` - Function that will be called right before Handlebars is called with the context object. The function will be passed a Promise `resolve` and `reject` object as parameters, and the context object and Handlebars object as the `this` object. Call `resolve` to generate the style guide using Handlebars, call `reject` otherwise (e.g. you want to use a different templating language). Use this function to modify the context object or register Handlebars partials, helpers, or decorators.
* `sectionOrder` - List of root section names (a section without a parent) in the order they should be sorted. Any root section not listed will be added to the end in the order encountered.
* `tags` - Object of custom tag names to callback functions that are called when the tag is encountered. The tag, the parsed comment, the block object, the list of sections, and the file are passed as the `this` object to the callback function.
* `template` - Path to the Handlebars template to use for generating the HTML. Defaults to the LivingCSS template `template/template.hbs'.`

```js
livingcss(['input.css', 'css/*.css'], 'styleguide.html', {
  loadcss: true,
  minify: true,
  preprocess: function(resolve, reject) {
    this.context.title = 'My Awesome Style Guide';
    resolve();
  },
  sectionOrder: ['buttons', 'forms', 'images'],
  tags: {
    color: function() {
      var section = this.sections[this.tag.description];

      if (section) {
        section.colors = section.colors || [];
        section.colors.push({
          name: this.tag.name,
          value: this.tag.type
        });
      }
    }
  },
  template: 'styleguide.hb'
});
```

## Custom Tags

You can create your own tags to modify how the documentation is generated. Because most tags are automatically parsed for you, you will not need to create custom tags very often. To create a custom tag, use the `options.tags` option.

A tag is defined as the tag name and a callback function that will be called when the tag is encountered. The current tag, the parsed comment, the block object, the list of sections, and the current file are passed as the `this` object to the callback function.

The comment is parsed using [comment-parser](https://github.com/yavorskiy/comment-parser), and the current tag and the parsed comment will follow the output returned by it. The block object is the current state of the comment, including the comments description, all parsed tags associated with the comment, and any other modifications done by other tags. The block object is also the object saved to the `sections` array when a `section` tag is used.

For example, if you wanted to generate a color palette for your style guide, you could create a custom tag to add the color to a section.

```css
/**
 * @color {#F00} Brand Red - Section Name
 */
```

```js
livingcss('input.css', 'styleguide.html', {
  tags: {
    color: function() {
      /* this.tag = {
          tag: 'color',
          type: '#F00',
          name: 'Brand Red'
          description: 'Section Name',
        } */
      var section = this.sections[this.tag.description];

      if (section) {
        section.colors = section.colors || [];
        section.colors.push({
          name: this.tag.name,
          value: this.tag.type
        });
      }
    }
  }
});
```

## Context Object

Use the `options.preprocess` option to modify or use the context object before it is passed to Handlebars. The function will be passed a Promise `resolve` and `reject` object as parameters, and the context object and Handlebars object as the `this` object. Call `resolve` to generate the style guide using Handlebars, call `reject` otherwise (e.g. you want to use a different templating language). Use this function to modify the context object or register Handlebars partials, helpers, or decorators.

```js
livingcss('input.css', 'styleguide.html', {
  preprocess: function(resolve, reject) {
    this.context.title = 'My Awesome Style Guide';
    resolve();
  }
});
```

* `scripts` - List of all JavaScript files to load in the style guide.
* `sections` - Modified array of all root sections (sections without a parent) and their children. List will be sorted by `options.sectionOrder`. Any section is also accessible by it's name for convenience (e.g. `sections['Section Name]`).
* `stylesheets` - List of all CSS files to load in the style guide. If the `options.loadcss` option is set, this list will contain all CSS files used to generate the style guide.
* `title` - Title of the style guide. Defaults to 'LivingCSS Style Guide'.