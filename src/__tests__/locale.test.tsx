import { localeToLanguage } from "../locale";

describe("localeToLanguage", () => {
  it("handles language", () => {
    expect(localeToLanguage("en")).toEqual("en");
  });
  it("handles language-script", () => {
    expect(localeToLanguage("zh-Hant")).toEqual("zh");
  });
  it("handles language-script-region", () => {
    expect(localeToLanguage("zh-HK-Hant")).toEqual("zh");
  });
  it("treats _ as -", () => {
    expect(localeToLanguage("en_US")).toEqual("en");
  });
  it("handles case", () => {
    expect(localeToLanguage("EN_us")).toEqual("en");
  });
});
