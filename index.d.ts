import * as React from "react";
export type Token = string | Argument | SelectOrdinal | Plural | Select | Func;
export type TokenOrOctothorpe = Token | Octothorpe;
export interface Argument {
  type: "argument";
  arg: Identifier;
}
export interface SelectOrdinal {
  type: "selectordinal";
  arg: Identifier;
  offset: string;
  cases: PluralCase[];
}
export interface Plural {
  type: "plural";
  arg: Identifier;
  offset: string;
  cases: PluralCase[];
}
export interface Select {
  type: "select";
  arg: Identifier;
  cases: SelectCase[];
}
export interface Func {
  type: "function";
  arg: Identifier;
  key: Identifier;
}
export interface PluralCase {
  key: string; // "zero" | "one" | "two" | "few" | "many" | "other" | "0" | "1" | ...
  tokens: TokenOrOctothorpe[];
}
export interface SelectCase {
  key: Identifier;
  tokens: Token[];
}
export interface Octothorpe {
  type: "octothorpe";
}
export type Identifier = string;
export type Value = string | number | object;
export interface Values {
  [key: string]: Value;
}
export interface Components {
  [key: string]: React.ReactType;
}
export interface ProviderProps {
  locale: string;
  messageByID: { [key: string]: string | undefined };
  children?: React.ReactNode;
}
export interface ContextValue {
  locale: string;
  compile: (id: string) => Token[];
  renderToString: (id: string, values?: Values) => string;
}
export interface ConsumerProps {
  children: (contextValue: ContextValue) => React.ReactNode;
}
export interface FormattedMessageProps {
  id: string;
  values?: Values;
  components?: Components;
}
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
export interface FormattedDateProps extends DateTimeFormatOptions {
  value: Date;
}

export function parse(source: string): Token[];
export function evaluate(
  tokens: Token[],
  locale: string,
  values: Values,
  components: Components
): Value[];
export class Provider extends React.Component<ProviderProps> {}
export class Consumer extends React.Component<ConsumerProps> {}
export class FormattedMessage extends React.Component<FormattedMessageProps> {}
export class FormattedDate extends React.Component<FormattedDateProps> {}
