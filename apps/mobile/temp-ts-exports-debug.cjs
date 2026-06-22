const ts = require('typescript');
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
let resolved = moduleSymbol;
try {
  const alias = checker.getAliasedSymbol(moduleSymbol);
  if (alias) resolved = alias;
} catch (e) {
  console.log('getAliasedSymbol failed:', e.message);
}
console.log('moduleSymbol name:', resolved.getName());
console.log('moduleSymbol flags:', resolved.flags);
if (resolved.declarations) {
  console.log('declarations:', resolved.declarations.map(d => d.getSourceFile().fileName));
}
const moduleExports = checker.getExportsOfModule(resolved).map(sym => sym.getName());
console.log('exports count:', moduleExports.length);
console.log('includes View:', moduleExports.includes('View'));
console.log('includes Text:', moduleExports.includes('Text'));
console.log('includes ScrollView:', moduleExports.includes('ScrollView'));
console.log('includes SafeAreaView:', moduleExports.includes('SafeAreaView'));
console.log('includes Pressable:', moduleExports.includes('Pressable'));
console.log('includes TextInput:', moduleExports.includes('TextInput'));
console.log('exports sample:', moduleExports.slice(0, 120).join(', '));
