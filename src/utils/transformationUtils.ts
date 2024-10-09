import { readFile, writeFile, readdir } from './fileUtils';
import { transformField, transformPreset } from './transformFunctions';
import * as path from 'path';

export async function transformFields(fieldsDir: string) {
    console.log("Transforming fields...");
    const fieldFiles = await readdir(fieldsDir);
    for (const file of fieldFiles) {
        const fieldPath = path.join(fieldsDir, file);
        const data = await readFile(fieldPath, "utf8");
        let field = JSON.parse(data);
        field = transformField(field);
        await writeFile(fieldPath, JSON.stringify(field, null, 4), "utf8");
        console.log(`Transformed field: ${file}`);
    }
    console.log("Fields transformation complete.");
}

export async function transformPresets(presetsDir: string) {
    console.log("Transforming presets...");
    const presetFiles = await readdir(presetsDir);
    for (const file of presetFiles) {
        const presetPath = path.join(presetsDir, file);
        const data = await readFile(presetPath, "utf8");
        let preset = JSON.parse(data);
        preset = transformPreset(preset);
        await writeFile(presetPath, JSON.stringify(preset, null, 4), "utf8");
        console.log(`Transformed preset: ${file}`);
    }
    console.log("Presets transformation complete.");
}

export async function transformMetadata(metadataPath: string) {
    console.log("Transforming metadata.json...");
    const data = await readFile(metadataPath, "utf8");
    const metadata = JSON.parse(data);
    const transformedMetadata = {
        name: metadata.dataset_id || metadata.name,
        version: metadata.version,
        fileVersion: "1.0",
        buildDate: new Date().toISOString(),
    };
    await writeFile(
        metadataPath,
        JSON.stringify(transformedMetadata, null, 4),
        "utf8",
    );
    console.log("metadata.json transformed.");
}

export async function transformPresetsJson(presetsPath: string) {
    console.log("Transforming presets.json...");
    const data = await readFile(presetsPath, "utf8");
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

    await writeFile(presetsPath, JSON.stringify(presets, null, 4), "utf8");
    console.log("presets.json transformed.");
}

function transformPresetPresetJson(
    preset: Record<string, unknown>,
): Record<string, unknown> {
    // Reorder keys as per existing transformPreset function first
    const transformedPreset = transformPreset(preset);
    // Additionally, add required fields
    transformedPreset.fieldRefs = [];
    transformedPreset.removeTags = {};
    transformedPreset.addTags = {};
    return transformedPreset;
}

export async function transformTranslations(translationsPath: string) {
    console.log("Transforming translations.json...");
    const data = await readFile(translationsPath, "utf8");
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
                        const cleanKey = key.replace(/^\"|\"$/g, "");
                        newOptions[cleanKey] = { label: value, value: cleanKey };
                    }
                    field.options = newOptions;
                }
            }
        }
    }

    await writeFile(
        translationsPath,
        JSON.stringify(translations, null, 4),
        "utf8",
    );
    console.log("translations.json transformed.");
}
