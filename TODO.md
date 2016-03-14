TODO: 
* ~~create a partial that childSection uses, then create a partial RootSection that also uses the same base template (to remove code duplication)~~
* ~~make loading files order dependent so race conditions no longer happen~~
* ~~allow multiple pages to be rendered by using a new tag (@page ?). Each root section will be nested inside a page (instead of an array), and then loop over each page and use that as the context for handlebars.~~
* ~~figure out sectionOrder with multiple pages~~
* ~~create customElement that encapsulates the example code and loads the css only in that scope~~
* ~~figure out page order (maybe replace section order?)~~
* update README
* ~~update tests~~
* better way to add default tag values when not defined in the comment (@page)

* EXAMPLES
  * loading a hbs template into a comment and using a custom tag to pass the block object into Handlebars compile to get a generated example/code output
