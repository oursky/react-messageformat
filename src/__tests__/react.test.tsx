import * as React from "react";
import * as renderer from "react-test-renderer";
import {
  LocaleProvider,
  Context,
  FormattedMessage,
  FormattedDate,
  MessageOwnProps,
} from "../react";

const locale = "en";
const messageByID = {
  "plain.string": "Hello world",
  argument: "I meet {GUEST}",
  plural: "{N, plural, =4{four} one{ichi} other{#}}",
  "react.element": "{ANY} {NESTED} {REACT} {ELEMENT}",
  react: "This is a {A, react, href{{SCHEME}://{HOST}} children{link}}",
  "react.nonstring": "This is a {A, react, href{{href}}}",
};

function Shortcut(props: MessageOwnProps) {
  return (
    <LocaleProvider locale={locale} messageByID={messageByID}>
      <FormattedMessage {...props} />
    </LocaleProvider>
  );
}

function Input(props: MessageOwnProps) {
  return (
    <Context.Consumer>
      {({ renderToString }) => {
        return <input placeholder={renderToString(props.id, props.values)} />;
      }}
    </Context.Consumer>
  );
}

class AnyComponent extends React.Component {
  render() {
    return "AnyComponent";
  }
}

test("plain.string", () => {
  const tree = renderer.create(<Shortcut id="plain.string" />).toJSON();
  expect(tree).toMatchSnapshot();
});

test("argument", () => {
  const tree = renderer
    .create(
      <Shortcut
        id="argument"
        values={{
          GUEST: "John",
        }}
      />
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});

test("plural", () => {
  const tree = renderer
    .create(
      <Shortcut
        id="plural"
        values={{
          N: 4,
        }}
      />
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});

test("React Element as value", () => {
  const tree = renderer
    .create(
      <LocaleProvider locale={locale} messageByID={messageByID}>
        <FormattedMessage
          id="react.element"
          values={{
            ANY: <FormattedMessage id="plain.string" />,
            NESTED: <AnyComponent />,
            REACT: (
              <FormattedMessage
                id="argument"
                values={{
                  GUEST: "John",
                }}
              />
            ),
            ELEMENT: (
              <FormattedMessage
                id="plural"
                values={{
                  N: 1,
                }}
              />
            ),
          }}
        />
      </LocaleProvider>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});

test("Embedded React Element", () => {
  const tree = renderer
    .create(
      <LocaleProvider locale={locale} messageByID={messageByID}>
        <FormattedMessage
          id="react"
          components={{
            A: "a",
          }}
          values={{
            SCHEME: "https",
            HOST: "www.example.com",
          }}
        />
      </LocaleProvider>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});

test("Embedded React Element with non-string value", () => {
  const tree = renderer
    .create(
      <LocaleProvider locale={locale} messageByID={messageByID}>
        <FormattedMessage
          id="react.nonstring"
          components={{
            A: "a",
          }}
          values={{
            href: {
              valueOf: () => "https://reactjs.org",
              toString: () => "https://reactjs.org",
            },
          }}
        />
      </LocaleProvider>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});

test("imperative", () => {
  const tree = renderer
    .create(
      <LocaleProvider locale={locale} messageByID={messageByID}>
        <Input id="plain.string" />
      </LocaleProvider>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});

test("FormattedDate", () => {
  const tree = renderer
    .create(
      <LocaleProvider locale={locale} messageByID={messageByID}>
        <FormattedDate value={new Date("2018-08-08")} month="long" />
      </LocaleProvider>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
