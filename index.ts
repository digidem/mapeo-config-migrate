import { transformConfig } from './src/transformConfig';

if (require.main === module) {
    const oldConfigDir = process.argv[2];
    if (!oldConfigDir) {
        console.error('Usage: ts-node index.ts <path-to-old-config> [path-to-new-config]');
        process.exit(1);
    }
    const newConfigDir = process.argv[3] || path.join(oldConfigDir, 'new_config');
    transformConfig(oldConfigDir, newConfigDir);
}