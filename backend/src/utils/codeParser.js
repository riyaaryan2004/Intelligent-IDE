// src/api/utils/codeParser.js

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');
const logger = require('./logger');

class CodeParser {
    constructor() {
        this.supportedLanguages = ['javascript', 'typescript'];
    }

    async parse(code, language) {
        try {
            if (!this.supportedLanguages.includes(language.toLowerCase())) {
                throw new Error(`Language ${language} not supported for parsing`);
            }

            const ast = esprima.parseScript(code, {
                loc: true,
                range: true,
                tokens: true,
                comment: true
            });

            return {
                ast,
                structure: this.analyzeStructure(ast),
                metrics: this.calculateMetrics(ast),
                dependencies: this.extractDependencies(ast)
            };
        } catch (error) {
            logger.error('Error parsing code:', error);
            throw error;
        }
    }

    analyzeStructure(ast) {
        const structure = {
            functions: [],
            classes: [],
            variables: [],
            imports: []
        };

        estraverse.traverse(ast, {
            enter: (node) => {
                switch (node.type) {
                    case 'FunctionDeclaration':
                        structure.functions.push({
                            name: node.id.name,
                            params: node.params.map(p => p.name),
                            line: node.loc.start.line
                        });
                        break;

                    case 'ClassDeclaration':
                        structure.classes.push({
                            name: node.id.name,
                            methods: this.extractClassMethods(node),
                            line: node.loc.start.line
                        });
                        break;

                    case 'VariableDeclaration':
                        node.declarations.forEach(decl => {
                            structure.variables.push({
                                name: decl.id.name,
                                kind: node.kind,
                                line: node.loc.start.line
                            });
                        });
                        break;

                    case 'ImportDeclaration':
                        structure.imports.push({
                            source: node.source.value,
                            specifiers: node.specifiers.map(spec => ({
                                type: spec.type,
                                name: spec.local.name
                            }))
                        });
                        break;
                }
            }
        });

        return structure;
    }

    calculateMetrics(ast) {
        const metrics = {
            lineCount: 0,
            functionCount: 0,
            classCount: 0,
            complexity: 0
        };

        estraverse.traverse(ast, {
            enter: (node) => {
                switch (node.type) {
                    case 'FunctionDeclaration':
                    case 'FunctionExpression':
                    case 'ArrowFunctionExpression':
                        metrics.functionCount++;
                        break;

                    case 'ClassDeclaration':
                        metrics.classCount++;
                        break;

                    // Calculate cyclomatic complexity
                    case 'IfStatement':
                    case 'WhileStatement':
                    case 'DoWhileStatement':
                    case 'ForStatement':
                    case 'ForInStatement':
                    case 'ForOfStatement':
                    case 'ConditionalExpression':
                        metrics.complexity++;
                        break;

                    case 'LogicalExpression':
                        if (node.operator === '&&' || node.operator === '||') {
                            metrics.complexity++;
                        }
                        break;
                }
            }
        });

        metrics.lineCount = ast.loc.end.line;
        return metrics;
    }

    extractDependencies(ast) {
        const dependencies = {
            imports: new Set(),
            requires: new Set()
        };

        estraverse.traverse(ast, {
            enter: (node) => {
                if (node.type === 'ImportDeclaration') {
                    dependencies.imports.add(node.source.value);
                }
                else if (
                    node.type === 'CallExpression' &&
                    node.callee.name === 'require'
                ) {
                    dependencies.requires.add(node.arguments[0].value);
                }
            }
        });

        return {
            imports: Array.from(dependencies.imports),
            requires: Array.from(dependencies.requires)
        };
    }

    extractClassMethods(classNode) {
        const methods = [];
        classNode.body.body.forEach(node => {
            if (node.type === 'MethodDefinition') {
                methods.push({
                    name: node.key.name,
                    kind: node.kind,
                    static: node.static,
                    params: node.value.params.map(p => p.name)
                });
            }
        });
        return methods;
    }

    // Generate code from AST
    generate(ast) {
        try {
            return escodegen.generate(ast, {
                format: {
                    indent: {
                        style: '    ',
                        base: 0
                    },
                    newline: '\n',
                    space: ' ',
                    quotes: 'single'
                },
                comment: true
            });
        } catch (error) {
            logger.error('Error generating code:', error);
            throw error;
        }
    }
}

module.exports = new CodeParser();