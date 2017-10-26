#! /usr/bin/env node

const fs = require('fs');
const shell = require('shelljs');
const commandLineArgs = require('command-line-args');
const commandLineCommands = require('command-line-commands');

const configPath = './config.json';
const config = require(configPath);

const validCommands = [null, 'config', 'p'];
const {command, argv} = commandLineCommands(validCommands);

// Utility requires git to work
if (!shell.which('git')) {
  console.log('Sorry, this script requires git. Please install git and try again.');
  shell.exit(1);
}

if (command === 'p') {
  shell.config.silent = true;
  // install libsecret dev files if you don't already have them
  // shell.exec('sudo apt install libsecret.*dev -y');    //uncomment when done testing

  // checks if you have a libsecret folder in your git credentials file and mkdir if not
  var path = '/usr/share/doc/git/contrib/credential/';
  if (!shell.ls(path).grep('libsecret')) {
    // checks for curl, otherwise cannot continue
    if (!shell.which('curl')) {
      console.log('You are not set up yet to store git credentials using libsecret. Gal can set this up for you, but curl is required to install the necessary files. Please install curl and try again.');
      shell.exit(1);
    }
    shell.exec(`sudo mkdir ${path}`+'libsecret/');
  } 
  
  path += 'libsecret2/';   // change to libsecret when  done testing
  const libsecretContents = shell.ls(path);
    
  // checks if you have the Makefile and curl if not
  if (libsecretContents.indexOf('Makefile') < 0) {
    if (!shell.which('curl')) {
      console.log('You are not set up yet to store git credentials using libsecret. Gal can set this up for you, but curl is required to install the necessary files. Please install curl and try again.');
      shell.exit(1);
    }
    shell.exec(`sudo curl -o ${path}`+'Makefile https://raw.githubusercontent.com/git/git/master/contrib/credential/libsecret/Makefile');
  }

  // checks if you have the C file and curl if not
  if (libsecretContents.indexOf('git-credential-libsecret.c') < 0) {
    if (!shell.which('curl')) {
      console.log('You are not set up yet to store git credentials using libsecret. Gal can set this up for you, but curl is required to install the necessary files. Please install curl and try again.');
      shell.exit(1);
    }
    shell.exec(`sudo curl -o ${path}`+'git-credential-libsecret.c https://raw.githubusercontent.com/git/git/master/contrib/credential/libsecret/git-credential-libsecret.c');
  }

  // checks if made already, and make if not
  if (libsecretContents.indexOf('git-credential-libsecret.o') < 0) {
    shell.exec(`sudo make -C ${path}`);
  }

  // check if git is initialized

}
// Config command sets default configs
else if (command === 'config') {
  const optionDefinitions = [
    {
      name: 'message',
      alias: 'm',
      type: String,
      defaultOption: true,
      multiple: true    // takes an array of values...
    },
    {
      name: 'remote',
      alias: 'r',
      type: String
    }
  ];

  const options = commandLineArgs(optionDefinitions, {argv});
  
  if (options.message) {
    config.message = options.message.join(' ');   // ...which are joined, thereby obviating the need to put quotes around the commit message
  }
  if (options.remote) {
    config.remote = options.remote;
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
} 
// If no command, run gal with options
else {
  const currentBranch = shell.exec('git branch | grep \\*', {silent:true}).stdout.slice(2);

  const optionDefinitions = [
    {
      name: 'message',
      alias: 'm',
      type: String,
      defaultOption: true,
      defaultValue: config.message,
      multiple: true
    },
    {
      name: 'remote',
      alias: 'r',
      type: String,
      defaultValue: config.remote
    },
    {
      name: 'branch',
      alias: 'b',
      type: String,
      defaultValue: currentBranch
    },
    {
      name: 'commit-only',
      alias: 'c',
      type: Boolean,
    }
  ];
  
  const options = commandLineArgs(optionDefinitions, {argv});

  shell.exec(`git add -A && git commit -m "${options.message.join(' ')}"`);
  
  if (!options['commit-only']) {
    shell.exec(`git push -u ${options.remote} ${options.branch}`);
  }
}

// CommandLineArgs and CommandLineOptions auto throw errors on invalid commands or options