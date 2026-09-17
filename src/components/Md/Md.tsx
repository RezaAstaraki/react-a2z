import * as React from 'react';
import { cn } from '../../utils';
import { HtmlAst } from './htmlAst';
import { MdBlock, MdInline, parseInline, parseMarkdown, ParseMarkdownOptions } from './parseMarkdown';

const ALIGN_CLASS: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

const RICH_TEXT_TAGS = new Set([
  'p',
  'div',
  'span',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'td',
  'th',
  'u',
  'strong',
  'em',
  'b',
  'i',
  's',
  'del',
  'mark',
  'a',
]);

const SVG_TAG_MAP: Record<string, string> = {
  clippath: 'clipPath',
  lineargradient: 'linearGradient',
  radialgradient: 'radialGradient',
  textpath: 'textPath',
  foreignobject: 'foreignObject',
};

const SVG_ATTR_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  viewbox: 'viewBox',
  gradientunits: 'gradientUnits',
  gradienttransform: 'gradientTransform',
  spreadmethod: 'spreadMethod',
  stopcolor: 'stopColor',
  stopopacity: 'stopOpacity',
  clippath: 'clipPath',
  clippathunits: 'clipPathUnits',
  cliprule: 'clipRule',
  fillrule: 'fillRule',
  fillopacity: 'fillOpacity',
  strokewidth: 'strokeWidth',
  strokelinecap: 'strokeLinecap',
  strokelinejoin: 'strokeLinejoin',
  strokedasharray: 'strokeDasharray',
  strokeopacity: 'strokeOpacity',
  strokemiterlimit: 'strokeMiterlimit',
  fontfamily: 'fontFamily',
  fontsize: 'fontSize',
  fontweight: 'fontWeight',
  textanchor: 'textAnchor',
  dominantbaseline: 'dominantBaseline',
  preserveaspectratio: 'preserveAspectRatio',
  patternunits: 'patternUnits',
  patterntransform: 'patternTransform',
  markerstart: 'markerStart',
  markermid: 'markerMid',
  markerend: 'markerEnd',
  markerwidth: 'markerWidth',
  markerheight: 'markerHeight',
  markerunits: 'markerUnits',
  refx: 'refX',
  refy: 'refY',
  vectoreffect: 'vectorEffect',
  'xlink:href': 'xlinkHref',
  'xml:space': 'xmlSpace',
  tabindex: 'tabIndex',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  allowfullscreen: 'allowFullScreen',
  crossorigin: 'crossOrigin',
  playsinline: 'playsInline',
};

function toReactProps(attrs: Record<string, string>): Record<string, string> {
  const props: Record<string, string> = {};
  const extraClass: string[] = [];
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'align') {
      const alignClass = ALIGN_CLASS[value.toLowerCase()];
      if (alignClass) extraClass.push(alignClass);
      continue;
    }
    if (name.startsWith('aria-') || name.startsWith('data-')) {
      props[name] = value;
      continue;
    }
    const mapped = SVG_ATTR_MAP[name] ?? (name.includes('-')
      ? name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
      : name);
    props[mapped] = value;
  }
  if (extraClass.length) {
    props.className = cn(props.className, extraClass);
  }
  return props;
}

function renderHtml(ast: HtmlAst | string, key: string): React.ReactNode {
  if (typeof ast === 'string') return ast ? <React.Fragment key={key}>{ast}</React.Fragment> : null;
  const children = ast.children.flatMap((child, index) => {
    if (typeof child !== 'string') return [renderHtml(child, `${key}-${index}`)];
    if (RICH_TEXT_TAGS.has(ast.tag) && child) {
      return renderInline(parseInline(child), `${key}-${index}`);
    }
    return child ? [child] : [];
  });
  return React.createElement(
    SVG_TAG_MAP[ast.tag] ?? ast.tag,
    { key, ...toReactProps(ast.attrs) },
    children.length ? children : undefined,
  );
}

