'use client';

import {useLocale} from 'next-intl';
import {DynamicMedia} from '@/components/ui/dynamic-media';
import type {BlogBlock, Locale} from '@/lib/types';
import {resolveText} from '@/lib/utils';

interface BlogContentRendererProps {
  blocks: BlogBlock[];
}

const COMMON_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  apos: "'",
  '#39': "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"'
};

const JS_KEYWORDS = /\b(?:abstract|arguments|as|async|await|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|set|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|with|yield)\b/g;
const PYTHON_KEYWORDS = /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/g;
const BASH_KEYWORDS = /\b(?:alias|break|case|cd|continue|do|done|echo|elif|else|esac|eval|exit|export|fi|for|function|if|in|local|printf|read|readonly|return|set|shift|source|then|time|trap|unset|until|while)\b/g;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, token: string) => {
    const named = COMMON_ENTITY_MAP[token];
    if (named) return named;

    if (token.startsWith('#x') || token.startsWith('#X')) {
      const parsed = Number.parseInt(token.slice(2), 16);
      return Number.isNaN(parsed) ? entity : String.fromCodePoint(parsed);
    }

    if (token.startsWith('#')) {
      const parsed = Number.parseInt(token.slice(1), 10);
      return Number.isNaN(parsed) ? entity : String.fromCodePoint(parsed);
    }

    return entity;
  });
}

function toPlaceholderKey(index: number) {
  return `\uE000${'\uE100'.repeat(index + 1)}\uE001`;
}

function normalizeLanguage(language: string | undefined) {
  const normalized = language?.trim().toLowerCase() ?? '';
  if (!normalized) return 'text';
  if (['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript'].includes(normalized)) return 'javascript';
  if (['py', 'python'].includes(normalized)) return 'python';
  if (['sh', 'bash', 'shell', 'zsh'].includes(normalized)) return 'bash';
  if (['html', 'xml', 'svg'].includes(normalized)) return 'html';
  if (['css', 'scss'].includes(normalized)) return 'css';
  if (['json'].includes(normalized)) return 'json';
  return normalized;
}

function highlightSegment(source: string, patterns: Array<{regex: RegExp; className: string}>) {
  const placeholders: string[] = [];
  let working = source;

  patterns.forEach(({regex, className}) => {
    working = working.replace(regex, (match) => {
      const index = placeholders.push(`<span class="${className}">${escapeHtml(match)}</span>`) - 1;
      return toPlaceholderKey(index);
    });
  });

  return escapeHtml(working).replace(/\uE000(?:\uE100)+\uE001/g, (token) => {
    const index = token.length - 3;
    return placeholders[index] ?? token;
  });
}

