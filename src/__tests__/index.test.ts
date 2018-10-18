import * as ReactIs from "react-is";
import { parse, evaluate } from "../index";

test("plain string", () => {
  const tokens = parse("a string");
  const result = evaluate(tokens, "en", {}, {});
  expect(result).toEqual(["a string"]);
});

test("argument", () => {
  const tokens = parse("{A} {B}");
  const result = evaluate(
    tokens,
    "en",
    {
      A: "a",
      B: "b",
    },
    {}
  );
  expect(result).toEqual(["a", " ", "b"]);
});

test("plural with builtin rule", () => {
  const tokens = parse("{N, plural, =4{four} one{ichi} other{#}}");
  const result = evaluate(
    tokens,
    "en",
    {
      N: 1,
    },
    {}
  );
  expect(result).toEqual(["ichi"]);
});

test("plural with exact value", () => {
  const tokens = parse("{N, plural, =4{four} one{ichi} other{#}}");
  const result = evaluate(
    tokens,
    "en",
    {
      N: 4,
    },
    {}
  );
  expect(result).toEqual(["four"]);
});

test("plural with pound sign", () => {
  const tokens = parse("{N, plural, =4{four} one{ichi} other{#}}");
  const result = evaluate(
    tokens,
    "en",
    {
      N: 10,
    },
    {}
  );
  expect(result).toEqual(["10"]);
});

test("selectordinal", () => {
  const tokens = parse(
    "{N, selectordinal, one{1st} two{2nd} few{3rd} other{#th}}"
  );
  expect(
    evaluate(
      tokens,
      "en",
      {
        N: 1,
      },
      {}
    )
  ).toEqual(["1st"]);
  expect(
    evaluate(
      tokens,
      "en",
      {
        N: 2,
      },
      {}
    )
  ).toEqual(["2nd"]);
  expect(
    evaluate(
      tokens,
      "en",
      {
        N: 3,
      },
      {}
    )
  ).toEqual(["3rd"]);
  expect(
    evaluate(
      tokens,
      "en",
      {
        N: 4,
      },
      {}
    )
  ).toEqual(["4", "th"]);
});

test("select", () => {
  const tokens = parse("{V, select, true{T} other{F}}");
  const result = evaluate(
    tokens,
    "en",
    {
      V: String(true),
    },
    {}
  );
  expect(result).toEqual(["T"]);
});

describe("react", () => {
  it("supports DOM element with string value", () => {
    const tokens = parse(
      "This is a {a, react, href {http://www.example.com} children {link}}."
    );
    const result = evaluate(tokens, "en", {}, {});
    expect(result.length).toBe(3);
    const e = result[1];
    expect(ReactIs.isElement(e)).toBe(true);
    expect((e as any).props.children).toEqual("link");
    expect((e as any).props.href).toEqual("http://www.example.com");
  });
  it("supports DOM element with argument value", () => {
    const tokens = parse(
      "This is a {a, react, href {{LINK}} children {link}}."
    );
    const result = evaluate(
      tokens,
      "en",
      { LINK: "http://www.example.com" },
      {}
    );
    expect(result.length).toBe(3);
    const e = result[1];
    expect(ReactIs.isElement(e)).toBe(true);
    expect((e as any).props.children).toEqual("link");
    expect((e as any).props.href).toEqual("http://www.example.com");
  });
  it("supports DOM element with argument and string", () => {
    const tokens = parse(
      "This is a {a, react, href {{SCHEME}://{HOST}} children {link}}."
    );
    const result = evaluate(
      tokens,
      "en",
      { SCHEME: "https", HOST: "www.example.com" },
      {}
    );
    expect(result.length).toBe(3);
    const e = result[1];
    expect(ReactIs.isElement(e)).toBe(true);
    expect((e as any).props.children).toEqual("link");
    expect((e as any).props.href).toEqual("https://www.example.com");
  });
  it("supports DOM element with nested react element", () => {
    const tokens = parse(
      "This is a {a, react, href {http://www.example.com} children {{b, react, children {link}}}}."
    );
    const result = evaluate(tokens, "en", {}, {});
    expect(result.length).toBe(3);
    const a = result[1];
    expect(ReactIs.isElement(a)).toBe(true);
    expect((a as any).props.href).toEqual("http://www.example.com");
    expect(ReactIs.isElement((a as any).props.children)).toBe(true);
    const b = (a as any).props.children;
    expect(ReactIs.isElement(b)).toBe(true);
    expect((b as any).props.children).toEqual("link");
  });
});

test("nested", () => {
  const src = `{gender_of_host, select,
  female {{
    num_guests, plural, offset:1
    =0 {{host} does not give a party.}
    =1 {{host} invites {guest} to her party.}
    =2 {{host} invites {guest} and one other person to her party.}
    other {{host} invites {guest} and # other people to her party.}
  }}
  male {{
    num_guests, plural, offset:1
    =0 {{host} does not give a party.}
    =1 {{host} invites {guest} to his party.}
    =2 {{host} invites {guest} and one other person to his party.}
    other {{host} invites {guest} and # other people to his party.}
  }}
  other {{
    num_guests, plural, offset:1
    =0 {{host} does not give a party.}
    =1 {{host} invites {guest} to their party.}
    =2 {{host} invites {guest} and one other person to their party.}
    other {{host} invites {guest} and # other people to their party.}}}}`;
  const tokens = parse(src);

  expect(
    evaluate(
      tokens,
      "en",
      {
        num_guests: 0,
        gender_of_host: "female",
        host: "May",
        guest: "",
      },
      {}
    )
  ).toEqual(["May", " does not give a party."]);

  expect(
    evaluate(
      tokens,
      "en",
      {
        num_guests: 1,
        gender_of_host: "female",
        host: "May",
        guest: "John",
      },
      {}
    )
  ).toEqual(["May", " invites ", "John", " to her party."]);

  expect(
    evaluate(
      tokens,
      "en",
      {
        num_guests: 2,
        gender_of_host: "female",
        host: "May",
        guest: "John",
      },
      {}
    )
  ).toEqual([
    "May",
    " invites ",
    "John",
    " and one other person to her party.",
  ]);

  expect(
    evaluate(
      tokens,
      "en",
      {
        num_guests: 3,
        gender_of_host: "female",
        host: "May",
        guest: "John",
      },
      {}
    )
  ).toEqual([
    "May",
    " invites ",
    "John",
    " and ",
    "2",
    " other people to her party.",
  ]);
});

test("any value", () => {
  const tokens = parse("{N, plural, one{{OBJ_A}} other{{OBJ_B}}}");
  const result = evaluate(
    tokens,
    "en",
    {
      N: 1,
      OBJ_A: { kind: "A" },
      OBJ_B: { kind: "B" },
    },
    {}
  );
  expect(result).toEqual([{ kind: "A" }]);
});
