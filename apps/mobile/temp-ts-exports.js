const ts = require('./node_modules/.pnpm/typescript@6.0.3/node_modules/typescript');
const path = require('path');
const configPath = ts.findConfigFile('.', ts.sys.fileExists, 'tsconfig.json');
if (!configPath) throw new Error('tsconfig.json not found');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));
const root = path.join(process.cwd(), 'src', 'App.tsx');
const program = ts.createProgram({ rootNames: [root], options: parsed.options });
const sourceFile = program.getSourceFile(root);
if (!sourceFile) throw new Error('source file not found');
const checker = program.getTypeChecker();
const importDecl = sourceFile.statements.find(s => ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === 'react-native');
if (!importDecl) throw new Error('import decl not found');
const moduleSymbol = checker.getSymbolAtLocation(importDecl.moduleSpecifier);
if (!moduleSymbol) {
  console.log('moduleSymbol not found');
  process.exit(0);
}
console.log('moduleSymbol flags:', moduleSymbol.flags);
console.log('moduleSymbol name:', moduleSymbol.getName());
if (moduleSymbol.declarations) {
  console.log('declarations:', moduleSymbol.declarations.map(d => d.getSourceFile().fileName));
}
const exports = checker.getExportsOfModule(moduleSymbol).map(sym => sym.getName());
console.log('exports count:', exports.length);
console.log('includes View:', exports.includes('View'));
console.log('includes Text:', exports.includes('Text'));
console.log('includes ScrollView:', exports.includes('ScrollView'));
console.log('includes SafeAreaView:', exports.includes('SafeAreaView'));
console.log('includes Pressable:', exports.includes('Pressable'));
console.log('includes TextInput:', exports.includes('TextInput'));
console.log('exports sample:', exports.slice(0, 120).join(', '));
