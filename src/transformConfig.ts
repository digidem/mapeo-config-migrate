import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
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

function transformMetadata(metadataPath: string) {
    console.log('Transforming metadata.json...');
    const data = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(data);
    const transformedMetadata = {
        name: metadata.dataset_id,
        version: metadata.version,
        fileVersion: "1.0",
        buildDate: new Date().toISOString()
    };
    fs.writeFileSync(metadataPath, JSON.stringify(transformedMetadata, null, 4), 'utf8');
    console.log('metadata.json transformed.');
}

function transformPresetsJson(presetsPath: string) {
    console.log('Transforming presets.json...');
    const data = fs.readFileSync(presetsPath, 'utf8');
    const presets = JSON.parse(data);

    // Transform fields
    for (const fieldKey in presets.fields) {
        const field = presets.fields[fieldKey];
        presets.fields[fieldKey] = transformField(field);
    }

    // Transform presets
    for (const presetKey in presets.presets) {
        const preset = presets.presets[presetKey];
        presets.presets[presetKey] = transformPresetPresetJson(preset);
    }

    fs.writeFileSync(presetsPath, JSON.stringify(presets, null, 4), 'utf8');
    console.log('presets.json transformed.');
}

function transformPresetPresetJson(preset: any): any {
    // Reorder keys as per existing transformPreset function first
    preset = transformPreset(preset);
    // Additionally, add required fields
    preset.fieldRefs = [];
    preset.removeTags = {};
    preset.addTags = {};
    return preset;
}

function transformTranslations(translationsPath: string) {
    console.log('Transforming translations.json...');
    const data = fs.readFileSync(translationsPath, 'utf8');
    const translations = JSON.parse(data);

    for (const lang in translations) {
        const langData = translations[lang];
        if (langData.fields) {
            for (const fieldKey in langData.fields) {
                const field = langData.fields[fieldKey];
                if (field.options) {
                    const newOptions: any = {};
                    for (const key in field.options) {
                        const value = field.options[key];
                        const cleanKey = key.replace(/^\"|\"$/g, '');
                        newOptions[cleanKey] = { label: value, value: cleanKey };
                    }
                    field.options = newOptions;
                }
            }
        }
    }

    fs.writeFileSync(translationsPath, JSON.stringify(translations, null, 4), 'utf8');
    console.log('translations.json transformed.');
}

export function transformConfig(oldConfigDir: string, newConfigDir: string) {
    console.log('Checking if the first argument is a folder or a .mapeosettings file...');
    let configDir = oldConfigDir;

    if (fs.lstatSync(oldConfigDir).isFile() && oldConfigDir.endsWith('.mapeosettings')) {
        console.log('Detected .mapeosettings file. Extracting to a temporary directory...');
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mapeo-settings-'));
        child_process.execSync(`tar -xf ${oldConfigDir} -C ${tempDir}`);
        configDir = tempDir;
        console.log(`Extracted to temporary directory: ${tempDir}`);
    } else if (!fs.lstatSync(oldConfigDir).isDirectory()) {
        console.error('First argument must be a directory or a .mapeosettings file.');
        process.exit(1);
    }
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
