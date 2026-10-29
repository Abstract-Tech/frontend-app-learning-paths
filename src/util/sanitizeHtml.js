const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HR', 'I', 'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP',
  'TABLE', 'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'UL',
]);

const SAFE_URL_ATTRIBUTES = new Set(['href', 'src', 'poster']);
const SAFE_URL_PATTERN = /^(?:https?:|mailto:|tel:|\/|#)/i;

const unwrapElement = (element) => {
  const parent = element.parentNode;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
};

/**
 * Sanitize rich text received from LMS APIs before rendering it as HTML.
 * The allowlist intentionally excludes scripts, forms, styles, event handlers,
 * and embedded content. URLs are restricted to safe web/document protocols.
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }

  const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;

  if (!root) {
    return '';
  }

  Array.from(root.querySelectorAll('*')).forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      unwrapElement(element);
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith('on') || name === 'style' || name === 'srcdoc') {
        element.removeAttribute(attribute.name);
      } else if (SAFE_URL_ATTRIBUTES.has(name) && !SAFE_URL_PATTERN.test(value)) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName === 'A' && element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return root.innerHTML;
};

export default sanitizeHtml;
