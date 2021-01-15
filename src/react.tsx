import * as React from "react";
import { Token } from "@louischan-oursky/messageformat-parser";
import { parse } from "./parse";
import { localeToLanguage } from "./locale";
import { Values, evaluate } from "./eval";

export interface Components {
  [key: string]: React.ReactType;
}

export interface ContextValue {
  locale: string;
  language: string;
  compile: (id: string) => Token[];
  renderToString: (id: string, values?: Values) => string;
}

export interface ProviderProps {
  locale: string;
  messageByID: { [key: string]: string | undefined };
  children?: React.ReactNode;
}

interface ProviderState {
  version: number;
}

export interface MessageOwnProps {
  id: string;
  values?: Values;
  components?: Components;
}

interface MessageContextProps {
  language: string;
  compile: (id: string) => Token[];
}

type MessageProps = MessageOwnProps & MessageContextProps;

const defaultValue: ContextValue = {
  locale: "en",
  language: "en",
  compile: () => [],
  renderToString: () => "",
};
const Context = React.createContext<ContextValue>(defaultValue);
const { Provider, Consumer } = Context;

export { Context };
export { Consumer };

export class LocaleProvider extends React.Component<
  ProviderProps,
  ProviderState
> {
  tokensByID: { [key: string]: Token[] | undefined } = {};
  state = {
    version: 0,
  };

  componentDidUpdate(prevProps: ProviderProps) {
    if (this.props.locale !== prevProps.locale) {
      this.tokensByID = {};
      this.setState((prevState) => {
        return {
          version: prevState.version + 1,
        };
      });
    }
  }

  compile = (id: string) => {
    const cachedTokens = this.tokensByID[id];
    if (cachedTokens != null) {
      return cachedTokens;
    }
    const source = this.props.messageByID[id];
    if (source == null) {
      throw new Error(`expected "${id}" to exist`);
    }
    try {
      const tokens = parse(source);
      this.tokensByID = {
        ...this.tokensByID,
        [id]: tokens,
      };
      return tokens;
    } catch (e) {
      const message = e.message;
      e.message = `"${id}": ${message}`;
      throw e;
    }
  };

  renderToString = (id: string, values?: Values) => {
    try {
      const { locale } = this.props;
      const tokens = this.compile(id);
      const language = localeToLanguage(locale);
      const result = evaluate(tokens, language, values || {}, {});
      const output = [];
      for (const a of result) {
        if (typeof a !== "string") {
          throw new Error(`unexpected non-string value "${id}"`);
        }
        output.push(a);
      }
      return output.join("");
    } catch (e) {
      console.warn(e);
      return "";
    }
  };

  render() {
    const { locale, children } = this.props;
    return (
      <Provider
        value={{
          locale,
          language: localeToLanguage(locale),
          compile: this.compile,
          renderToString: this.renderToString,
        }}
      >
        {children}
      </Provider>
    );
  }
}

function Message(props: MessageProps) {
  try {
    const { id, values, components, language, compile } = props;
    const tokens = compile(id);
    const result = evaluate(tokens, language, values || {}, components || {});
    const children = [];
    for (let i = 0; i < result.length; ++i) {
      const element = result[i];
      children.push(<React.Fragment key={i}>{element}</React.Fragment>);
    }
    return <>{children}</>;
  } catch (e) {
    console.warn(e);
    return ("" as any) as React.ReactElement<any>;
  }
}

export class FormattedMessage extends React.Component<MessageOwnProps> {
  renderMessage = (contextValue: ContextValue) => {
    return <Message {...this.props} {...contextValue} />;
  };

  render() {
    return <Consumer>{this.renderMessage}</Consumer>;
  }
}

export function useMessageFormat(props: Omit<MessageOwnProps, "id"> = {}) {
  const { useState, useContext, useCallback } = React;

  if (!useState) {
    throw new Error("At least react@16.7 is required to use useMessageFormat");
  }

  const context = useContext(Context);

  const compile = useCallback(
    (
      id: MessageOwnProps["id"],
      values?: MessageOwnProps["values"],
      components?: MessageOwnProps["components"]
    ) => (
      <FormattedMessage
        {...props}
        id={id}
        values={values || props.values}
        components={components || props.components}
      />
    ),
    [props, context]
  );

  return {
    ...context,
    compile,
  };
}
