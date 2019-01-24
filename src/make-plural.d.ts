declare module "make-plural" {
  export type PluralRule = "zero" | "one" | "two" | "few" | "many" | "other";
  export type PluralFunc = (n: number, ordinal: boolean) => PluralRule;
  export interface PluralByLocale {
    [key: string]: undefined | PluralFunc;
  }
}
