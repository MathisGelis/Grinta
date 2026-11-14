import { extractMentions } from './mentions';

describe('extractMentions', () => {
  it('finds the handles of the title and the description, in order, once', () => {
    expect(
      extractMentions('Leg day with @Paul and @julie_92', 'Merci @paul !'),
    ).toEqual(['paul', 'julie_92']);
  });

  it('accepts a handle at the start, after punctuation or a line break', () => {
    expect(extractMentions('@ana,(@bob)\n@carl.dupont')).toEqual([
      'ana',
      'bob',
      'carl.dupont',
    ]);
  });

  it('drops a trailing dot, which is punctuation', () => {
    expect(extractMentions('Séance avec @paul.')).toEqual(['paul']);
  });

  it('ignores e-mail addresses, double @ and handles too short', () => {
    expect(
      extractMentions('écris à paul@gmail.com, @@bob, @jo, @ seul'),
    ).toEqual([]);
  });

  it('accepts missing texts', () => {
    expect(extractMentions(undefined, null, '')).toEqual([]);
  });

  it('stops after 30 handles', () => {
    const text = Array.from({ length: 40 }, (_, i) => `@user${i}`).join(' ');

    expect(extractMentions(text)).toHaveLength(30);
  });
});
