export default {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {}, // Disable Jest's transformation (for ESM)
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],
  coverageThreshold: {
    global: {
      lines: 50,
    },
  },
};
