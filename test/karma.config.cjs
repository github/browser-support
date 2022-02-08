process.env.CHROME_BIN = require('chromium').path

module.exports = function (config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha', 'chai'],
    files: [
      {pattern: 'lib/*.js', type: 'module', included: false},
      {pattern: 'test/*', type: 'module', included: true}
    ],
    reporters: ['mocha'],
    reportSlowerThan: 50,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity,
    client: {
      mocha: {
        timeout: 100
      }
    }
  })
}
