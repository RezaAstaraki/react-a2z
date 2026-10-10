import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as library from "react-a2z";

const require = createRequire(import.meta.url);
const render = (component, props, ...children) =>
  renderToStaticMarkup(React.createElement(component, props, ...children));
const additions = [
  "Checkbox",
  "Switch",
  "Select",
  "Textarea",
  "Tabs",
  "Accordion",
  "Badge",
  "Card",
  "Progress",
  "Skeleton",
];

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
  assert.equal((html.match(/hidden=""/g) ?? []).length, 1);
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