function renderInline(nodes: MdInline[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.type) {
      case 'text':
        return <React.Fragment key={key}>{node.value}</React.Fragment>;
      case 'strong':
        return (
          <strong key={key} className="font-bold">
            {renderInline(node.children, key)}
          </strong>
        );
      case 'em':
        return (
          <em key={key} className="italic">
            {renderInline(node.children, key)}
          </em>
        );
      case 'del':
        return (
          <del key={key} className="line-through">
            {renderInline(node.children, key)}
          </del>
        );
      case 'code':
        return (
          <code key={key} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] text-pink-700">
            {node.value}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={node.href}
            title={node.title}
            target={/^https?:/i.test(node.href) ? '_blank' : undefined}
            rel={/^https?:/i.test(node.href) ? 'noopener noreferrer' : undefined}
            className="text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-700"
          >
            {renderInline(node.children, key)}
          </a>
        );
      case 'image':
        return (
          <img
            key={key}
            src={node.src}
            alt={node.alt}
            title={node.title}
            className="my-2 max-h-[480px] max-w-full rounded-md"
          />
        );
      case 'break':
        return <br key={key} />;
      case 'html':
        return <React.Fragment key={key}>{renderHtml(node.ast, key)}</React.Fragment>;
      default:
        return null;
    }
  });
}

function renderBlocks(blocks: MdBlock[], keyPrefix: string): React.ReactNode[] {
  return blocks.map((block, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={key} className="my-3">
            {renderInline(block.children, key)}
          </p>
        );
      case 'heading': {
        const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        const headingClass = {
          1: 'mt-6 mb-3 text-3xl font-bold tracking-tight',
          2: 'mt-6 mb-3 text-2xl font-bold',
          3: 'mt-5 mb-2 text-xl font-semibold',
          4: 'mt-4 mb-2 text-lg font-semibold',
          5: 'mt-3 mb-2 text-base font-semibold',
          6: 'mt-3 mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600',
        }[block.level];
        return (
          <Tag key={key} className={headingClass}>
            {renderInline(block.children, key)}
          </Tag>
        );
      }
      case 'code':
        return (
          <pre
            key={key}
            className="my-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
          >
            <code className={block.lang ? `language-${block.lang}` : undefined}>{block.value}</code>
          </pre>
        );
      case 'blockquote':
        return (
          <blockquote key={key} className="my-3 border-l-4 border-gray-300 pl-4 text-gray-600">
            {renderBlocks(block.children, key)}
          </blockquote>
        );
      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul';
        return (
          <Tag
            key={key}
            start={block.ordered ? block.start : undefined}
            className={cn('my-3 ps-6', block.ordered ? 'list-decimal' : 'list-disc')}
          >
            {block.items.map((item, itemIndex) => (
              <li key={`${key}-item-${itemIndex}`} className="my-1">
                {item.checked !== null && (
                  <input
                    type="checkbox"
                    checked={item.checked}
                    readOnly
                    className="me-2 align-middle"
                  />
                )}
                {renderBlocks(item.children, `${key}-item-${itemIndex}`)}
              </li>
            ))}
          </Tag>
        );
      }
      case 'table':
        return (
          <div key={key} className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  {block.header.map((cell, cellIndex) => (
                    <th
                      key={`${key}-h-${cellIndex}`}
                      className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold"
                      style={{ textAlign: block.align[cellIndex] ?? undefined }}
                    >
                      {renderInline(cell, `${key}-h-${cellIndex}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={`${key}-r-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${key}-r-${rowIndex}-${cellIndex}`}
                        className="border border-gray-200 px-3 py-2"
                        style={{ textAlign: block.align[cellIndex] ?? undefined }}
                      >
                        {renderInline(cell, `${key}-r-${rowIndex}-${cellIndex}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'hr':
        return <hr key={key} className="my-6 border-gray-200" />;
      case 'html':
        return (
          <div key={key} className="my-3 [&_svg]:inline-block [&_svg]:max-w-full [&_img]:max-w-full">
            {renderHtml(block.ast, key)}
          </div>
        );
      default:
        return null;
    }
  });
}

export type MdProps = {
  value?: string;
  children?: string;
  className?: string;
  breaks?: boolean;
} & ParseMarkdownOptions;

export function Md({ value, children, className, breaks = true }: MdProps) {
  const source = value ?? children ?? '';
  const blocks = parseMarkdown(source, { breaks });

  return (
    <div
      className={cn(
        'a2z-md max-w-none text-[15px] leading-7 text-gray-800',
        '[&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic',
        '[&_u]:underline [&_del]:line-through [&_s]:line-through [&_mark]:bg-yellow-200 [&_mark]:px-0.5',
        '[&_svg]:inline-block [&_svg]:max-w-full [&_img]:h-auto [&_img]:max-w-full',
        className,
      )}
    >
      {renderBlocks(blocks, 'md')}
    </div>
  );
}

export default Md;
