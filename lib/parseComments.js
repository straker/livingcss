var { marked } = require('marked');
var parser = require('comment-parser');
var tokenizers = parser.tokenizers;
var nameRegex = /^\s*(.+)\s+[-–—]\s(.+)+/;
var trimNewlineRegex = /^[\n\r]+|[\n\r]+$/g;

/**
 * Parse file comments.
 *
 * @param {string} data - Contents of the file.
 * @param {string} file - Name of the file.
 * @param {object} tags={} - Tags and their callback function.
 * @param {object} context={} - Context object.
 * @param {function} [callback] - Callback to execute after a comment is parsed.
 */
function parseComments(data, file, tags, context, callback) {
  tags = tags || {};
  context = context || {};
  context.sections = context.sections || [];
  context.pages = context.pages || {};

  var comments = parser.parse(data, {
    spacing: 'preserve',
    tokenizers: [
      tokenizers.tag(),
      tokenizers.type(),
      function name(spec) {

        // only parse the name if there is a hyphen between it
        // and the description.
        // this way we can skip parsing the name and use the
        // rest of the line as the description for the majority
        // of comments
        // @see https://github.com/yavorskiy/comment-parser/issues/19
        var source = spec.source[0];
        var match = source.tokens.description.match(nameRegex);

        if (match) {
          spec.name = match[1];
          source.tokens.description = match[2];
        }

        return spec;
      },
      // remove any trailing and preceding newline characters.
      function description(spec) {
        spec.description = tokenizers.description('preserve')(spec).description
          .replace(trimNewlineRegex, '')
          .trim();
        return spec;
      }
    ]
  });

  // parse comments
  comments.forEach(function(comment) {
    var block = {};

    // parse tags
    for (var i = 0, tag; (tag = comment.tags[i]); i++) {

      // tag is defined
      if (tags[tag.tag]) {
        tags[tag.tag].call({
          block: block,
          comment: comment,
          file: file,
          pages: context.pages,
          sections: context.sections,
          tag: tag
        });
      }
      // any tag that is not defined will just be parsed and added to the block as
      // a property
      else {
        var entry;

        // if the tag has no description assume it's a boolean flag and default to
        // true
        var description = tag.description || true;

        // parse any tag of type {marked} as mark down
        if (tag.type === 'markdown') {
          description = marked.parse(description).replace(trimNewlineRegex, '');
        }

        // leave markdown types as a string
        if (!tag.name && (!tag.type || tag.type === 'markdown')) {
          entry = description;
        }
        else {
          entry = {
            description: description,
          };

          if (tag.name) {
            entry.name = tag.name;
          }
          if (tag.type) {
            entry.type = tag.type;
          }
        }

        // repeated tags will be added as an array
        if (block[tag.tag]) {

          // if an entry already exists for this tag, turn it into an array
          if (!Array.isArray(block[tag.tag])) {
            block[tag.tag] = [ block[tag.tag] ];
          }

          block[tag.tag].push(entry);
        }
        // first entry is always just the tag
        else {
          block[tag.tag] = entry;
        }
      }
    }

    // default a section block to be part of the index page only if it doesn't
    // have a parent section
    if (block.isSection && !block.page && !block.parent) {
      tags.page.call({
        block: block,
        comment: comment,
        file: file,
        pages: context.pages,
        sections: context.sections,
        tag: {description: 'index'}
      });
    }

    if (callback) {
      callback(block);
    }

  });
}

module.exports = parseComments;