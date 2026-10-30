import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SetPairDto } from './set-pair.dto';

const errorsFor = (set: object) =>
  validateSync(plainToInstance(SetPairDto, set)).map((e) => e.property);

describe('SetPairDto', () => {
  it('accepts decimal weights up to two decimals', () => {
    expect(errorsFor({ reps: 7, weight: 62.5 })).toEqual([]);
    expect(errorsFor({ reps: 10, weight: 1.25 })).toEqual([]);
    expect(errorsFor({ reps: 12, weight: 0 })).toEqual([]);
    expect(errorsFor({ reps: 1, weight: 1000 })).toEqual([]);
  });

  it('refuses more decimals, negative or absurd weights', () => {
    expect(errorsFor({ reps: 7, weight: 62.555 })).toEqual(['weight']);
    expect(errorsFor({ reps: 7, weight: -2.5 })).toEqual(['weight']);
    expect(errorsFor({ reps: 7, weight: 1000.5 })).toEqual(['weight']);
    expect(errorsFor({ reps: 7, weight: '62.5' })).toEqual(['weight']);
  });

  it('keeps reps whole', () => {
    expect(errorsFor({ reps: 7.5, weight: 60 })).toEqual(['reps']);
    expect(errorsFor({ reps: 0, weight: 60 })).toEqual(['reps']);
  });
});
