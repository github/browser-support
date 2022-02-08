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

## License

Distributed under the MIT license. See LICENSE for details.
