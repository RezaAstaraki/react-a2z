import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as library from "react-a2z";
import { highlightCode } from "../dist/esm/components/Md/highlightCode.js";

const require = createRequire(import.meta.url);
const render = (component, props, ...children) =>
  renderToStaticMarkup(React.createElement(component, props, ...children));
const additions = [
  "Checkbox",
  "Switch",
  "Select",
  "MultiSelect",
  "AutocompleteInput",
  "Textarea",
  "Tabs",
  "Accordion",
  "Badge",
  "Card",
  "Progress",
  "Skeleton",
];

const highlightedTokens = (code, language) =>
  highlightCode(code, language).map((node) => ({
    text: node.props.children,
    className: node.props.className,
  }));

test("TSX attribute strings stop at their closing quotes across adjacent components", () => {
  const code = `<Checkbox label="Select all projects" indeterminate />
<Checkbox label="Managed by your team" disabled defaultChecked />
<Checkbox
  label="Accept the terms"
  required
  error="Please accept before continuing."
/>`;
  const tokens = highlightedTokens(code, "tsx");
  assert.equal(tokens.map((token) => token.text).join(""), code);
  assert.deepEqual(
    tokens
      .filter((token) => token.className === "text-emerald-300")
      .map((token) => token.text),
    [
      '"Select all projects"',
      '"Managed by your team"',
      '"Accept the terms"',
      '"Please accept before continuing."',
    ],
  );
  for (const attribute of [
    "indeterminate",
    "disabled",
    "defaultChecked",
    "required",
  ])
    assert.equal(
      tokens.find((token) => token.text === attribute)?.className,
      undefined,
    );
});

test("punctuation cannot swallow strings, template literals or JSX comments", () => {
  const code =
    'const a="one";const b=\'two\';const c=`three`;{/* comment "quoted" */}\nreturn <span>{a}</span>;';
  const tokens = highlightedTokens(code, "tsx");
  assert.equal(tokens.map((token) => token.text).join(""), code);
  assert.deepEqual(
    tokens
      .filter((token) => token.className === "text-emerald-300")
      .map((token) => token.text),
    ['"one"', "'two'", "`three`"],
  );
  assert.equal(
    tokens.find((token) => token.text === '/* comment "quoted" */')?.className,
    "text-gray-400 italic",
  );
  assert.equal(
    tokens.find((token) => token.text === "return")?.className,
    "text-sky-300",
  );
});

test("highlighting preserves escaped quotes and Unicode source text", () => {
  const code = 'const label="Say \\"hello\\" — سلام 🌱";\nconst café = "☕";';
  const tokens = highlightedTokens(code, "typescript");
  assert.equal(tokens.map((token) => token.text).join(""), code);
  assert.deepEqual(
    tokens
      .filter((token) => token.className === "text-emerald-300")
      .map((token) => token.text),
    ['"Say \\"hello\\" — سلام 🌱"', '"☕"'],
  );
});

test("hash colors and selectors are not mistaken for comments outside Python and shell", () => {
  for (const language of ["css", "tsx", "json"]) {
    const code = '#card { color: #fff; content: "label"; }';
    const tokens = highlightedTokens(code, language);
    assert.equal(tokens.map((token) => token.text).join(""), code);
    assert.equal(
      tokens.some((token) => token.className === "text-gray-400 italic"),
      false,
    );
    assert.ok(
      tokens.some(
        (token) =>
          token.text === '"label"' && token.className === "text-emerald-300",
      ),
    );
  }
  for (const language of ["python", "py", "bash", "shell"])
    assert.equal(
      highlightedTokens('# comment "quoted"', language)[0].className,
      "text-gray-400 italic",
    );
});

test("root and component subpaths expose the new components in ESM and CommonJS", async () => {
  const common = require("react-a2z");
  for (const name of additions) {
    assert.ok(library[name], `ESM root: ${name}`);
    assert.ok(common[name], `CJS root: ${name}`);
    assert.ok(
      (await import(`react-a2z/${name}`))[name],
      `ESM subpath: ${name}`,
    );
    assert.ok(require(`react-a2z/${name}`)[name], `CJS subpath: ${name}`);
  }
  for (const name of ["CardHeader", "CardBody", "CardFooter"])
    assert.ok(library[name]);
});

test("every declared JavaScript export exists in the package build", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  for (const [name, entry] of Object.entries(packageJson.exports)) {
    if (typeof entry !== "object") continue;
    for (const target of Object.values(entry))
      assert.doesNotThrow(
        () => readFileSync(new URL(`../${target}`, import.meta.url)),
        `${name}: ${target}`,
      );
  }
});

