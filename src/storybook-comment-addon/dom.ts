import type { SelectedTarget } from './constants';

const truncate = (value: string, maxLength = 90) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
};

const cssEscape = (value: string) => {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
  return value.replace(/(["\\#.:,[\]>+~*^$|=\s])/g, '\\$1');
};

const selectorSegmentFor = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase();
  const ariaLabel = element.getAttribute('aria-label');
  const testId = element.getAttribute('data-testid');

  if (testId) return `${tagName}[data-testid="${cssEscape(testId)}"]`;
  if (ariaLabel) return `${tagName}[aria-label="${cssEscape(ariaLabel)}"]`;
  if (element.id) return `${tagName}#${cssEscape(element.id)}`;

  const firstClass = typeof element.className === 'string' ? element.className.trim().split(/\s+/).filter(Boolean)[0] : '';
  const sameTagSiblings = element.parentElement
    ? Array.from(element.parentElement.children).filter((child) => child.tagName === element.tagName)
    : [];
  const nthOfType = sameTagSiblings.length > 1 ? `:nth-of-type(${sameTagSiblings.indexOf(element) + 1})` : '';

  return `${tagName}${firstClass ? `.${cssEscape(firstClass)}` : ''}${nthOfType}`;
};

const selectorPathWithinTarget = (element: HTMLElement, targetRoot: HTMLElement) => {
  const rootSelector = '.storybook-comment-canvas';
  if (element === targetRoot) return rootSelector;

  const segments: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current !== targetRoot) {
    segments.unshift(selectorSegmentFor(current));
    current = current.parentElement;
  }

  return `${rootSelector} > ${segments.join(' > ')}`;
};

export const describeHtmlElement = (element: HTMLElement, targetRoot: HTMLElement): SelectedTarget => {
  const tagName = element.tagName.toLowerCase();
  const ariaLabel = element.getAttribute('aria-label');
  const testId = element.getAttribute('data-testid');
  const placeholder = element.getAttribute('placeholder');
  const heading = element.querySelector('h1, h2, h3')?.textContent || '';
  const elementValue = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
  const readableText = truncate(ariaLabel || testId || placeholder || elementValue || element.textContent || tagName);
  const selector = selectorPathWithinTarget(element, targetRoot);

  return {
    id: selector,
    label: truncate(ariaLabel || heading || readableText || 'Story canvas', 40),
    elementName: tagName,
    selector,
    elementText: readableText,
  };
};

export const commentSummary = (comments: StoryCommentLike[]) => {
  if (comments.length === 0) return 'まだコメントはありません。';

  return comments
    .map((comment, index) => [
      `#${index + 1} ${comment.label}`,
      `- 対象HTML: ${comment.selector}`,
      `- 要素: <${comment.elementName}> ${comment.elementText}`,
      `- コメント: ${comment.text}`,
    ].join('\n'))
    .join('\n\n');
};

type StoryCommentLike = SelectedTarget & { text: string };
