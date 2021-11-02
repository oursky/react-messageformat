import * as React from "react";
import { renderToString as reactServerDOMRenderToString } from "react-dom/server";
import { Token } from "@louischan-oursky/messageformat-parser";
import { parse } from "./parse";
import { localeToLanguage } from "./locale";
import { Values, evaluate } from "./eval";

export interface Components {
  [key: string]: React.ElementType;
}

export interface ContextValue {
  locale: string;
  language: string;
  compile: (id: string) => Token[];
  renderToString: (id: string, values?: Values) => string;
  defaultComponents?: Components;
}

export interface ProviderProps {
  locale: string;
  messageByID: { [key: string]: string | undefined };
  defaultComponents?: Components;
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

type MessageProps = MessageOwnProps & ContextValue;

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
      const { locale, defaultComponents } = this.props;
      const tokens = this.compile(id);
      const language = localeToLanguage(locale);
      const components = {
        ...defaultComponents,
      };
      const result = evaluate(tokens, language, values || {}, components);
      const children = [];
      for (let i = 0; i < result.length; ++i) {
        const element = result[i];
        children.push(<React.Fragment key={i}>{element}</React.Fragment>);
      }
      const tree = <>{children}</>;
      return reactServerDOMRenderToString(tree);
    } catch (e) {
      console.warn(e);
      return "";
    }
  };

  render() {
    const { locale, children, defaultComponents } = this.props;
    return (
      <Provider
        value={{
          locale,
          defaultComponents,
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
    const {
      id,
      values,
      components: ownComponents,
      defaultComponents,
      language,
      compile,
    } = props;
    const tokens = compile(id);
    const components = {
      ...defaultComponents,
      ...ownComponents,
    };
    const result = evaluate(tokens, language, values || {}, components);
    const children = [];
    for (let i = 0; i < result.length; ++i) {
      const element = result[i];
      children.push(<React.Fragment key={i}>{element}</React.Fragment>);
    }
    return <>{children}</>;
  } catch (e) {
    console.warn(e);
    return "" as any as React.ReactElement<any>;
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
