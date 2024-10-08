import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import { transformField, transformPreset } from './transformFunctions';

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFolder(src: string, dest: string) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    // Check for .gitignore
    const gitignorePath = path.join(src, '.gitignore');
    const ig = ignore();
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        ig.add(gitignoreContent);
    }

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        const relativePath = path.relative(src, srcPath);

        // Skip if the file is ignored by .gitignore
        if (ig.ignores(relativePath)) {
            continue;
        }

        if (entry.isDirectory()) {
            copyFolder(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function transformFields(fieldsDir: string) {
    console.log('Transforming fields...');
    const fieldFiles = fs.readdirSync(fieldsDir);
    for (const file of fieldFiles) {
        const fieldPath = path.join(fieldsDir, file);
        const data = fs.readFileSync(fieldPath, 'utf8');
        let field = JSON.parse(data);
        field = transformField(field);
        fs.writeFileSync(fieldPath, JSON.stringify(field, null, 4), 'utf8');
    }
    console.log('Fields transformation complete.');
}

function transformPresets(presetsDir: string) {
    console.log('Transforming presets...');
    const presetFiles = fs.readdirSync(presetsDir);
    for (const file of presetFiles) {
        const presetPath = path.join(presetsDir, file);
        const data = fs.readFileSync(presetPath, 'utf8');
        let preset = JSON.parse(data);
        preset = transformPreset(preset);
        fs.writeFileSync(presetPath, JSON.stringify(preset, null, 4), 'utf8');
    }
    console.log('Presets transformation complete.');
}

export function transformConfig(oldConfigDir: string, newConfigDir: string) {
    console.log('Copying entire config folder...');
    copyFolder(oldConfigDir, newConfigDir);
    console.log('Config folder copied.');

    const fieldsDir = path.join(newConfigDir, 'fields');
    const presetsDir = path.join(newConfigDir, 'presets');

    console.log('Transforming fields and presets...');
    transformFields(fieldsDir);
    transformPresets(presetsDir);

    console.log('Transformation complete. New config generated at:', newConfigDir);
}

if (require.main === module) {
    const oldConfigDir = process.argv[2];
    if (!oldConfigDir) {
        console.error('Usage: ts-node transformConfig.ts <path-to-old-config> [path-to-new-config]');
        process.exit(1);
    }
    const newConfigDir = process.argv[3] || path.join(oldConfigDir, 'new_config');
    transformConfig(oldConfigDir, newConfigDir);
}
