// src/api/utils/testRunner.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

class TestRunner {
    constructor() {
        this.tempDir = path.join(__dirname, '../../temp/tests');
        this.runners = {
            javascript: {
                command: 'jest',
                setup: this.setupJest
            },
            typescript: {
                command: 'jest',
                setup: this.setupJest
            },
            python: {
                command: 'pytest',
                setup: this.setupPytest
            }
        };
    }

    async runTests(params) {
        const { code, tests, language } = params;

        try {
            // Create temporary test directory
            const testDir = await this.createTempTestDir();

            // Setup test environment
            const runner = this.runners[language.toLowerCase()];
            if (!runner) {
                throw new Error(`Unsupported test language: ${language}`);
            }

            // Setup test files
            await runner.setup(testDir, code, tests);

            // Run tests
            const results = await this.executeTests(runner.command, testDir);

            // Clean up
            await this.cleanup(testDir);

            return results;
        } catch (error) {
            logger.error('Error running tests:', error);
            throw error;
        }
    }

    async createTempTestDir() {
        const timestamp = Date.now();
        const testDir = path.join(this.tempDir, `test-${timestamp}`);
        await fs.mkdir(testDir, { recursive: true });
        return testDir;
    }

    async setupJest(testDir, code, tests) {
        // Write source file
        await fs.writeFile(
            path.join(testDir, 'source.js'),
            code
        );

        // Write test file
        await fs.writeFile(
            path.join(testDir, 'source.test.js'),
            tests
        );

        // Create Jest config
        const jestConfig = {
            verbose: true,
            testEnvironment: 'node',
            coverageDirectory: path.join(testDir, 'coverage'),
            collectCoverage: true
        };

        await fs.writeFile(
            path.join(testDir, 'jest.config.json'),
            JSON.stringify(jestConfig, null, 2)
        );
    }

    async setupPytest(testDir, code, tests) {
        // Write source file
        await fs.writeFile(
            path.join(testDir, 'source.py'),
            code
        );

        // Write test file
        await fs.writeFile(
            path.join(testDir, 'test_source.py'),
            tests
        );

        // Create pytest config
        const pytestConfig = `
[pytest]
testpaths = .
python_files = test_*.py
addopts = --verbose --cov=. --cov-report=html
        `;

        await fs.writeFile(
            path.join(testDir, 'pytest.ini'),
            pytestConfig
        );
    }

    executeTests(command, testDir) {
        return new Promise((resolve, reject) => {
            const testProcess = spawn(command, ['--json'], {
                cwd: testDir,
                shell: true
            });

            let output = '';
            let error = '';

            testProcess.stdout.on('data', (data) => {
                output += data;
            });

            testProcess.stderr.on('data', (data) => {
                error += data;
            });

            testProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Test process exited with code ${code}: ${error}`));
                    return;
                }

                try {
                    const results = this.parseTestResults(output);
                    resolve(results);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    parseTestResults(output) {
        try {
            const results = JSON.parse(output);
            return {
                success: results.success,
                numPassedTests: results.numPassedTests,
                numFailedTests: results.numFailedTests,
                testResults: results.testResults.map(result => ({
                    name: result.name,
                    status: result.status,
                    duration: result.duration,
                    failureMessages: result.failureMessages
                })),
                coverage: results.coverageMap ? {
                    statements: results.coverageMap.statements.pct,
                    branches: results.coverageMap.branches.pct,
                    functions: results.coverageMap.functions.pct,
                    lines: results.coverageMap.lines.pct
                } : null
            };
        } catch (error) {
            logger.error('Error parsing test results:', error);
            throw error;
        }
    }

    async cleanup(testDir) {
        try {
            await fs.rm(testDir, { recursive: true });
        } catch (error) {
            logger.error('Error cleaning up test directory:', error);
        }
    }
}

module.exports = new TestRunner();