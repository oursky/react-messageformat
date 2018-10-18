import {
  Token,
  TokenOrOctothorpe,
  Select,
  SelectCase,
  Plural,
  SelectOrdinal,
  PluralCase,
} from "@louischan-oursky/messageformat-parser";
import * as makePlural_ from "make-plural";
import { PluralFunc, PluralByLocale } from "make-plural";

const makePlural: PluralByLocale = makePlural_;

export type Value = string | number | object;
export type OutputValue = string | object;

type InternalValue = Value | Value[];

export interface Values {
  [key: string]: Value;
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

function resolvePluralFunc(locale: string): PluralFunc {
  const func = makePlural[locale];
  if (func == null) {
    throw new Error("unsupported locale: " + locale);
  }
  return func;
}

function resolvePluralCase(
  pluralOrSelectOrdinal: Plural | SelectOrdinal,
  locale: string,
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
  const pluralFunc = resolvePluralFunc(locale);
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
  locale: string,
  values: Values | undefined,
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
          const result = resolvePluralCase(token, locale, values);
          const nestedTokens = evaluateToInternalValue(
            result.pluralCase.tokens,
            locale,
            values,
            result.currentValue
          );
          output.push(nestedTokens);
          break;
        }
        case "selectordinal": {
          const result = resolvePluralCase(token, locale, values);
          const nestedTokens = evaluateToInternalValue(
            result.pluralCase.tokens,
            locale,
            values,
            result.currentValue
          );
          output.push(nestedTokens);
          break;
        }
        case "select": {
          const selectCase = resolveSelectCase(token, values);
          const nestedTokens = evaluateToInternalValue(
            selectCase.tokens,
            locale,
            values,
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
          break;
        }
      }
    }
  }
  return output;
}

function toValues(intervalValues: InternalValue[]): Value[] {
  const output = [];
  for (const v of intervalValues) {
    if (Array.isArray(v)) {
      output.push(...toValues(v));
    } else {
      output.push(v);
    }
  }
  return output;
}

function toOutputValues(values: Value[]): OutputValue[] {
  const output = [];
  for (const v of values) {
    if (typeof v === "number") {
      output.push(String(v));
    } else {
      output.push(v);
    }
  }
  return output;
}

export function evaluate(
  tokens: Token[],
  locale: string,
  values?: Values
): Value[] {
  const internalValues = evaluateToInternalValue(
    tokens,
    locale,
    values,
    undefined
  );
  return toOutputValues(toValues(internalValues));
}
