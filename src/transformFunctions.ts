import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

export function transformConfig(oldConfigPath: string, newConfigPath: string): void {
    const isFile = fs.lstatSync(oldConfigPath).isFile();
    const isMapeoSettings = isFile && path.extname(oldConfigPath) === '.mapeosettings';
    const tmpDir = fs.mkdtempSync('/tmp/mapeo-settings-');

    try {
        if (isMapeoSettings) {
            handleMapeosettingsFile(oldConfigPath, tmpDir);
        } else if (!isFile) {
            handleConfigFolder(oldConfigPath, tmpDir);
        } else {
            throw new Error('Invalid config format');
        }

        processConfigFiles(tmpDir);
        copyFolder(tmpDir, newConfigPath);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

function handleMapeosettingsFile(filePath: string, tmpDir: string): void {
    child_process.execSync(`unzip "${filePath}" -d "${tmpDir}"`);
}

function handleConfigFolder(folderPath: string, tmpDir: string): void {
    copyFolder(folderPath, tmpDir);
}

function processConfigFiles(configDir: string): void {
    const files = fs.readdirSync(configDir);

    for (const file of files) {
        const filePath = path.join(configDir, file);
        switch (file) {
            case 'presets.json':
                transformPresetsJson(filePath);
                break;
            case 'metadata.json':
                transformMetadata(filePath);
                break;
            case 'translations.json':
                transformTranslations(filePath);
                break;
            default:
                // Handle other files if needed
                break;
        }
    }
}

export function transformField(field: any): any {
    const transformedField: any = { ...field };
    if (transformedField.key) {
        transformedField.tagKey = transformedField.key;
        delete transformedField.key;
    }
    if (transformedField.type) {
        transformedField.type = transformedField.type.replace(/_(\w)/g, (match: string, letter: string) => letter.toUpperCase());
    }
    if (transformedField.placeholder) {
        transformedField.helperText = transformedField.placeholder;
        delete transformedField.placeholder;
    }
    if (transformedField.options && Array.isArray(transformedField.options)) {
        transformedField.options = transformedField.options.map((option: string | Record<string, unknown>) => {
            if (typeof option === 'string') {
                return {
                    label: option,
                    value: option
                };
            }
            return option;
        });
    }
    transformedField.universal = false;
    return transformedField;
}

export function transformPreset(preset: any): any {
    const orderedPreset: { [key: string]: any } = {};
    const keyOrder = ["name", "icon", "color", "fields", "geometry", "tags", "terms"];
    for (const key of keyOrder) {
        if (Object.prototype.hasOwnProperty.call(preset, key)) {
            orderedPreset[key] = preset[key];
        }
    }
    for (const key of Object.keys(preset)) {
        if (!Object.prototype.hasOwnProperty.call(orderedPreset, key)) {
            orderedPreset[key] = preset[key];
        }
    }
    // Add additional required properties
    orderedPreset.fieldRefs = [];
    orderedPreset.removeTags = {};
    orderedPreset.addTags = {};

    return orderedPreset;
}

function transformPresetsJson(filePath: string): void {
    const presets = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Transform fields
    for (const fieldKey in presets.fields) {
        presets.fields[fieldKey] = transformField(presets.fields[fieldKey]);
    }

    // Transform presets
    for (const presetKey in presets.presets) {
        presets.presets[presetKey] = transformPreset(presets.presets[presetKey]);
    }

    fs.writeFileSync(filePath, JSON.stringify(presets, null, 4), 'utf8');
}

function transformMetadata(filePath: string): void {
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const transformedMetadata = {
        name: metadata.dataset_id || metadata.name,
        version: metadata.version,
        fileVersion: "1.0",
        buildDate: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(transformedMetadata, null, 4), 'utf8');
}

function transformTranslations(filePath: string): void {
    // For now, we're not making any changes to translations.json
    // But we're keeping this function in case we need to add transformations in the future
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 4), 'utf8');
}

function copyFolder(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyFolder(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
