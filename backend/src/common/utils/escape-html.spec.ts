import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('neutralises markup and attribute breakers', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(escapeHtml(`" onerror='x' & more`)).toBe(
      '&quot; onerror=&#39;x&#39; &amp; more',
    );
  });

  it('leaves plain text, accents and emoji alone', () => {
    expect(escapeHtml('Séance jambes 💪')).toBe('Séance jambes 💪');
  });
});
