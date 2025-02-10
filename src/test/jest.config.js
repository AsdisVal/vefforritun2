export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/lib/**/*.js', // Match your project's requirements
  ],
  coverageThreshold: {
    // Enforce 50% coverage
    global: {
      lines: 50,
    },
  },
};
