import {
  Token,
  TokenOrOctothorpe,
  React as ReactDirective,
  Select,
  SelectCase,
  Plural,
  SelectOrdinal,
  PluralCase,
} from "@louischan-oursky/messageformat-parser";
import * as React from "react";
import * as Plurals from "make-plural/plurals";

export type Value = string | number | ReactValue | object;
export type OutputValue = string | React.ReactElement<any> | object;

type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";
type PluralFunc = (n: number | string, ord?: boolean) => PluralCategory;
type PluralFuncByLanguage = Record<string, PluralFunc>;

interface ReactValue {
  __kind: "react";
  type: React.ElementType;
  props: { [key: string]: Value[] };
}

interface ReactInternalValue {
  __kind: "react";
  type: React.ElementType;
  props: { [key: string]: InternalValue[] };
}

type InternalValue = Value | Value[] | ReactInternalValue;

export interface Values {
  [key: string]: Value;
}

export interface Components {
  [key: string]: React.ElementType;
}

function getComponent(key: string, components: Components): React.ElementType {
  const c = components[key];
  if (c != null) {
    return c;
  }
  const firstChar = key.slice(0, 1);
  if (firstChar.toLowerCase() === firstChar) {
    // Assume it is HTML tag name.
    return key as any;
  }
  throw new Error(`expected component "${key}" to exist`);
}

function getValue(key: string, values?: Values): Value {
  if (values == null) {
    throw new Error(`expected "${key}" to exist but values is not provided`);
  }
  if (!values.hasOwnProperty(key)) {
    throw new Error(`expected "${key}" to exist`);
  }
  const value = values[key];
  return value;
}

function getNumber(key: string, values?: Values): number {
  const value = getValue(key, values);
  if (typeof value !== "number") {
    throw new Error(`expected "${key}" to be a number`);
  }
  return value;
}

function getString(key: string, values?: Values): string {
  const value = getValue(key, values);
  if (typeof value !== "string") {
    throw new Error(`expected "${key}" to be a string`);
  }
  return value;
}

function evaluateReactDirective(
  reactDirective: ReactDirective,
  language: string,
  values: Values,
  components: Components,
  currentValue: number | undefined
): ReactInternalValue {
  const { arg, props: cases } = reactDirective;
  const component = getComponent(arg, components);
  const props: { [key: string]: InternalValue[] } = {};
  for (const c of cases) {
    const { key, tokens } = c;
    props[key] = evaluateToInternalValue(
      tokens,
      language,
      values,
      components,
      currentValue
    );
  }
  return {
    __kind: "react",
    type: component,
    props,
  };
}

function resolveSelectCase(select: Select, values?: Values): SelectCase {
  const { arg, cases } = select;
  const value = getString(arg, values);
  let targetIndex: undefined | number;
  let otherIndex: undefined | number;
  for (let i = 0; i < cases.length; ++i) {
    const c = cases[i];
    if (c.key === "other") {
      otherIndex = i;
    }
    if (c.key === value) {
      targetIndex = i;
    }
  }
  if (otherIndex === undefined) {
    throw new Error("expected other case");
  }
  if (targetIndex !== undefined) {
    return cases[targetIndex];
  }
  return cases[otherIndex];
}

function resolvePluralFunc(language: string): PluralFunc {
  // @ts-expect-error
  const m: PluralFuncByLanguage = Plurals;
  const func = m[language];
  if (func == null) {
    throw new Error("unsupported language: " + language);
  }
  return func;
}

function resolvePluralCase(
  pluralOrSelectOrdinal: Plural | SelectOrdinal,
  language: string,
  values?: Values
): {
  pluralCase: PluralCase;
  currentValue: number;
} {
  const { type, arg, offset: offsetString, cases } = pluralOrSelectOrdinal;
  const offset = parseInt(offsetString, 10);
  if (isNaN(offset)) {
    throw new Error("invalid offset");
  }
  const ordinal = type === "selectordinal";
  const pluralFunc = resolvePluralFunc(language);
  const rawValue = getNumber(arg, values);
  const offsetValue = rawValue - offset;
  const pluralRule = pluralFunc(offsetValue, ordinal);
  const valueAsString = String(rawValue);
  let targetIndex: undefined | number;
  let otherIndex: undefined | number;
  for (let i = 0; i < cases.length; ++i) {
    const c = cases[i];
    if (c.key === "other") {
      otherIndex = i;
    }
    if (targetIndex === undefined) {
      if (c.key === valueAsString) {
        targetIndex = i;
      }
      if (c.key === pluralRule) {
        targetIndex = i;
      }
    }
  }
  if (otherIndex === undefined) {
    throw new Error("expected other case");
  }
  if (targetIndex !== undefined) {
    return {
      currentValue: offsetValue,
      pluralCase: cases[targetIndex],
    };
  }
  return {
    currentValue: offsetValue,
    pluralCase: cases[otherIndex],
  };
}

