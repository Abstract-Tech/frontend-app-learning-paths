import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('removes executable markup and unsafe URLs while preserving content', () => {
    const unsafeUrl = ['java', 'script:alert(1)'].join('');
    const sanitized = sanitizeHtml(
      '<p>Hello <strong>world</strong></p><script>alert(1)</script>'
      + `<img src="${unsafeUrl}" onerror="alert(2)">`
      + '<a href="https://example.com">Read more</a>',
    );

    expect(sanitized).toContain('<p>Hello <strong>world</strong></p>');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain(['java', 'script', ':'].join(''));
    expect(sanitized).toContain('href="https://example.com"');
  });
});
