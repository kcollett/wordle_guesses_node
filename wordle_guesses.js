#!/usr/bin/env node

/**
 * wordle_guesses.js
 *
 * A CLI tool to generate possible Wordle guesses based on a template.
 * 
 * Usage:
 *   node wordle_guesses.js <template> [options]
 * 
 * The template must be 5 characters long, containing lowercase letters,
 * underscores for unknowns, and a single period (.) for the position to test.
 * 
 * Options:
 *   -e, --exclude <letters>      Exclude specific letters from guesses.
 *   -i, --include <letters>      Include only specific letters in guesses.
 *   -n, --num_guesses <number>   Number of guesses to print per line (default: 5).
 */

"use strict";

// ECMAScript (.mjs)
// import { Command } from 'commander';
// const program = new Command();

/**
 * Main function for the Wordle guesses CLI tool.
 *
 * @returns {void}
 */
function main() {
  const ALPHA_ARRAY = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const ALPHA_SET = new Set(ALPHA_ARRAY);

  const BLANK = '_';
  const MATCH = '.';
  const TEMPLATE_RE =
    new RegExp(`^[a-z${BLANK}]{0,4}\\${MATCH}[a-z${BLANK}]{0,4}$`, 'i');
  const DEFAULT_NUM_GUESSES = 5;

  const progname = process.argv[1].split('/').pop();

  // @ts-ignore
  const { Command, Option, InvalidArgumentError } = require('commander');
  const program = new Command();

  function parseTemplate(template, _previous) {
    if (template.length !== 5) {
      throw new InvalidArgumentError("template must be 5 characters long");
    }

    // console.log(`re: ${template_re}`);
    if (!TEMPLATE_RE.test(template)) {
      throw new InvalidArgumentError("template must contain only letters,"
        + " underscores, and a single period");
    }

    return template;
  }

  function parseLetters(letters, _previous) {
    if (typeof letters !== 'string') {
      throw new InvalidArgumentError("letters must be a string");
    }

    const letterArray = letters.toLowerCase().split('').sort();

    for (const letter of letterArray) {
      if (!ALPHA_ARRAY.includes(letter)) {
        throw new InvalidArgumentError(`invalid letter: '${letter}'`);
      }
    }

    const uniqueLetters = new Set(letterArray);

    return uniqueLetters;
  }

  const description =
    "Given a template, print out a list of potential Wordle guesses."
  program
    .name(progname)
    .version('0.1.0')
    .description(description);

  const excludeOption =
    new Option('-e, --exclude <letters>', 'specify letter(s) to exclude')
      .argParser(parseLetters)
      .conflicts('include');
  const includeOption =
    new Option('-i, --include <letters>', 'specify letter(s) to include')
      .argParser(parseLetters)
      .conflicts('exclude');
  function parseNumGuesses(value, _previous) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new InvalidArgumentError("num_guesses must be a positive integer");
    }
    return num;
  }

  const nPerLineOption =
    new Option('-n, --num_guesses <number>',
      'number of guesses to print per line')
      .argParser(parseNumGuesses)
      .default(DEFAULT_NUM_GUESSES);
  program.addOption(excludeOption);
  program.addOption(includeOption);
  program.addOption(nPerLineOption);

  program.argument('<template>', 'the template to use for generating guesses',
    parseTemplate);

  program.parse(process.argv);

  const template = program.args[0].toLowerCase();
  // console.log(template);
  const parts = template.split(MATCH);
  // console.log(`parts: ${parts}`);

  const opts = program.opts();
  // console.log(`opts: ${JSON.stringify(opts)}`);

  const includes = opts.include || Object.freeze(new Set());
  const excludes = opts.exclude || Object.freeze(new Set());
  const hasExcludes = excludes.size > 0;
  const hasIncludes = includes.size > 0;
  // console.log(`includes: ${includes}`);
  // console.log(`excludes: ${excludes}`);

  const maxGuessesInLine = opts.num_guesses;

  let charsToTest = [];
  if (hasIncludes) {
    // if includes are specified, we only test those letters
    charsToTest = Array.from(includes);
  }
  else if (hasExcludes) {
    // if excludes are specified, we test all letters EXCEPT those
    charsToTest = Array.from(ALPHA_SET).filter(letter => !excludes.has(letter));
  } else {
    // otherwise, we test all letters in the alphabet
    charsToTest = Array.from(ALPHA_SET);
  }
  // console.log(`charsToTest: ${charsToTest}`);

  let guessesInCurrentLine = 0;
  for (const i of charsToTest) {
    if (guessesInCurrentLine > 0) {
      process.stdout.write('\t');
    }

    const guessString = parts[0] + i + (parts[1] ?? '');
    const guess = capitalizeFirstLetter(guessString);
    process.stdout.write(`${guess}`);
    guessesInCurrentLine++;

    if (guessesInCurrentLine >= maxGuessesInLine) {
      console.log();
      guessesInCurrentLine = 0;
    }
  }
  if (guessesInCurrentLine > 0) {
    console.log(); // ensure we end with a newline
  }
}

main();

/** 
 * Function to capitalize the first character of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} - The string with the first character capitalized.
 * If the input is not a string or is empty, it returns the input unchanged.
 * @example
 * capitalizeFirstLetter("hello") // returns "Hello"
 * capitalizeFirstLetter("world") // returns "World"
 * capitalizeFirstLetter(123) // returns 123
 */
function capitalizeFirstLetter(str) {
  if (typeof str !== 'string' || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}