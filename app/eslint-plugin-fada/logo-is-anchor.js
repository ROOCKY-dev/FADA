'use strict';

/**
 * Rule: fada/logo-is-anchor
 *
 * The <LogoMark> component must always appear inside an <a> or <Link>
 * (next/link) ancestor. This enforces the "Never-Weird" rule: the logo
 * always returns the user to /.
 */

/**
 * Walk up the ancestor chain and return true if a JSXElement with the given
 * element name is found before reaching the top.
 *
 * @param {import('eslint').Rule.Node} node
 * @param {string[]} ancestorNames
 * @returns {boolean}
 */
function hasAncestor(node, ancestorNames) {
  let current = node.parent;
  while (current) {
    if (
      current.type === 'JSXElement' &&
      current.openingElement &&
      current.openingElement.name
    ) {
      const name = current.openingElement.name;
      // Simple identifier: <a>, <Link>
      if (name.type === 'JSXIdentifier' && ancestorNames.includes(name.name)) {
        return true;
      }
      // Member expression: <Next.Link> — check member name
      if (
        name.type === 'JSXMemberExpression' &&
        name.property &&
        ancestorNames.includes(name.property.name)
      ) {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '<LogoMark> must be wrapped in an <a> or <Link> ancestor.',
      recommended: true,
    },
    schema: [],
    messages: {
      logoNotAnchor:
        '<LogoMark> must be rendered inside an <a> or <Link> element so the logo always navigates to /.',
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const elementName = node.name;
        if (
          !elementName ||
          elementName.type !== 'JSXIdentifier' ||
          elementName.name !== 'LogoMark'
        ) {
          return;
        }

        // node is the JSXOpeningElement; its parent is the JSXElement
        const jsxElement = node.parent;

        if (!hasAncestor(jsxElement, ['a', 'Link'])) {
          context.report({
            node,
            messageId: 'logoNotAnchor',
          });
        }
      },
    };
  },
};
