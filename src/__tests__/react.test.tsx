import React, { useContext } from "react";
import { create } from "react-test-renderer";
import {
  LocaleProvider,
  Context,
  FormattedMessage,
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
  "react.imperative.string": "This is a {B, react}",
  "react.imperative.nested":
    "This is a {strong, react, children{{i, react, children{content}}}}",
  "regression.0":
    "Are you sure to change the {a, select, varianta{A} variantb{B} other{}}?",
};

function Shortcut(props: MessageOwnProps) {
  return (
    <LocaleProvider locale={locale} messageByID={messageByID}>
      <FormattedMessage {...props} />
    </LocaleProvider>
  );
}

function Input(props: MessageOwnProps) {
  const { id, values } = props;
  const { renderToString } = useContext(Context);
  return <input placeholder={renderToString(id, values)} />;
}

class AnyComponent extends React.Component {
  render() {
    return "AnyComponent";
  }
}

test("plain.string", () => {
  const tree = create(<Shortcut id="plain.string" />).toJSON();
  expect(tree).toMatchSnapshot();
});

test("argument", () => {
  const tree = create(
    <Shortcut
      id="argument"
      values={{
        GUEST: "John",
      }}
    />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("plural", () => {
  const tree = create(
    <Shortcut
      id="plural"
      values={{
        N: 4,
      }}
    />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("React Element as value", () => {
  const tree = create(
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
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("Embedded React Element", () => {
  const tree = create(
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
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("Embedded React Element with non-string value", () => {
  const tree = create(
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
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("imperative", () => {
  const tree = create(
    <LocaleProvider locale={locale} messageByID={messageByID}>
      <Input id="plain.string" />
    </LocaleProvider>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("imperative nested", () => {
  const tree = create(
    <LocaleProvider locale={locale} messageByID={messageByID}>
      <Input id="react.imperative.nested" />
    </LocaleProvider>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("defaultComponents", () => {
  const tree = create(
    <LocaleProvider
      locale={locale}
      messageByID={messageByID}
      defaultComponents={{
        A: "a",
      }}
    >
      <FormattedMessage
        id="react"
        values={{
          SCHEME: "https",
          HOST: "www.example.com",
        }}
      />
    </LocaleProvider>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("components override defaultComponents", () => {
  const tree = create(
    <LocaleProvider
      locale={locale}
      messageByID={messageByID}
      defaultComponents={{
        A: "a",
      }}
    >
      <FormattedMessage
        id="react"
        components={{
          A: "span",
        }}
        values={{
          SCHEME: "https",
          HOST: "www.example.com",
        }}
      />
    </LocaleProvider>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("regression.0", () => {
  const tree = create(
    <LocaleProvider locale={locale} messageByID={messageByID}>
      <Input
        id="regression.0"
        values={{
          a: "variantb",
        }}
      />
    </LocaleProvider>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
