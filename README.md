[![GitHub version](https://badge.fury.io/gh/straker%2Flivingcss.svg)](https://badge.fury.io/gh/straker%2Flivingcss)
[![Build Status](https://travis-ci.org/straker/livingcss.svg?branch=master)](https://travis-ci.org/straker/livingcss)
[![Coverage Status](https://coveralls.io/repos/github/straker/livingcss/badge.svg?branch=master)](https://coveralls.io/github/straker/livingcss?branch=master)

# LivingCSS

Parse comments in your CSS to generate a living style guide using Markdown, [Handlebars](http://handlebarsjs.com/), [Polymer](https://www.polymer-project.org/1.0/), and [Prism](http://prismjs.com/) syntax highlighter.

## Installation

`$ npm install --save livingcss`

## Demos

See the [github page](http://straker.github.io/livingcss) for an example of the default output of LivingCSS.

See [FamilySearch.org Style Guide](https://familysearch.org/reference/styleguide) for an example of using LivingCSS with custom tags and a custom Handlebars template.

## Gulp

Use [gulp-livingcss](https://github.com/straker/gulp-livingcss)

```js
var gulp = require('gulp');
var livingcss = require('gulp-livingcss');

gulp.task('default', function () {
  gulp.src('src/styles.css')
    .pipe(livingcss())
    .pipe(gulp.dest('dist'))
});
```

## Usage

```js
var livingcss = require('livingcss');

// livingcss(source, dest, options)
livingcss('input.css', 'styleguide', options);
```

* source - A file path, glob, or mixed array of both, matching files to be parsed to generate the style guide. Any file type can be used so long as it allows `/** */` type comments.
* dest - Directory to output the style guide HTML. Defaults to the current directory.
* options - optional list of [options](#options).

## How it works

LivingCSS parses JSDoc-like comments for documentation in order to create a living style guide. A documentation comment follows the following format.

```css
/**
 * A short description or lengthy explanation about the style. Will be parsed
 * using `markdown`.
 *
 * Descriptions can be multiple lines and end at the first encountered tag.
 * Tags can be in any order and can be multiple lines long as well.
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

  * If the type is `{markdown}`, the description will be parsed as markdown.

      ```css
      /**
       * @tag {markdown} *Will* be parsed as `markdown`.
       */
      ```

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

* `@sectionof` - Add a section as a child of another section. There is no limit to the number of nested sections. If the section you are referencing is a child of another section, then the value of `@sectionof` must use all parent section names delimited by a period.

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

    /**
     * A child of Child Section
     *
     * @section Grandchild Section
     * @sectionof Parent Section.Child Section
     */

    /**
     * A child of Grandchild Section
     *
     * @section Great-grandchild Section
     * @sectionof Parent Section.Child Section.Grandchild Section
     */
    ```

* `@page` - Add a section to a page. Each unique page will output its own HTML file. Child sections will inherit the page of the parent. Defaults to `index`.

    ```css
    /**
     * Section belonging to a page.
     *
     * @section Section Name
     * @page Page Name
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
     * relative/path/to/file.html
     */
    ```

  **NOTE:** By default, the style guide only loads Prism markup (HTML) syntax highlighting. If you need another [syntax language](https://www.jsdelivr.com/projects/prism) (use files for `v1.6.0`), you'll have to add it to the `context.scripts` array.

* `@code` - Same as `@example`, but can be used to override the code output to be different than the example output. Useful if you need to provide extra context for the example that does not need to be shown in the code. If you need to use the `@` symbol at the start of a newline (such as with `@extend` or `@include` in CSS preprocessors), use the HTML entity encoding `&#64;`, otherwise the parser will try to parse it as a tag.

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
     
    /**
     * Using the @ symbol in code
     *
     * @section Code With At Symbol
     * @code
     * .example {
     *   &#64;extend %placeholder-selector;
     * }
     */
    ```

* `@hideCode` - Hide the code output of the example.

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
* `preprocess` - Function that will be called for every page right before Handlebars is called with the context object. The function will be passed the context object, the template, and the Handlebars object as parameters. Return false if you don't want the style guide to be generated using Handlebars, or return a Promise if you need to make asynchronous calls (reject the Promise to not use Handlebars). Use this function to modify the context object , add additional styles to the examples,or register Handlebars partials, helpers, or decorators.
* `sortOrder` - List of pages and their sections in the order they should be sorted. Any page or section not listed will be added to the end in the order encountered. Can be an array of page names to just sort pages, an array of objects with page names as keys and an array of section names as values to sort both pages and sections, or a mix of both. Names are case insensitive.
* `tags` - Object of custom tag names to callback functions that are called when the tag is encountered. The tag, the parsed comment, the block object, the list of sections, the list of pages, and the file are passed as the `this` object to the callback function.
* `template` - Path to the Handlebars template to use for generating the HTML. Defaults to the LivingCSS template `template/template.hbs'.`

```js
livingcss(['input.css', 'css/*.css'], 'styleguide.html', {
  loadcss: true,
  minify: true,
  preprocess: function(context, template, Handlebars) {
    context.title = 'My Awesome Style Guide';

    // register a Handlebars partial
    Handlebars.registerPartial('myPartial', '{{name}}');
  },
  sortOrder: [
    // sort the pages components and modules in that order, and sort sections
    // within those pages.
    {
      components: ['modals', 'dropdowns']
    },
    {
      modules: ['timeStamp']
    },

    // sort the pages atoms and molecules after components and modules, but
    // not in any particular order between themselves. Also sort sections
    // within those pages.
    {
      atoms: ['buttons', 'forms', 'images'],
      molecules: ['cards']
    },

    // sort the pages organisms and templates in that order, but not any of
    // their sections
    ['organisms', 'templates']
  ],
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

You can create your own tags to modify how the documentation is generated. Because most tags are automatically parsed for you, you shouldn't need to create custom tags very often. To create a custom tag, use the `options.tags` option.

A tag is defined as the tag name and a callback function that will be called when the tag is encountered. The current tag, the parsed comment, the block object, the list of sections, the list of pages, and the current file are passed as the `this` object to the callback function.

The comment is parsed using [comment-parser](https://github.com/yavorskiy/comment-parser), and the current tag and the parsed comment will follow the output returned by it. The block object is the current state of the comment, including the comments description, all parsed tags associated with the comment, and any other modifications done by other tags. The block object is also the object saved to the `sections` array when a `section` tag is used, and the `pages` array when a `page` tag is used.

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

Use the `options.preprocess` option to modify or use the context object before it is passed to Handlebars. The function will be passed the context object, the template, and the Handlebars object as parameters. Return false if you don't want the style guide to be generated using Handlebars, or return a Promise if you need to make asynchronous calls (reject the Promise to not use Handlebars). Use this function to modify the context object, add additional styles to the examples, or register Handlebars partials, helpers, or decorators.

```js
livingcss('input.css', 'styleguide.html', {
  preprocess: function(context, template, Handlebars) {
    context.title = 'My Awesome Style Guide';

    // register a Handlebars partial
    Handlebars.registerPartial('myPartial', '{{name}}');
  }
});
```

* `allSections` - List of all sections.
* `footerHTML` - HTML content of the footer. Defaults to `Style Guide generated with LivingCSS`.
* `globalStylesheets` - List of all CSS files to load in the `<head>` of the style guide.
* `menuButtonHTML` - HTML content of the menu button. Defaults to `☰ Menu`.
* `navbar` - List of page links for linking pages together in the `<header>` navigation bar. Only set if there is more than one page defined.
* `pageOrder` - List of page names in the order that they should be sorted.
* `pages` - List of all pages and their sections. List will be sorted by `options.sortOrder`.
* `scripts` - List of all JavaScript files to load at the end of the style guide.
* `sections` - List all root sections (sections without a parent) for the page and their children. List will be sorted by `options.sortOrder`.
* `stylesheets` - List of all CSS files to load in the examples of the style guide. If the `options.loadcss` option is set, this list will contain all CSS files used to generate the style guide.

  **NOTE:** files will only be referenced by their file path and will not be copied over to the output directory. This ensures any relative file paths to images and other CSS files still work.
* `title` - Title of the style guide. Defaults to 'LivingCSS Style Guide'.

## Using the context object in Handlebars

Let's say your comment looks like this:

```css
/**
 * A simple Button.
 * @section Buttons
 * @example <button>Click Me</button>
 * @customTag Hello World
 */
```

This would generate a context object like so:

```json
{
  "sections": [{
    "name": "Buttons",
    "description": "<p>A simple Button.</p>",
    "example": {
      "description": "<button>Click me</button>",
      "type": "markup"
    },
    "customTag": "Hello World"
  }]
}
```

Then in handlebars you would do this:

```hbs
{{#each sections}}
  <h1>{{name}}</h1>
  {{{description}}}
  <div>{{{example.description}}}</div>
  <div>{{customTag}}</div>
{{/each}}
```

## Utility functions

LivingCSS has a few helpful utility functions that you can use in custom tags or in the `options.preprocess` function.

* `livingcss.utils.getId(name)` - Get a hyphenated id from the name. Useful for generating ids for the DOM or a URL.

    ```js
    livingcss.utils.getId('Section Name');  //=> 'section-name'
    ```

* `livingcss.utils.normalizeName(name)` - Normalize a name. Useful for comparisons ignoring case.

    ```js
    livingcss.utils.normalizeName('Section Name');  //=> 'section name'
    ```

* `livingcss.utils.readFileGlobs(glob, callback)` - Pass a glob or array of globs to be read and a callback function that will be called for each read file. The function will be passed the file contents and the name of the file as parameters. Returns a Promise that is resolved when all files returned by the glob have been read. Useful for registering a glob of partials with Handlebars.

    ```js
    var path = require('path');

    livingcss('input.css', 'styleguide.html', {
      preprocess: function(context, template, Handlebars) {
        // register a glob of partials with Handlebars
        return livingcss.utils.readFileGlobs('partials/*.hb', function(data, file) {

          // make the name of the partial the name of the file
          var partialName = path.basename(file, path.extname(file));
          Handlebars.registerPartial(partialName, data);
        });
      }
    });
    ```

* `livingcss.utils.readFiles(files, callback)` - Pass a file or array of files to be read and a callback function that will be called for each read file. The function will be passed the file contents and the name of the file as parameters. Returns a Promise that is resolved when all files have been read.

    ```js
    var path = require('path');

    livingcss('input.css', 'styleguide.html', {
      preprocess: function(context, template, Handlebars) {
        // register a glob of partials with Handlebars
        return livingcss.utils.readFiles(['partials/one.hb', 'partials/two.hb'], function(data, file) {

          // make the name of the partial the name of the file
          var partialName = path.basename(file, path.extname(file));
          Handlebars.registerPartial(partialName, data);
        });
      }
    });
    ```
