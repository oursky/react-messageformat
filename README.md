# react-messageformat

## Installation

```sh
$ npm install --save @oursky/react-messageformat
$ yarn add @oursky/react-messageformat
```

## Usage

```typescript
import * as React from "react";
import * as ReactDOM from "react-dom";
import { LocaleProvider, FormattedMessage } from "@oursky/react-messageformat";

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
    <LocaleProvider locale="en" messageByID={MESSAGES}>
      <Page />
    </LocaleProvider>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```

## Features

- Simple argument `{ARG}`
- Select `{GENDER, select, male{He} female{She} other{They}}`
- Ordinal `{ORD, selectordinal, one{#st} two{#nd} few{#rd} other{#th}}`
- Plural `{NUM, plural, one{1 apple} other{# apples}}`
- React Element `{a, react, href{http://www.example.com} children{a link}}`
- Supported values are `string`, `number` and React Element.

## What is this

This library is a replacement of [react-intl](https://github.com/yahoo/react-intl)

## Why

- We use React 16.3 Context API while react-intl uses old context API. By using the new API, we no longer suffer from [the caveat of the old API](https://reactjs.org/docs/legacy-context.html#updating-context)
- We use a more correct parser. The difference can be demonstrated by this script

```js
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const ReactIntl = require("react-intl");
const ReactMessageFormat = require("@oursky/react-messageformat");

const a = ReactDOMServer.renderToString(
  React.createElement(
    ReactIntl.IntlProvider,
    { locale: "en", textComponent: props => props.children },
    React.createElement(ReactIntl.FormattedMessage, {
      id: "a",
      values: { A: "true" },
      defaultMessage: "{A, select, true{} other{}}",
    })
  )
);
console.log("react-intl", a);
// react-intl will emit a warning complaining that it cannot parse the message.
// And it will render the unparsed message as plain string.

const b = ReactDOMServer.renderToString(
  React.createElement(
    ReactMessageFormat.LocaleProvider,
    { locale: "en", messageByID: { a: "{A, select, true{} other{}}" } },
    React.createElement(ReactMessageFormat.FormattedMessage, {
      id: "a",
      values: { A: "true" },
    })
  )
);
console.log("react-messageformat", b);
// b is an empty string.
```

- We write the evaluation function ourselves. The evaluation function evaluates the AST to an array, which is a first class React element. So we support nesting any react element. react-intl uses a [hack](https://github.com/yahoo/react-intl/blob/v2.6.0/src/components/message.js#L136) to support nesting react element.
