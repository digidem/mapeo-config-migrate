import { transformConfig } from './transformConfig';
import { transformField, transformPreset } from './transformFunctions';
import { copyFolder, extractMapeosettings } from './utils/fileUtils';
import { transformFields, transformPresets, transformMetadata, transformPresetsJson, transformTranslations } from './utils/transformationUtils';
import { packageComapeocat } from './utils/packagingUtils';
import * as fs from 'fs';
import * as child_process from 'child_process';

jest.mock('fs');
jest.mock('child_process');
jest.mock('./utils/fileUtils');
jest.mock('./utils/transformationUtils');
jest.mock('./utils/packagingUtils');

const writeSpy = jest.spyOn(fs, 'writeFileSync');

beforeEach(() => {
  jest.resetAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('transformConfig', () => {
  it('should handle .mapeosettings file correctly', async () => {
    const oldConfigPath = 'path/to/config.mapeosettings';
    const newConfigPath = 'path/to/new_config';

    (fs.lstat as jest.Mock).mockResolvedValue({
      isFile: () => oldConfigPath.endsWith('.mapeosettings'),
      isDirectory: () => false,
    });
    (child_process.execSync as jest.Mock).mockImplementation(() => Buffer.from(''));
    (fs.mkdtemp as jest.Mock).mockResolvedValue('/tmp/mapeo-settings-test');
    (transformFields as jest.Mock).mockResolvedValue(undefined);
    (transformPresets as jest.Mock).mockResolvedValue(undefined);
    (transformMetadata as jest.Mock).mockResolvedValue(undefined);
    (transformPresetsJson as jest.Mock).mockResolvedValue(undefined);
    (transformTranslations as jest.Mock).mockResolvedValue(undefined);
    (packageComapeocat as jest.Mock).mockResolvedValue(undefined);
    (copyFolder as jest.Mock).mockResolvedValue(undefined);
    (extractMapeosettings as jest.Mock).mockResolvedValue('/tmp/mapeo-settings-test');

    await transformConfig(oldConfigPath, newConfigPath);

    expect(copyFolder).toHaveBeenCalledWith('/tmp/mapeo-settings-test', newConfigPath);
    expect(transformFields).toHaveBeenCalled();
    expect(transformPresets).toHaveBeenCalled();
    expect(transformMetadata).toHaveBeenCalled();
    expect(transformPresetsJson).toHaveBeenCalled();
    expect(transformTranslations).toHaveBeenCalled();
    expect(packageComapeocat).toHaveBeenCalledWith(oldConfigPath, newConfigPath, '/tmp/mapeo-settings-test');
  });
});
