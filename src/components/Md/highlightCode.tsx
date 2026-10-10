import * as React from "react";

const KEYWORDS: Record<string, string[]> = {
  js: [
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "from",
    "default",
    "async",
    "await",
    "new",
    "typeof",
    "true",
    "false",
    "null",
    "undefined",
    "try",
    "catch",
    "throw",
  ],
  ts: [
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "from",
    "default",
    "async",
    "await",
    "new",
    "typeof",
    "true",
    "false",
    "null",
    "undefined",
    "try",
    "catch",
    "throw",
    "type",
    "interface",
    "extends",
    "implements",
    "public",
    "private",
    "readonly",
  ],
  jsx: [
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "from",
    "default",
    "async",
    "await",
    "new",
    "true",
    "false",
    "null",
  ],
  tsx: [
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "from",
    "default",
    "async",
    "await",
    "new",
    "true",
    "false",
    "null",
    "type",
    "interface",
  ],
  py: [
    "def",
    "return",
    "if",
    "elif",
    "else",
    "for",
    "while",
    "class",
    "import",
    "from",
    "as",
    "True",
    "False",
    "None",
    "with",
    "try",
    "except",
    "raise",
    "async",
    "await",
    "lambda",
    "pass",
  ],
  bash: [
    "if",
    "then",
    "else",
    "fi",
    "for",
    "in",
    "do",
    "done",
    "echo",
    "export",
    "cd",
    "npm",
    "npx",
  ],
  css: ["important", "from", "to"],
  json: ["true", "false", "null"],
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tokenize(
  code: string,
  lang?: string,
): Array<{ text: string; className?: string }> {
  const normalized = (lang || "").toLowerCase().replace(/^\./, "");
  const alias =
    normalized === "javascript"
      ? "js"
      : normalized === "typescript"
        ? "ts"
        : normalized === "python"
          ? "py"
          : normalized === "shell" || normalized === "sh"
            ? "bash"
            : normalized;
  const keywords = KEYWORDS[alias] ?? KEYWORDS.js;
  const keywordSet = new Set(keywords);
  const tokens: Array<{ text: string; className?: string }> = [];
  const comments =
    alias === "py" || alias === "bash"
      ? String.raw`#(?!\{)[^\n]*`
      : alias === "json"
        ? "(?!)"
        : alias === "css"
          ? String.raw`\/\*[\s\S]*?\*\/`
          : String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`;
  const commentPattern = new RegExp(`^(?:${comments})$`, "u");
  // Consume punctuation one character at a time. A greedy punctuation run
  // swallowed the opening quote in =" and the next closing quote then began
  // a new string, coloring everything up to the next attribute's quote.
  // The fallback also preserves Unicode and every character of the source.
  const pattern = new RegExp(
    String.raw`(${comments}|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\x60(?:\\.|[^\x60\\])*\x60|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w]*\b|\s+|[\s\S])`,
    "gu",
  );

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(code))) {
    const text = match[0] ?? "";
    if (!text) continue;
    if (commentPattern.test(text)) {
      tokens.push({ text, className: "text-gray-400 italic" });
    } else if (/^["'`]/.test(text)) {
      tokens.push({ text, className: "text-emerald-300" });
    } else if (/^\d/.test(text)) {
      tokens.push({ text, className: "text-amber-300" });
    } else if (keywordSet.has(text)) {
      tokens.push({ text, className: "text-sky-300" });
    } else {
      tokens.push({ text });
    }
  }
  return tokens;
}

/** Lightweight zero-dependency syntax coloring for fenced code blocks. */
export function highlightCode(code: string, lang?: string): React.ReactNode {
  const tokens = tokenize(code, lang);
  return tokens.map((token, index) =>
    token.className ? (
      <span key={index} className={token.className}>
        {token.text}
      </span>
    ) : (
      <React.Fragment key={index}>{token.text}</React.Fragment>
    ),
  );
}

export function escapeForTitle(value: string) {
  return escapeHtml(value);
}
