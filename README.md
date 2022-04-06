# browser-support

This library allows websites to maintain compatibility with older browsers, which do not implement newer features. It does so using [polyfills](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill) for small new features, plus functions to determine if a browser supports a set of features natively or with polyfills.

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

## Contributing

### Adding polyfills

Please do not add any polyfills for ECMA features that are Stage 3 or below. We _only_ wish to polyfill features from ECMAScript that are Stage 4 (about to be included in a new years specification) or already specified.

### Removing polyfills

Polyfills should only be removed after consulting with the `@github/web-systems` who will determine if a polyfill can be removed. This code is designed to be kept lightweight, we do not want to ship dozens of kb of polyfills.

As a polyfill is removed, it may be worth adding feature detection to the `baseSupport` const, to ensure that our baseline moves with our browser support matrix.

## License

Distributed under the MIT license. See LICENSE for details.
