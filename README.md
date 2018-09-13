# react-messageformat

## Installation

```sh
$ npm install --save @oursky/react-messageformat
$ yarn add @oursky/react-messageformat
```

This library assumes the present of `Intl`.

You must apply your own polyfill in your application.

You must apply your own polyfill in your application.

You must apply your own polyfill in your application.

We have to say three times because it is so important.

## Usage

```typescript
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, FormattedMessage } from "@oursky/react-messageformat";

const MESSAGES = {
  "my.message": "Hello World",
};

function Page() {
  return (
    <FormattedMessage id="my.message" />
  );
}

function App() {
  return (
    <Provider locale="en" messageByID={MESSAGES}>
      <Page />
    </Provider>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```
