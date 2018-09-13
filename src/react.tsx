import * as React from "react";
import { Token } from "messageformat-parser";
import { parse } from "./parse";
import { Values, evaluate } from "./eval";

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

export interface MessageOwnProps {
  id: string;
  values?: Values;
}

interface MessageContextProps {
  locale: string;
  compile: (id: string) => Token[];
}

type MessageProps = MessageOwnProps & MessageContextProps;

export interface DateTimeFormatOptions {
  hour12?: boolean;
  weekday?: "narrow" | "short" | "long";
  era?: "narrow" | "short" | "long";
  year?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "narrow" | "short" | "long";
  day?: "numeric" | "2-digit";
  hour?: "numeric" | "2-digit";
  minute?: "numeric" | "2-digit";
  second?: "numeric" | "2-digit";
}

export interface FormattedDateOwnProps extends DateTimeFormatOptions {
  value: Date;
}

interface FormattedDateContextProps {
  locale: string;
}

type FormattedDateProps = FormattedDateOwnProps & FormattedDateContextProps;

const defaultValue: ContextValue = {
  locale: "en",
  compile: () => [],
  renderToString: () => "",
};
const { Provider: Provider_, Consumer } = React.createContext<ContextValue>(
  defaultValue
);

export { Consumer };

export class Provider extends React.Component<ProviderProps> {
  // This is not part of the state because
  // compile will be called within render
  // and we cannot use setState within render.
  // Also the value should not affect render
  // beacuse it works as a cache.
  tokensByID: { [key: string]: Token[] | undefined } = {};

  componentDidUpdate(prevProps: ProviderProps) {
    if (this.props.locale !== prevProps.locale) {
      this.tokensByID = {};
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
    const tokens = parse(source);
    this.tokensByID = {
      ...this.tokensByID,
      [id]: tokens,
    };
    return tokens;
  };

  renderToString = (id: string, values?: Values) => {
    const { locale } = this.props;
    const tokens = this.compile(id);
    const result = evaluate(tokens, locale, values);
    const output = [];
    for (const a of result) {
      if (typeof a !== "string") {
        throw new Error(`unexpected non-string value "${id}"`);
      }
      output.push(a);
    }
    return output.join("");
  };

  render() {
    const { locale, children } = this.props;
    return (
      <Provider_
        value={{
          locale,
          compile: this.compile,
          renderToString: this.renderToString,
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

class FormattedDate_ extends React.Component<FormattedDateProps> {
  render() {
    const { value, locale, ...options } = this.props;
    const dateFormat = new Intl.DateTimeFormat(locale, options);
    const output = dateFormat.format(value);
    return output;
  }
}

export class FormattedDate extends React.Component<FormattedDateOwnProps> {
  renderDate = (contextValue: ContextValue) => {
    const { locale } = contextValue;
    return <FormattedDate_ {...this.props} locale={locale} />;
  };

  render() {
    return <Consumer>{this.renderDate}</Consumer>;
  }
}
