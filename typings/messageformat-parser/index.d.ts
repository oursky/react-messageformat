declare module "messageformat-parser" {
  export type Token =
    | string
    | Argument
    | SelectOrdinal
    | Plural
    | Select
    | Func;
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
  export function parse(
    src: string,
    options: {
      strict: true;
    }
  ): Token[];
}
