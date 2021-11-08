import React, { useContext } from "react";
import { create } from "react-test-renderer";
import {
  LocaleProvider,
  Context,
  FormattedMessage,
  MessageOwnProps,
} from "../react";

interface DeclarativeMessageProps {
  message: string;
  values?: MessageOwnProps["values"];
  components?: MessageOwnProps["components"];
}

function DeclarativeMessage(props: DeclarativeMessageProps) {
  const { message, ...rest } = props;
  const messageByID = {
    id: message,
  };
  return (
    <LocaleProvider locale="en" messageByID={messageByID}>
      <FormattedMessage id="id" {...rest} />
    </LocaleProvider>
  );
}

interface ImperativeMessageProps {
  message: string;
  values?: MessageOwnProps["values"];
}

function ImperativeMessage(props: ImperativeMessageProps) {
  const { message, values } = props;
  const messageByID = {
    id: message,
  };

  function Input() {
    const { renderToString } = useContext(Context);
    return <input placeholder={renderToString("id", values)} />;
  }

  return (
    <LocaleProvider locale="en" messageByID={messageByID}>
      <Input />
    </LocaleProvider>
  );
}

test("plain.string", () => {
  const tree = create(<DeclarativeMessage message="Hello world" />).toJSON();
  expect(tree).toMatchSnapshot();
});

test("argument", () => {
  const tree = create(
    <DeclarativeMessage
      message="I meet {GUEST}"
      values={{
        GUEST: "John",
      }}
    />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("plural", () => {
  const tree = create(
    <DeclarativeMessage
      message="{N, plural, =4{four} one{ichi} other{#}}"
      values={{
        N: 4,
      }}
    />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("React Element as value", () => {
  class AnyComponent extends React.Component {
    render() {
      return "AnyComponent";
    }
  }

  const messageByID = {
    id: "{ANY} {NESTED} {REACT} {ELEMENT}",
    "plain.string": "Hello world",
    argument: "I meet {GUEST}",
    plural: "{N, plural, =4{four} one{ichi} other{#}}",
  };

  const tree = create(
    <LocaleProvider locale="en" messageByID={messageByID}>
      <FormattedMessage
        id="id"
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
    <DeclarativeMessage
      message="This is a {A, react, href{{SCHEME}://{HOST}} children{link}}"
      components={{
        A: "a",
      }}
      values={{
        SCHEME: "https",
        HOST: "www.example.com",
      }}
    />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("Embedded React Element with non-string value", () => {
  const tree = create(
    <DeclarativeMessage
      message="This is a {A, react, href{{href}}}"
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
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("imperative", () => {
  const tree = create(<ImperativeMessage message="Hello world" />).toJSON();
  expect(tree).toMatchSnapshot();
});

test("imperative nested", () => {
  const tree = create(
    <ImperativeMessage message="This is a {strong, react, children{{i, react, children{content}}}}" />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

test("defaultComponents", () => {
  const messageByID = {
    id: "This is a {A, react, href{{SCHEME}://{HOST}} children{link}}",
  };

  const tree = create(
    <LocaleProvider
      locale="en"
      messageByID={messageByID}
      defaultComponents={{
        A: "a",
      }}
    >
      <FormattedMessage
        id="id"
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
  const messageByID = {
    id: "This is a {A, react, href{{SCHEME}://{HOST}} children{link}}",
  };

  const tree = create(
    <LocaleProvider
      locale="en"
      messageByID={messageByID}
      defaultComponents={{
        A: "a",
      }}
    >
      <FormattedMessage
        id="id"
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
    <ImperativeMessage
      message="Are you sure to change the {a, select, varianta{A} variantb{B} other{}}?"
      values={{
        a: "variantb",
      }}
    />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
