'use strict';

const noHardcodedArabic = require('./no-hardcoded-arabic');
const noDirectLocalstorage = require('./no-direct-localstorage');
const logoIsAnchor = require('./logo-is-anchor');

module.exports = {
  meta: {
    name: 'eslint-plugin-fada',
    version: '0.1.0',
  },
  rules: {
    'no-hardcoded-arabic': noHardcodedArabic,
    'no-direct-localstorage': noDirectLocalstorage,
    'logo-is-anchor': logoIsAnchor,
  },
};
