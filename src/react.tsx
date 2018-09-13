import * as React from "react";
import { Token } from "messageformat-parser";
import { parse } from "./parse";
import { Values, evaluate } from "./eval";

export interface ContextValue {
  locale: string;
  compile: (id: string) => Token[];
}

export interface ProviderProps {
  locale: string;
  messageByID: { [key: string]: string | undefined };
  children?: React.ReactNode;
}

interface ProviderState {
  tokensByID: { [key: string]: Token[] | undefined };
}

export interface MessageOwnProps {
  id: string;
  values?: Values;
}

interface MessageContextProps {
  locale: string;
  compile: (id: string) => Token[];
}

type MessageProps = MessageOwnProps & MessageContextProps;

const defaultValue: ContextValue = {
  locale: "en",
  compile: () => [],
};
const { Provider: Provider_, Consumer } = React.createContext<ContextValue>(
  defaultValue
);

export class Provider extends React.Component<ProviderProps, ProviderState> {
  state: ProviderState = {
    tokensByID: {},
  };

  componentDidUpdate(prevProps: ProviderProps) {
    if (this.props.locale !== prevProps.locale) {
      this.setState({
        tokensByID: {},
      });
    }
  }

  compile = (id: string) => {
    const cachedTokens = this.state.tokensByID[id];
    if (cachedTokens != null) {
      return cachedTokens;
    }
    const source = this.props.messageByID[id];
    if (source == null) {
      throw new Error(`expected "${id}" to exist`);
    }
    const tokens = parse(source);
    this.setState(prevState => {
      return {
        tokensByID: {
          ...prevState.tokensByID,
          [id]: tokens,
        },
      };
    });
    return tokens;
  };

  render() {
    const { locale, children } = this.props;
    return (
      <Provider_
        value={{
          locale,
          compile: this.compile,
        }}
      >
        {children}
      </Provider_>
    );
  }
}

function Message(props: MessageProps) {
  const { id, values, locale, compile } = props;
  const tokens = compile(id);
  const result = evaluate(tokens, locale, values);
  const children = [];
  for (let i = 0; i < result.length; ++i) {
    const element = result[i];
    children.push(<React.Fragment key={i}>{element}</React.Fragment>);
  }
  return <>{children}</>;
}

export class FormattedMessage extends React.Component<MessageOwnProps> {
  renderMessage = (contextValue: ContextValue) => {
    const { id, values } = this.props;
    const { locale, compile } = contextValue;
    return (
      <Message id={id} values={values} locale={locale} compile={compile} />
    );
  };

  render() {
    return <Consumer>{this.renderMessage}</Consumer>;
  }
}
