module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
    transform: {
      '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
    }
  };
