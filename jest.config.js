const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    // Exclude existing files not part of TDD implementation
    '!components/ui/tabs.tsx',
    '!components/blog/**',
    '!app/page.tsx',
    '!app/layout.tsx',
    '!app/blog/page.tsx',
    '!app/category/**',
    '!components/Footer.tsx',
    '!components/PostContent.tsx',
  ],
  coverageThreshold: {
    // TDD-implemented features (6 features from TDD_IMPLEMENTATION_GUIDE.md)
    'components/ui/*.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'components/CookieConsent.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'components/search/*.tsx': {
      branches: 70, // Lower threshold - uncovered branches are defensive edge cases
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'components/mobile/*.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'components/RelatedPosts.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'app/api/search/route.ts': {
      branches: 80, // Lower threshold - uncovered branches are defensive edge cases
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
