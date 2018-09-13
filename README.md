# react-messageformat

## Installation

```sh
$ npm install --save @oursky/react-messageformat
$ yarn add @oursky/react-messageformat
```

## Usage

```
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