test("interactive subpaths preserve the Next.js client boundary", () => {
  for (const name of [
    "Checkbox",
    "Switch",
    "Select",
    "MultiSelect",
    "AutocompleteInput",
    "Textarea",
    "Tabs",
    "Accordion",
  ]) {
    const code = readFileSync(
      new URL(`../dist/esm/components/${name}/${name}.js`, import.meta.url),
      "utf8",
    );
    assert.match(code, /^['"]use client['"]/);
  }
  for (const name of ["Badge", "Card", "Progress", "Skeleton"]) {
    const code = readFileSync(
      new URL(`../dist/esm/components/${name}/${name}.js`, import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(code, /^['"]use client['"]/);
  }
});

test("Button merges root and native style overrides and blocks loading activation", () => {
  const html = render(
    library.Button,
    {
      loading: true,
      styles: { root: { padding: 8, color: "red" } },
      style: { color: "blue" },
    },
    "Save",
  );
  assert.match(html, /type="button"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /padding:8px;color:blue/);
});

test("Input labels work without an id and helper text does not enter the accessible name", () => {
  const html = render(library.Input, {
    label: "Email",
    helperText: "Your work address",
  });
  assert.match(html, /<label[^>]*>.*Email.*<input/s);
  assert.match(html, /aria-description="Your work address"/);
  assert.match(html, /<\/label>.*Your work address/s);
  assert.doesNotMatch(html, /<label[^>]*>.*<div.*<\/label>/s);
});

test("Input preserves caller descriptions alongside its own validation message", () => {
  const html = render(library.Input, {
    id: "email",
    label: "Email",
    error: "Required",
    "aria-describedby": "hint",
    startIcon: "@",
  });
  assert.match(html, /aria-describedby="hint email-message"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /ps-10/);
});

test("new form controls generate label associations and preserve native form attributes", () => {
  for (const name of ["Checkbox", "Switch", "Select", "Textarea"]) {
    const html = render(library[name], {
      label: name,
      description: "Help",
      name: name.toLowerCase(),
      required: true,
      "aria-describedby": "external",
    });
    const controlId = html.match(
      /<(?:input|select|textarea)[^>]* id="([^"]+)"/,
    )?.[1];
    assert.ok(controlId, `${name}: generated id`);
    assert.ok(
      html.includes(`for="${controlId}"`),
      `${name}: label association`,
    );
    assert.ok(
      html.includes(`aria-describedby="external ${controlId}-message"`),
      `${name}: merged descriptions`,
    );
    assert.ok(html.includes(`name="${name.toLowerCase()}"`));
    assert.match(html, /required=""/);
  }
});

test("Select preserves disabled options, native groups and multiple defaults", () => {
  const html = render(library.Select, {
    label: "Languages",
    multiple: true,
    defaultValue: ["en"],
    options: [
      { value: "en", label: "English" },
      { value: "fa", label: "Persian", disabled: true },
    ],
  });
  assert.match(html, /multiple=""/);
  assert.match(html, /<option value="en" selected="">English/);
  assert.match(html, /<option value="fa" disabled="">Persian/);
  const grouped = render(
    library.Select,
    { label: "Region" },
    React.createElement(
      "optgroup",
      { label: "Europe" },
      React.createElement("option", { value: "eu" }, "Europe"),
    ),
  );
  assert.match(grouped, /<optgroup label="Europe">/);
});

test("Tabs link their active tab and panel and skip an invalid initial selection", () => {
  const html = render(library.Tabs, {
    id: "tabs",
    label: "Account",
    defaultValue: "disabled",
    items: [
      {
        value: "disabled",
        label: "Disabled",
        content: "Unavailable",
        disabled: true,
      },
      { value: "profile", label: "Profile", content: "Profile content" },
    ],
  });
  assert.match(
    html,
    /id="tabs-tab-profile"[^>]*aria-controls="tabs-panel-profile"[^>]*aria-selected="true"[^>]*tabindex="0"/,
  );
  assert.match(
    html,
    /id="tabs-panel-profile"[^>]*aria-labelledby="tabs-tab-profile"[^>]*tabindex="0"/,
  );
  assert.match(html, /id="tabs-panel-disabled"[^>]*hidden=""/);
  const still = render(library.Tabs, {
    label: "Static tabs",
    animated: false,
    items: [{ value: "one", label: "One", content: "First" }],
  });
  assert.doesNotMatch(still, /data-a2z-tabs-indicator|data-animated="true"/);
});

test("Accordion single mode opens one section even with multiple initial values", () => {
  const html = render(library.Accordion, {
    defaultValue: ["one", "two"],
    items: [
      { value: "one", title: "One", content: "First" },
      { value: "two", title: "Two", content: "Second" },
    ],
  });
  assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, 1);
  assert.equal(
    (html.match(/aria-hidden="true" data-a2z-accordion-panel/g) ?? []).length,
    1,
  );
  assert.equal((html.match(/data-state="closed"/g) ?? []).length, 1);
  assert.doesNotMatch(
    render(library.Accordion, {
      animated: false,
      items: [{ value: "one", title: "One", content: "First" }],
    }),
    /data-animated="true"/,
  );
});

test("Progress clamps values, handles invalid bounds, and omits unknown aria-valuenow", () => {
  assert.match(
    render(library.Progress, { label: "Upload", value: 150 }),
    /aria-valuenow="100"/,
  );
  assert.match(
    render(library.Progress, { label: "Upload", value: -5 }),
    /aria-valuenow="0"/,
  );
  const invalidMax = render(library.Progress, {
    label: "Upload",
    value: 20,
    max: 0,
  });
  assert.match(invalidMax, /aria-valuemax="100"/);
  for (const value of [undefined, Number.NaN, Infinity]) {
    const html = render(library.Progress, { label: "Upload", value });
    assert.doesNotMatch(html, /aria-valuenow=/);
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
});

test("Skeleton stays decorative and respects reduced motion", () => {
  const html = render(library.Skeleton, { variant: "circle" });
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /motion-reduce:animate-none/);
  assert.doesNotMatch(
    render(library.Skeleton, { animated: false }),
    /animate-pulse/,
  );
});
