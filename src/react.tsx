import * as React from "react";
import { Token } from "@louischan-oursky/messageformat-parser";
import { parse } from "./parse";
import { Values, evaluate } from "./eval";

export interface Components {
  [key: string]: React.ReactType;
}

export interface ContextValue {
  locale: string;
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
  locale: string;
  compile: (id: string) => Token[];
}

type MessageProps = MessageOwnProps & MessageContextProps;

const defaultValue: ContextValue = {
  locale: "en",
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
      this.setState(prevState => {
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
      const result = evaluate(tokens, locale, values || {}, {});
      const output = [];
      for (const a of result) {
        if (typeof a !== "string") {
          throw new Error(`unexpected non-string value "${id}"`);
        }
        output.push(a);
      }
      return output.join("");
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        return "";
      }
      throw e;
    }
  };

  render() {
    const { locale, children } = this.props;
    return (
      <Provider
        value={{
          locale,
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
    const { id, values, components, locale, compile } = props;
    const tokens = compile(id);
    const result = evaluate(tokens, locale, values || {}, components || {});
    const children = [];
    for (let i = 0; i < result.length; ++i) {
      const element = result[i];
      children.push(<React.Fragment key={i}>{element}</React.Fragment>);
    }
    return <>{children}</>;
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      return ("" as any) as React.ReactElement<any>;
    }
    throw e;
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
