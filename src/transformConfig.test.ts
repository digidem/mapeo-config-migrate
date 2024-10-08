import { transformField, transformPreset } from './transformFunctions';

describe('transformField', () => {
  it('should transform an old field to the new format', () => {
    const oldField = {
      "key": "building-type",
      "type": "select_one",
      "label": "Building type",
      "placeholder": "School/hospital/etc",
      "options": ["School", "Hospital", "Homestead", "Church", "Shop", "Other"]
    };

    const expectedNewField = {
      "tagKey": "building-type",
      "type": "selectOne",
      "label": "Building type",
      "helperText": "School/hospital/etc",
      "options": [
        { "label": "School", "value": "School" },
        { "label": "Hospital", "value": "Hospital" },
        { "label": "Homestead", "value": "Homestead" },
        { "label": "Church", "value": "Church" },
        { "label": "Shop", "value": "Shop" },
        { "label": "Other", "value": "Other" }
      ],
      "universal": false
    };

    const newField = transformField({ ...oldField });

    expect(newField).toEqual(expectedNewField);
  });

  it('should keep existing options objects unchanged', () => {
    const oldField = {
      "key": "tree-type",
      "type": "select_one",
      "label": "Tree type",
      "options": [
        { "label": "Oak", "value": "oak" },
        { "label": "Pine", "value": "pine" }
      ]
    };

    const expectedNewField = {
      "tagKey": "tree-type",
      "type": "selectOne",
      "label": "Tree type",
      "options": [
        { "label": "Oak", "value": "oak" },
        { "label": "Pine", "value": "pine" }
      ],
      "universal": false
    };

    const newField = transformField({ ...oldField });

    expect(newField).toEqual(expectedNewField);
  });
});

describe('transformPreset', () => {
  it('should reorder keys in preset', () => {
    const oldPreset = {
      "icon": "animal",
      "color": "#9E2C54",
      "fields": ["animal-type"],
      "geometry": ["point", "area"],
      "tags": { "type": "animal" },
      "terms": [],
      "name": "Animal"
    };

    const expectedNewPreset = {
      "name": "Animal",
      "icon": "animal",
      "color": "#9E2C54",
      "fields": ["animal-type"],
      "geometry": ["point", "area"],
      "tags": { "type": "animal" },
      "terms": []
    };

    const newPreset = transformPreset({ ...oldPreset });

    expect(newPreset).toEqual(expectedNewPreset);
  });
});