function evaluateToInternalValue(
  tokens: TokenOrOctothorpe[],
  language: string,
  values: Values,
  components: Components,
  currentValue: number | undefined
): InternalValue[] {
  const output = [];
  for (const token of tokens) {
    if (typeof token === "string") {
      output.push(token);
    } else {
      switch (token.type) {
        case "argument": {
          const value = getValue(token.arg, values);
          output.push(value);
          break;
        }
        case "plural": {
          const result = resolvePluralCase(token, language, values);
          const nestedTokens = evaluateToInternalValue(
            result.pluralCase.tokens,
            language,
            values,
            components,
            result.currentValue
          );
          output.push(nestedTokens);
          break;
        }
        case "selectordinal": {
          const result = resolvePluralCase(token, language, values);
          const nestedTokens = evaluateToInternalValue(
            result.pluralCase.tokens,
            language,
            values,
            components,
            result.currentValue
          );
          output.push(nestedTokens);
          break;
        }
        case "react": {
          const result = evaluateReactDirective(
            token,
            language,
            values,
            components,
            currentValue
          );
          output.push(result);
          break;
        }
        case "select": {
          const selectCase = resolveSelectCase(token, values);
          const nestedTokens = evaluateToInternalValue(
            selectCase.tokens,
            language,
            values,
            components,
            currentValue
          );
          output.push(nestedTokens);
          break;
        }
        case "octothorpe": {
          if (currentValue == null) {
            throw new Error("unexpected #");
          }
          output.push(currentValue);
          break;
        }
        default: {
          throw new Error("unexpected type: " + token.type);
        }
      }
    }
  }
  return output;
}

function isReactInternalValue(v: InternalValue): v is ReactInternalValue {
  return (
    typeof v === "object" &&
    v.hasOwnProperty("__kind") &&
    (v as any).__kind === "react"
  );
}

function isReactValue(v: Value): v is ReactValue {
  return (
    typeof v === "object" &&
    v.hasOwnProperty("__kind") &&
    (v as any).__kind === "react"
  );
}

function flatten(intervalValues: InternalValue[]): Value[] {
  const output = [];
  for (const v of intervalValues) {
    if (Array.isArray(v)) {
      output.push(...flatten(v));
    } else if (isReactInternalValue(v)) {
      const { props } = v;
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          props[key] = flatten(props[key]);
        }
      }
      output.push(v);
    } else {
      output.push(v);
    }
  }
  return output;
}

function collapseValues(values: OutputValue[]): OutputValue[] | OutputValue {
  const shouldCollapseToString = values.every((v) => typeof v === "string");
  if (shouldCollapseToString) {
    return values.map(String).join("");
  }
  const shouldCollapseToSingleValue = values.length === 1;
  if (shouldCollapseToSingleValue) {
    return values[0];
  }
  return values;
}

function toOutputValues(values: Value[]): OutputValue[] {
  const output = [];
  for (const v of values) {
    if (typeof v === "string") {
      output.push(v);
    } else if (typeof v === "number") {
      output.push(String(v));
    } else if (isReactValue(v)) {
      const propsExcludingChildren: {
        [key: string]: OutputValue[] | OutputValue;
      } = {};
      let children: OutputValue[] | OutputValue | undefined;
      const { type: component, props } = v;
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          const value = collapseValues(toOutputValues(props[key]));
          if (key === "children") {
            children = value;
          } else {
            propsExcludingChildren[key] = value;
          }
        }
      }
      if (children == null) {
        output.push(React.createElement(component, propsExcludingChildren));
      } else if (Array.isArray(children)) {
        output.push(
          React.createElement(component, propsExcludingChildren, ...children)
        );
      } else {
        output.push(
          React.createElement(component, propsExcludingChildren, children)
        );
      }
    } else {
      output.push(v);
    }
  }
  return output;
}

export function evaluate(
  tokens: Token[],
  language: string,
  values: Values,
  components: Components
): Value[] {
  const internalValues = evaluateToInternalValue(
    tokens,
    language,
    values,
    components,
    undefined
  );
  return toOutputValues(flatten(internalValues));
}
