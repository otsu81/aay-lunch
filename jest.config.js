module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["@swc/jest"],
  },
  collectCoverage: true,
  clearMocks: true,
  coverageDirectory: "coverage",
}
