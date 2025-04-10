# browser-support

This library allows websites to maintain compatibility with older browsers, which do not implement newer features. It does so using [polyfills](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill) for small new features, plus functions to determine if a browser supports a set of features natively or with polyfills.

If you would like to see what features the browser you are currently using implements, you [can visit the documentation site](https://github.github.com/browser-support/) which displays a compatibility table that detects which features are natively supported in your browser.

### How is this used on GitHub?

We use all of these polyfills on GitHub.com. We also use the `isSupported()` function to determine if the browser meets a minimum set of functionality which we expect, browser that return false from `isSupported()` do not send errors or statistics to our backend monitoring.

## Installation

```
$ npm install @github/browser-support
```

## Usage

### JS

```js
import {isSupported, isPolyfilled, apply} from '@github/browser-support'

// Check if a browser is supported
if (!isSupported()) {
  apply()
  console.assert(isSupported() === true)
  console.assert(isPolyfilled() === true)
}
```

## Development

```
npm install
npm test
```

## Upgrading browser-support in Dotcom 

During upgrades, it is crucial to ensure that browser error reporting to Sentry is not disrupted. Use the following steps to validate this functionality:

### Review lab testing
- Create a PR to upgrade the `browser-support` version in Dotcom.
- Trigger a browser error from your `review-lab` instance and confirm it is reported in Sentry:
  - Append `#b00m` to your `review-lab` URL (e.g. `https://branchname.review-lab.github.com#b00m`) and refresh the page.
  - Confirm the error is reported in [review-lab Sentry](https://github.sentry.io/issues/?environment=review-lab&groupStatsPeriod=auto&project=1890375&query=b00m&referrer=issue-list&statsPeriod=5m).
  - Perform these steps in Chrome, Firefox, Edge, and Opera. Note: Errors are currently not reported in Safari due to an [open issue](https://github.com/github/web-systems/issues/3162).

### Production deployment

- Check the [browser-reporting](https://app.datadoghq.com/monitors/168685099) monitor.
  - If the rate of reported browser errors drops, the monitor will trigger an alert in the [#web-systems-ops](https://github-grid.enterprise.slack.com/archives/C046W1V95FV) channel.
- After deploying to canary:
  - Trigger a browser error by appending `#b00m` to your URL.
  - Confirm the error is reported in [canary Sentry](https://github.sentry.io/issues/?environment=canary&groupStatsPeriod=auto&project=1890375&query=b00m&referrer=issue-list&statsPeriod=5m).
- After deploying to production:
  - Trigger a browser error by appending `#b00m` to your URL.  
  - Confirm the error is reported in [production Sentry](https://github.sentry.io/issues/?environment=production&groupStatsPeriod=auto&project=1890375&query=b00m&referrer=issue-list&statsPeriod=5m).
  - Check the [browser-reporting monitor](https://app.datadoghq.com/monitors/168685099) to ensure there are no anomalies in the error reporting rate.

## Contributing

### Adding polyfills

Please do not add any polyfills for ECMA features that are Stage 3 or below. We _only_ wish to polyfill features from ECMAScript that are Stage 4 (about to be included in a new years specification) or already specified.

### Removing polyfills

Polyfills should only be removed after consulting with the `@github/web-systems` who will determine if a polyfill can be removed. This code is designed to be kept lightweight, we do not want to ship dozens of kb of polyfills.

As a polyfill is removed, it may be worth adding feature detection to the `baseSupport` const, to ensure that our baseline moves with our browser support matrix.

## License

Distributed under the MIT license. See LICENSE for details.
