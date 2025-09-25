/** @type {import('prettier').Config} */
module.exports = {
  // Core formatting options
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // Line formatting
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',

  // Plugins
  plugins: ['prettier-plugin-tailwindcss'],

  // Override settings for specific file types
  overrides: [
    {
      files: '*.{js,jsx,ts,tsx}',
      options: {
        parser: 'typescript',
      },
    },
    {
      files: '*.{css,scss}',
      options: {
        parser: 'css',
      },
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        printWidth: 100,
      },
    },
  ],
};