var parser = require('comment-parser');
var PARSERS = parser.PARSERS;

/**
 * Parse file comments.
 *
 * @param {string} data - Contents of the file.
 * @param {string} file - Name of the file.
 * @param {object} [tags={}] - Tags and their callback function.
 * @param {object[]} [sections=[]] - List of sections.
 * @param {function} [callback] - Callback to execute after a comment is parsed.
 */
function parseComments(data, file, tags, sections, callback) {
  var args = Array.prototype.slice.call(arguments);

  if (typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  }

  // require parameters
  data = args.shift();
  file = args.shift();

  // options parameters
  if (Array.isArray(args[0])) {
    sections = args.shift();
  }
  else if (args[0]) {
    tags = args.shift();
  }

  tags = tags || {};
  sections = sections || args[0] || [];


  // since we aren't processing any @param like comments we can skip parsing the name
  // to get the description to be the full tag
  // @see https://github.com/yavorskiy/comment-parser/issues/19
  var comments = parser(data, {
    parsers: [
      PARSERS.parse_tag,
      PARSERS.parse_type,
      function () {
        return null;
      },
      PARSERS.parse_description
    ],
    trim: false
  });

  // parse comments
  comments.forEach(function(comment) {
    var block = {};

    // parse tags
    comment.tags.forEach(function(tag) {
      // tag is defined
      if (tags[tag.tag]) {
        tags[tag.tag]({
          tag: tag,
          comment: comment,
          block: block,
          sections: sections,
          file: file
        });
      }
      // any tag that is not defined will just be parsed and added to the block as a property
      // if the tag has no description assume it's a boolean flag and default to true
      else {
        block[tag.tag] = tag.description || true;
      }
    });

    if (callback) {
      callback(block);
    }

  });
}

module.exports = parseComments;