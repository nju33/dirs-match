const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk');
const {Signale} = require('signale');
const logSymbols = require('log-symbols');
const {promisify} = require('util');
const yargs = require('yargs');
const glob = require('glob-promise');

const signale = new Signale({
  disabled: false,
  interactive: false,
  stream: process.stdout,
  // scope: 'custom',
  types: {
    matches: {
      badge: logSymbols.success,
      color: 'green',
      label: 'matches'
    },
    notMatches: {
      badge: logSymbols.error,
      color: 'red',
      label: 'not matches'
    },
    shaBase: {
      badge: ' ',
      color: 'gray',
      label: '       base',
    },
    shaTarget: {
      badge: ' ',
      color: 'gray',
      label: '     target',
    },
  }
})

const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

const argv = yargs
  .command('$0 <base-dir> <target-dir>', '', childYargs => {
    childYargs
      .positional('base-dir', {
        type: 'string'
      })
      .positional('target-dir', {
        type: 'string'
      });
  })
  .help().argv;

const baseDirname = path.resolve(process.cwd(), argv.baseDir);
const targetDirname = path.resolve(process.cwd(), argv.targetDir);

const ignoreDirs = async names => {
  return (await Promise.all(names.map(async name => {
    const stats = await stat(name);
    if (stats.isDirectory()) {
      return null;
    }

    return name;
  }))).filter(v => v);
}

const getCrypto = async absoluteFilename => {
  const buf = await readFile(absoluteFilename);
  return crypto.createHash('sha1').update(buf).digest('hex');
}

const pathExists = async absoluteFilename => {
  try {
    await stat(absoluteFilename);
    return true;
  } catch (_) {
    return false;
  }
}

const getRelativePathAtBase = filename => {
  return filename.replace(baseDirname, '').slice(1);
}

(async () => {
  await Promise.all([
    stat(baseDirname),
    stat(targetDirname),
  ]);

  const absoluteFilenamesAtBase = await glob(`${baseDirname}/**/*`).then(ignoreDirs);

  for (const absoluteFilenameAtBase of absoluteFilenamesAtBase) {
    const relativeFilenameAtBase = getRelativePathAtBase(absoluteFilenameAtBase);
    const absoluteFilenameAtTarget = path.resolve(targetDirname, relativeFilenameAtBase);
    const shaOfBase = await getCrypto(absoluteFilenameAtBase);
    let shaOfTarget;
    if (await pathExists(absoluteFilenameAtTarget)) {
      shaOfTarget = await getCrypto(absoluteFilenameAtTarget);
    }

    if (shaOfBase === shaOfTarget) {
      signale.matches(`${chalk.underline(relativeFilenameAtBase)}`);
    } else {
      signale.notMatches(`${chalk.underline(relativeFilenameAtBase)} don\'t matches`)
      signale.shaBase(chalk.gray(shaOfBase));
      signale.shaTarget(chalk.gray(shaOfTarget));
    }
  }
})().catch(err => {
  console.error(err);
})