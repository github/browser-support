# browser-support

Polyfills for small new features, plus functions to determine browser feature support.

### How is this used on GitHub?

We use all of these polyfills on GitHub.com. We also use the `isSupported()` function to determine if the browser is well supported, unsupported browsers do not send errors or statistics to our backend monitoring.

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

When our supported browsers (see github/github for details) all support a feature without polyfills, we can remove the polyfill. This code is designed to be kept lightweight, we do not want to ship dozens of kb of polyfills.

As a polyfill is removed, it may be worth adding feature detection to the `baseSupport` const, to ensure that our baseline moves with our browser support matrix.

## License

Distributed under the MIT license. See LICENSE for details.
