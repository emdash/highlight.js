/*
Language: Idris
Author: Brandon Lewis <dotsony@gmail.com>
Website: https://www.idris-lang.org
Category: functional
*/

/**
 * This is is largely based on the haskell mode, and probably contains
 * some errors, but it's better than nothing.
 */

export default function(hljs) {

  /* See:
     - https://www.haskell.org/onlinereport/lexemes.html
     - https://downloads.haskell.org/ghc/9.0.1/docs/html/users_guide/exts/binary_literals.html
     - https://downloads.haskell.org/ghc/9.0.1/docs/html/users_guide/exts/numeric_underscores.html
     - https://downloads.haskell.org/ghc/9.0.1/docs/html/users_guide/exts/hex_float_literals.html
  */
  const decimalDigits = '([0-9]_*)+';
  const hexDigits = '([0-9a-fA-F]_*)+';
  const binaryDigits = '([01]_*)+';
  const octalDigits = '([0-7]_*)+';
  const ascSymbol = '[!#$%&*+.\\/<=>?@\\\\^~-]';
  const uniSymbol = '(\\p{S}|\\p{P})' // Symbol or Punctuation
  const special = '[(),;\\[\\]`|{}]';
  const symbol = `(${ascSymbol}|(?!(${special}|[_:"']))${uniSymbol})`;

  const COMMENT = { variants: [
    // Double dash forms a valid comment only if it's not part of legal lexeme.
    // See: Haskell 98 report: https://www.haskell.org/onlinereport/lexemes.html
    //
    // The commented code does the job, but we can't use negative lookbehind,
    // due to poor support by Safari browser.
    // > hljs.COMMENT(`(?<!${symbol})--+(?!${symbol})`, '$'),
    // So instead, we'll add a no-markup rule before the COMMENT rule in the rules list
    // to match the problematic infix operators that contain double dash.
    hljs.COMMENT('--+', '$'),
    hljs.COMMENT(
      /\{-/,
      /-\}/,
      { contains: [ 'self' ] }
    )
    hljs.COMMENT('|||', '$')
  ] };

  const PRAGMA = {
    className: 'meta',
    begin: /%/,
    end: '$'
  };

  const CONSTRUCTOR = {
    className: 'type',
    begin: '\\b[A-Z][\\w\']*', // TODO: other constructors (build-in, infix).
    relevance: 0
  };

  const LIST = {
    begin: '\\(',
    end: '\\)',
    illegal: '"',
    contains: [
      {
        className: 'type',
        begin: '\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?'
      },
      hljs.inherit(hljs.TITLE_MODE, { begin: '[_a-z][\\w\']*' }),
      COMMENT
    ]
  };

  const RECORD = {
    begin: /\{/,
    end: /\}/,
    contains: LIST.contains
  };

  const NUMBER = {
    className: 'number',
    relevance: 0,
    variants: [
      // decimal floating-point-literal (subsumes decimal-literal)
      { match: `\\b(${decimalDigits})(\\.(${decimalDigits}))?` + `([eE][+-]?(${decimalDigits}))?\\b` },
      // hexadecimal floating-point-literal (subsumes hexadecimal-literal)
      { match: `\\b0[xX]_*(${hexDigits})(\\.(${hexDigits}))?` + `([pP][+-]?(${decimalDigits}))?\\b` },
      // octal-literal
      { match: `\\b0[oO](${octalDigits})\\b` },
      // binary-literal
      { match: `\\b0[bB](${binaryDigits})\\b` }
    ]
  };

  return {
    name: 'Idris',
    aliases: [ 'idris', 'idris2' ],
    keywords:
      'let in if then else case of where do module import'
      + 'data interface implementation as default '
      + 'infix infixl infixr prefix public export '
      + 'parameters namespace'
    unicodeRegex: true,
    contains: [
      // Top-level constructions.
      {
        beginKeywords: 'module',
        end: '$',
        keywords: 'module where',
        contains: [
          LIST,
          COMMENT
        ],
        illegal: '\\W\\.|;'
      },
      {
        begin: '\\bimport\\b',
        end: '$',
        keywords: 'import qualified as hiding',
        contains: [
          LIST,
          COMMENT
        ],
        illegal: '\\W\\.|;'
      },
      {
        className: 'class',
        begin: '^(\\s*)?(interface|implementation)\\b',
        end: 'where',
        keywords: 'interface where',
        contains: [
          CONSTRUCTOR,
          LIST,
          COMMENT
        ]
      },
      {
        className: 'class',
        begin: '\\b(data|(new)?type)\\b',
        end: '$',
        keywords: 'data where',
        contains: [
          PRAGMA,
          CONSTRUCTOR,
          LIST,
          RECORD,
          COMMENT
        ]
      },
      {
        beginKeywords: 'default',
        end: '$',
        contains: [
          CONSTRUCTOR,
          LIST,
          COMMENT
        ]
      },
      {
        beginKeywords: 'infix infixl infixr prefix',
        end: '$',
        contains: [
          hljs.C_NUMBER_MODE,
          COMMENT
        ]
      },

      // "Whitespaces".
      PRAGMA,

      // Literals and names.

      // Single characters.
      {
        scope: 'string',
        begin: /'(?=\\?.')/,
        end: /'/,
        contains: [
          {
            scope: 'char.escape',
            match: /\\./,
          },
        ]
      },
      hljs.QUOTE_STRING_MODE,
      NUMBER,
      CONSTRUCTOR,
      hljs.inherit(hljs.TITLE_MODE, { begin: '^[_a-z][\\w\']*' }),
      // No markup, prevents infix operators from being recognized as comments.
      { begin: `(?!-)${symbol}--+|--+(?!-)${symbol}`},
      COMMENT,
      { // No markup, relevance booster
        begin: '->|<-' }
    ]
  };
}
