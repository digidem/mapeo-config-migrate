import { transformConfig } from './src/transformConfig';
import * as path from 'path';

if (require.main === module) {
    const oldConfigDir = process.argv[2];
    let newConfigDir = process.argv[3];

    if (!oldConfigDir) {
        console.error('Usage: mapeo-config-migrate <path-to-old-config> [path-to-new-config]');
        process.exit(1);
    }
    const isMapeoSettings = oldConfigDir.endsWith('.mapeosettings');

    if (!newConfigDir) {
        if (isMapeoSettings) {
            newConfigDir = oldConfigDir.replace('.mapeosettings', '.comapeocat');
        } else {
            newConfigDir = path.join(oldConfigDir, 'new_config');
        }
    }
    transformConfig(oldConfigDir, newConfigDir);
}
