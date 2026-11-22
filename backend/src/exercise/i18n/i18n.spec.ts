import { pickLocale } from './locale';
import { ExerciseLookup, localizeResponse } from './localize-response';

describe('pickLocale', () => {
  it.each([
    [undefined, 'en'],
    ['', 'en'],
    ['fr', 'fr'],
    ['fr-FR,fr;q=0.9,en;q=0.8', 'fr'],
    ['pt-BR', 'pt'],
    ['zh-Hans-CN', 'zh'],
    ['nl-NL,de;q=0.5', 'de'],
    ['en;q=0.4,ja;q=0.9', 'ja'],
    ['fr;q=0', 'en'],
    ['xx', 'en'],
    [['es', 'fr'], 'es'],
  ])('%j gives %s', (header, locale) => {
    expect(pickLocale(header)).toBe(locale);
  });
});

class Entity {
  constructor(
    public id: string,
    public name: string,
  ) {}
}

describe('localizeResponse', () => {
  const lookup: ExerciseLookup = {
    englishName: (id) => ({ 'ex-1': 'Plank', 'ex-2': 'Pull Up' })[id],
    name: (english) => ({ Plank: 'Gainage', 'Pull Up': 'Tractions' })[english],
    details: (english) =>
      english === 'Plank'
        ? { description: 'Tenir la position.', instructions: ['Tenir.'] }
        : undefined,
  };

  it('translates exercises and summaries anywhere in the response', () => {
    const body = {
      workout: {
        exercises: [{ exercise: { id: 'ex-1', name: 'Plank' }, sets: [] }],
      },
      records: [{ exerciseId: 'ex-2', name: 'Pull Up', value: 10 }],
      stats: { exerciseId: 'ex-2', exerciseName: 'Pull Up' },
      at: new Date(0),
    };

    expect(localizeResponse(body, lookup)).toEqual({
      workout: {
        exercises: [
          {
            exercise: { id: 'ex-1', name: 'Gainage', englishName: 'Plank' },
            sets: [],
          },
        ],
      },
      records: [{ exerciseId: 'ex-2', name: 'Tractions', value: 10 }],
      stats: { exerciseId: 'ex-2', exerciseName: 'Tractions' },
      at: new Date(0),
    });
  });

  it('translates the description and instructions of a detailed exercise', () => {
    expect(
      localizeResponse(
        { id: 'ex-1', name: 'Plank', description: 'Hold.', instructions: [] },
        lookup,
      ),
    ).toMatchObject({
      description: 'Tenir la position.',
      instructions: ['Tenir.'],
    });
  });

  it('leaves alone what is not a catalogue exercise', () => {
    const body = [
      { id: 'group-1', name: 'Plank' },
      { id: 'ex-1', name: 'Mon gainage' },
      { uniqueName: 'Plank' },
    ];

    expect(localizeResponse(body, lookup)).toBe(body);
  });

  it('copies instead of changing the cached values, keeping their class', () => {
    const cached = new Entity('ex-1', 'Plank');
    const list = [cached];
    const out = localizeResponse(list, lookup) as Entity[];

    expect(cached.name).toBe('Plank');
    expect(out).not.toBe(list);
    expect(out[0]).toBeInstanceOf(Entity);
    expect(out[0].name).toBe('Gainage');
  });
});
