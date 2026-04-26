'use strict';

/**
 * Rule: fada/no-direct-localstorage
 *
 * `localStorage.setItem` and `localStorage.getItem` calls are only
 * permitted inside `lib/storage/*`. All other files must go through
 * the project's storage abstraction.
 */

const ALLOWED_PREFIXES = ['/lib/storage/'];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow direct localStorage.setItem/getItem outside lib/storage/*.',
      recommended: true,
    },
    schema: [],
    messages: {
      noDirectLocalStorage:
        'Direct localStorage.{{method}}() is not allowed here. Use the storage abstraction in lib/storage/.',
    },
  },

  create(context) {
    const filename = context.getFilename ? context.getFilename() : context.filename;

    // Normalize path separators
    const normalizedFilename = filename.replace(/\\/g, '/');

    // Check if file is in an allowed directory
    const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
      normalizedFilename.includes(prefix)
    );

    if (isAllowed) {
      return {};
    }

    return {
      MemberExpression(node) {
        if (
          node.object &&
          node.object.type === 'Identifier' &&
          node.object.name === 'localStorage' &&
          node.property &&
          node.property.type === 'Identifier' &&
          (node.property.name === 'setItem' || node.property.name === 'getItem')
        ) {
          // Only report when this MemberExpression is used as a callee (i.e., called)
          if (
            node.parent &&
            node.parent.type === 'CallExpression' &&
            node.parent.callee === node
          ) {
            context.report({
              node,
              messageId: 'noDirectLocalStorage',
              data: { method: node.property.name },
            });
          }
        }
      },
    };
  },
};
