import * as fs from 'fs';
import * as path from 'path';
import { VARIANT_RENAMES_2026_10 } from './variant-renames';

const catalogue: Array<{ name: string; equipment_type: string }> = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/base-exercises.json'), 'utf-8'),
);
const equipmentByName = new Map(
  catalogue.map((e) => [e.name, e.equipment_type]),
);

describe('VARIANT_RENAMES_2026_10', () => {
  it('renames to catalogue entries of the same equipment', () => {
    for (const r of VARIANT_RENAMES_2026_10)
      expect([r.to, equipmentByName.get(r.to)]).toEqual([r.to, r.equipment]);
  });

  it('never renames a catalogue entry away from its own name', () => {
    // An old name may stay for one equipment (Bicep Curl (EZ Bar) is the
    // barbell variant), never for the equipment it is renamed from.
    for (const r of VARIANT_RENAMES_2026_10) {
      expect(r.to).not.toBe(r.from);
      expect(equipmentByName.get(r.from)).not.toBe(r.equipment);
    }
  });

  it('maps each old name and equipment to a single new name', () => {
    const keys = VARIANT_RENAMES_2026_10.map((r) => `${r.from}|${r.equipment}`);
    const targets = VARIANT_RENAMES_2026_10.map((r) => r.to);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(targets).size).toBe(targets.length);
  });
});