function highlightHtmlTag(tag: string) {
  let escaped = escapeHtml(tag);

  escaped = escaped.replace(/^(&lt;\/?)([A-Za-z][A-Za-z0-9:-]*)/, '$1<span class="blog-token-keyword">$2</span>');
  escaped = escaped.replace(/([A-Za-z_:][-A-Za-z0-9_:.]*)(=)(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="blog-token-property">$1</span><span class="blog-token-punctuation">$2</span><span class="blog-token-string">$3</span>');
  escaped = escaped.replace(/(&lt;\/?|\/?&gt;)/g, '<span class="blog-token-punctuation">$1</span>');

  return escaped;
}

function highlightCodeToHtml(code: string, language: string | undefined) {
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedCode = code.replace(/\r\n?/g, '\n');

  if (normalizedLanguage === 'html') {
    let result = '';
    let lastIndex = 0;
    const tagPattern = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*?>/g;

    normalizedCode.replace(tagPattern, (match, offset: number) => {
      result += escapeHtml(normalizedCode.slice(lastIndex, offset));
      result += match.startsWith('<!--')
        ? `<span class="blog-token-comment">${escapeHtml(match)}</span>`
        : highlightHtmlTag(match);
      lastIndex = offset + match.length;
      return match;
    });

    result += escapeHtml(normalizedCode.slice(lastIndex));
    return result;
  }

  if (normalizedLanguage === 'css') {
    return highlightSegment(normalizedCode, [
      {regex: /\/\*[\s\S]*?\*\//g, className: 'blog-token-comment'},
      {regex: /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g, className: 'blog-token-string'},
      {regex: /@[a-z-]+/gi, className: 'blog-token-keyword'},
      {regex: /#[0-9a-f]{3,8}\b/gi, className: 'blog-token-number'},
      {regex: /\b[a-z-]+(?=\s*:)/gi, className: 'blog-token-property'},
      {regex: /\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|ms|s|fr)?\b/gi, className: 'blog-token-number'}
    ]);
  }

  if (normalizedLanguage === 'json') {
    return highlightSegment(normalizedCode, [
      {regex: /"(?:\\.|[^"])*"(?=\s*:)/g, className: 'blog-token-property'},
      {regex: /"(?:\\.|[^"])*"/g, className: 'blog-token-string'},
      {regex: /\b(?:true|false|null)\b/g, className: 'blog-token-keyword'},
      {regex: /-?\b\d+(?:\.\d+)?\b/g, className: 'blog-token-number'}
    ]);
  }

  if (normalizedLanguage === 'python') {
    return highlightSegment(normalizedCode, [
      {regex: /#.*$/gm, className: 'blog-token-comment'},
      {regex: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g, className: 'blog-token-string'},
      {regex: PYTHON_KEYWORDS, className: 'blog-token-keyword'},
      {regex: /\b\d+(?:\.\d+)?\b/g, className: 'blog-token-number'}
    ]);
  }

  if (normalizedLanguage === 'bash') {
    return highlightSegment(normalizedCode, [
      {regex: /#.*$/gm, className: 'blog-token-comment'},
      {regex: /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g, className: 'blog-token-string'},
      {regex: /\$\w+|\$\{[^}]+\}/g, className: 'blog-token-property'},
      {regex: BASH_KEYWORDS, className: 'blog-token-keyword'}
    ]);
  }

  return highlightSegment(normalizedCode, [
    {regex: /\/\/.*$|\/\*[\s\S]*?\*\//gm, className: 'blog-token-comment'},
    {regex: /`(?:\\.|[^`])*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g, className: 'blog-token-string'},
    {regex: JS_KEYWORDS, className: 'blog-token-keyword'},
    {regex: /\b[A-Z][A-Za-z0-9_]*(?=\s*[<(])/g, className: 'blog-token-type'},
    {regex: /\b\d+(?:\.\d+)?\b/g, className: 'blog-token-number'}
  ]);
}

function renderCodeBlock(content: string, language: string | undefined) {
  const decoded = decodeHtmlEntities(content);
  return {
    code: decoded,
    highlighted: highlightCodeToHtml(decoded, language),
    languageLabel: (language?.trim() || 'code').toUpperCase()
  };
}

function readHtmlAttribute(source: string, attribute: string) {
  const pattern = new RegExp(`\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = source.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? '';
}

function extractLanguageFromAttributes(...attributeSources: string[]) {
  for (const source of attributeSources) {
    if (!source.trim()) continue;

    const directLanguage =
      readHtmlAttribute(source, 'data-language') ||
      readHtmlAttribute(source, 'data-lang') ||
      readHtmlAttribute(source, 'lang');

    if (directLanguage) return directLanguage;

    const className = readHtmlAttribute(source, 'class');
    if (!className) continue;

    const languageClass = className
      .split(/\s+/)
      .map((token) => token.trim())
      .find((token) => token.toLowerCase().startsWith('language-'));

    if (languageClass) return languageClass.slice('language-'.length);
  }

  return undefined;
}

function enhanceRichTextHtml(html: string) {
  return html.replace(/<pre\b([^>]*)>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_match, preAttributes: string, codeAttributes: string, code: string) => {
    const language = extractLanguageFromAttributes(preAttributes, codeAttributes);
    const rendered = renderCodeBlock(code, language);
    return `
      <div class="blog-code-shell">
        <div class="blog-code-lang">${escapeHtml(rendered.languageLabel)}</div>
        <pre class="blog-code-pre"><code class="blog-code">${rendered.highlighted}</code></pre>
      </div>
    `.trim();
  });
}

export function BlogContentRenderer({blocks}: BlogContentRendererProps) {
  const locale = useLocale() as Locale;

  return (
    <div className="space-y-6 min-w-0">
      {blocks.map((block, index) => {
        const key = block.id || `block-${index}`;

        if (block.type === 'richText') {
          const html = enhanceRichTextHtml(resolveText(block.content, locale));

          return (
            <div
              key={key}
              className="blog-rich-content min-w-0"
              dangerouslySetInnerHTML={{__html: html}}
            />
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="rounded-[24px] border border-cyan-300/20 bg-cyan-400/5 px-5 py-4 text-lg font-medium leading-8 text-white min-w-0">
              <div className="blog-quote-content" dangerouslySetInnerHTML={{__html: resolveText(block.content, locale)}} />
            </blockquote>
          );
        }

        if (block.type === 'code') {
          const rendered = renderCodeBlock(resolveText(block.content, locale), block.language);

          return (
            <div key={key} className="blog-code-shell">
              <div className="blog-code-lang">{rendered.languageLabel}</div>
              <pre className="blog-code-pre">
                <code className="blog-code" dangerouslySetInnerHTML={{__html: rendered.highlighted}} />
              </pre>
            </div>
          );
        }

        if (block.type === 'image') {
          return (
            <div key={key} className="space-y-3 min-w-0">
              <DynamicMedia
                src={block.src}
                alt={resolveText(block.alt, locale)}
                className="blog-media-frame rounded-[32px] border border-white/10 bg-slate-900"
                mediaClassName="block h-auto max-h-[70vh] w-full object-contain"
                placeholderTitle="Image will appear here"
                placeholderHint="This media slot is currently empty."
              />
              {resolveText(block.alt, locale) ? <p className="text-center text-sm text-slate-400">{resolveText(block.alt, locale)}</p> : null}
            </div>
          );
        }

        if (block.type === 'video') {
          return (
            <div key={key} className="space-y-3 min-w-0">
              <DynamicMedia
                src={block.src}
                alt={resolveText(block.caption, locale)}
                className="blog-media-frame rounded-[32px] border border-white/10 bg-slate-900"
                mediaClassName="block h-auto max-h-[70vh] w-full object-contain"
                placeholderTitle="Video will appear here"
                placeholderHint="This video slot is currently empty."
              />
              {resolveText(block.caption, locale) ? <p className="text-center text-sm text-slate-400">{resolveText(block.caption, locale)}</p> : null}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
