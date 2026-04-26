'use strict';

/**
 * Rule: fada/no-hardcoded-arabic
 *
 * Any string literal containing Arabic characters inside files under
 * `components/` must be the argument to a `t()` call from next-intl.
 * Files under `content/collections/` and `messages/` are excluded.
 *
 * Arabic Unicode ranges checked:
 *   U+0600–U+06FF  (Arabic)
 *   U+0750–U+077F  (Arabic Supplement)
 *   U+08A0–U+08FF  (Arabic Extended-A)
 *   U+FB50–U+FDFF  (Arabic Presentation Forms-A)
 *   U+FE70–U+FEFF  (Arabic Presentation Forms-B)
 */

const ARABIC_REGEX = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hard-coded Arabic strings in components/ — use t() from next-intl instead.',
      recommended: true,
    },
    schema: [],
    messages: {
      noHardcodedArabic:
        'Hard-coded Arabic string "{{value}}" found. Wrap it in a t() call from next-intl.',
    },
  },

  create(context) {
    const filename = context.getFilename ? context.getFilename() : context.filename;

    // Only apply inside components/ directory
    if (!filename.includes('/components/')) {
      return {};
    }

    // Allow exceptions: content/collections/* and messages/*
    if (
      filename.includes('/content/collections/') ||
      filename.includes('/messages/')
    ) {
      return {};
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        if (!ARABIC_REGEX.test(node.value)) return;

        // Allow if the parent is a CallExpression whose callee is `t`
        const parent = node.parent;
        if (
          parent &&
          parent.type === 'CallExpression' &&
          parent.callee &&
          ((parent.callee.type === 'Identifier' && parent.callee.name === 't') ||
            (parent.callee.type === 'MemberExpression' &&
              parent.callee.property &&
              parent.callee.property.name === 't'))
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'noHardcodedArabic',
          data: { value: node.value.slice(0, 40) },
        });
      },
    };
  },
};
