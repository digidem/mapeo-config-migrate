import { transformField, transformPreset } from './transformFunctions';
import { transformConfig, transformMetadata, transformPresetsJson, transformTranslations } from './transformConfig';
jest.mock('fs');
jest.mock('child_process');

import * as fs from 'fs';
import * as child_process from 'child_process';

beforeEach(() => {
  jest.resetAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('transformField', () => {
  it('should transform an old field to the new format', () => {
    const oldField = {
      "key": "building-type",
      "type": "select_one",
      "label": "Building type",
      "placeholder": "School/hospital/etc",
      "options": ["School", "Hospital", "Homestead", "Church", "Shop", "Other"],
      "fieldRefs": [],
      "removeTags": {},
      "addTags": {}
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
      "universal": false,
      "fieldRefs": [],
      "removeTags": {},
      "addTags": {}
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
      "universal": false,
      "fieldRefs": [],
      "removeTags": {},
      "addTags": {}
    };

    const newField = transformField({ ...oldField });

    expect(newField).toEqual(expectedNewField);
  });
});

describe('transformMetadata', () => {
  it('should transform metadata.json correctly', () => {
    const metadataPath = 'path/to/metadata.json';
    const oldMetadata = {
      "dataset_id": "mapeo-jungle",
      "name": "mapeo-default-settings",
      "version": "3.6.1"
    };
    const expectedMetadata = {
      "name": "mapeo-jungle",
      "version": "3.6.1",
      "fileVersion": "1.0",
      "buildDate": expect.any(String)
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(oldMetadata));
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    transformMetadata(metadataPath);

    expect(writeSpy).toHaveBeenCalledWith(
      metadataPath,
      JSON.stringify(expectedMetadata, null, 4),
      'utf8'
    );
  });
});

describe('transformPresetsJson', () => {
  it('should transform presets.json correctly', () => {
    const presetsPath = 'path/to/presets.json';
    const oldPresets = {
      "categories": {},
      "fields": {
        "animal-type": {},
        "building-type": {}
      },
      "presets": {
        "animal": {},
        "building": {}
      },
      "defaults": {}
    };
    const expectedPresets = {
      "categories": {},
      "fields": {
        "animal-type": {},
        "building-type": {}
      },
      "presets": {
        "animal": {},
        "building": {}
      },
      "defaults": {}
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(oldPresets));
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    transformPresetsJson(presetsPath);

    expect(writeSpy).toHaveBeenCalledWith(
      presetsPath,
      JSON.stringify(expectedPresets, null, 4),
      'utf8'
    );
  });
});

describe('transformTranslations', () => {
  it('should transform translations.json correctly', () => {
    const translationsPath = 'path/to/translations.json';
    const oldTranslations = {
      "es": {
        "fields": {
          "animal-type": {},
          "building-type": {}
        },
        "presets": {},
        "categories": {}
      }
    };
    const expectedTranslations = {
      "es": {
        "fields": {
          "animal-type": {},
          "building-type": {}
        },
        "presets": {},
        "categories": {}
      }
    };

    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(oldTranslations));
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    transformTranslations(translationsPath);

    expect(writeSpy).toHaveBeenCalledWith(
      translationsPath,
      JSON.stringify(expectedTranslations, null, 4),
      'utf8'
    );
  });
});

describe('transformConfig', () => {
  it('should handle .mapeosettings file correctly', () => {
    const oldConfigPath = 'path/to/config.mapeosettings';
    const newConfigPath = 'path/to/new_config';

    (fs.lstatSync as jest.Mock).mockImplementation((path: fs.PathLike) => {
      return {
        isFile: () => path === 'path/to/config.mapeosettings',
        isDirectory: () => path !== 'path/to/config.mapeosettings',
      } as fs.Stats;
    });
    jest.spyOn(child_process, 'execSync').mockImplementation(() => Buffer.from(''));
    jest.spyOn(fs, 'mkdtempSync').mockReturnValue('/tmp/mapeo-settings-test');
    jest.spyOn(fs, 'readdirSync').mockReturnValue([]);

    const copyFolderSpy = jest.fn();
    const transformFieldsSpy = jest.fn();
    const transformPresetsSpy = jest.fn();
    const transformMetadataSpy = jest.fn();
    const transformPresetsJsonSpy = jest.fn();
    const transformTranslationsSpy = jest.fn();

    jest.mock('./transformConfig', () => ({
      ...jest.requireActual('./transformConfig'),
      copyFolder: copyFolderSpy,
      transformFields: transformFieldsSpy,
      transformPresets: transformPresetsSpy,
      transformMetadata: transformMetadataSpy,
      transformPresetsJson: transformPresetsJsonSpy,
      transformTranslations: transformTranslationsSpy,
    }));

    transformConfig(oldConfigPath, newConfigPath);

    expect(copyFolderSpy).toHaveBeenCalledWith('/tmp/mapeo-settings-test', newConfigPath);
    expect(transformFieldsSpy).toHaveBeenCalled();
    expect(transformPresetsSpy).toHaveBeenCalled();
    expect(transformMetadataSpy).toHaveBeenCalled();
    expect(transformPresetsJsonSpy).toHaveBeenCalled();
    expect(transformTranslationsSpy).toHaveBeenCalled();
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
      "terms": [],
      "fieldRefs": [],
      "removeTags": {},
      "addTags": {}
    };

    const newPreset = transformPreset({ ...oldPreset });

    expect(newPreset).toEqual(expectedNewPreset);
  });
});
