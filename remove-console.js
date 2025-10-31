const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

// 👇 Choose the root folder you want to clean
const foldersToClean = ['app', 'lib', 'hooks', 'contexts'];

function processFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');

  const ast = parser.parse(code, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript', 'classProperties', 'optionalChaining'],
  });

  let modified = false;

  traverse(ast, {
    CallExpression(path) {
      const callee = path.get('callee');
      if (
        callee.isMemberExpression() &&
        callee.get('object').isIdentifier({ name: 'console' }) &&
        callee.get('property').isIdentifier({ name: 'log' })
      ) {
        path.remove();
        modified = true;
      }
    },
  });

  if (modified) {
    const output = generator(ast, {}, code).code;
    fs.writeFileSync(filePath, output);

  }
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const fullPath = path.join(dir, f);
    const isDirectory = fs.statSync(fullPath).isDirectory();
    if (isDirectory) {
      walkDir(fullPath, callback);
    } else if (/\.(js|ts|jsx|tsx)$/.test(f)) {
      callback(fullPath);
    }
  });
}

foldersToClean.forEach((folder) => {
  const fullPath = path.join(__dirname, folder);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath, processFile);
  } else {
    console.warn(`⚠️ Folder not found: ${fullPath}`);
  }
});

