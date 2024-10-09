import { transformConfig as originalTransformConfig } from './transformConfig';
import { copyFolder, extractMapeosettings } from './utils/fileUtils';
import { transformFields, transformPresets, transformMetadata, transformPresetsJson, transformTranslations } from './utils/transformationUtils';
import { packageComapeocat } from './utils/packagingUtils';
import * as path from 'path';
import * as fs from 'fs';

export async function transformConfig(oldConfigDir: string, newConfigDir: string) {
    console.log("Checking if the first argument is a folder or a .mapeosettings file...");
    const stats = await fs.promises.lstat(oldConfigDir);
    const isMapeoSettings = stats.isFile() && oldConfigDir.endsWith(".mapeosettings");
    let configDir = oldConfigDir;

    if (isMapeoSettings) {
        configDir = await extractMapeosettings(oldConfigDir);
    } else {
        if (!stats.isDirectory()) {
            console.error("First argument must be a directory or a .mapeosettings file.");
            process.exit(1);
        }
        await transformConfigFolder(oldConfigDir, newConfigDir);
    }

    await transformCommonFiles(newConfigDir);

    console.log("Transformation complete.");

    if (isMapeoSettings) {
        await packageComapeocat(oldConfigDir, newConfigDir, configDir);
    } else {
        console.log("New config generated at:", newConfigDir);
    }
}

async function transformConfigFolder(oldConfigDir: string, newConfigDir: string) {
    console.log("Copying entire config folder...");
    await copyFolder(oldConfigDir, newConfigDir);
    console.log("Config folder copied.");

    console.log("Transforming fields and presets directories...");
    const fieldsDir = path.join(newConfigDir, "fields");
    const presetsDir = path.join(newConfigDir, "presets");
    const messagesDir = path.join(newConfigDir, "messages");

    if (fs.existsSync(fieldsDir)) {
        await transformFields(fieldsDir);
    }
    if (fs.existsSync(presetsDir)) {
        await transformPresets(presetsDir);
    }
    if (fs.existsSync(messagesDir)) {
        console.log("Processing messages directory...");
        // Add any specific processing for messages directory if needed
    }
}

async function transformCommonFiles(newConfigDir: string) {
    const metadataPath = path.join(newConfigDir, "metadata.json");
    if (fs.existsSync(metadataPath)) {
        await transformMetadata(metadataPath);
    }

    const translationsPath = path.join(newConfigDir, "translations.json");
    if (fs.existsSync(translationsPath)) {
        await transformTranslations(translationsPath);
    }

    const presetsJsonPath = path.join(newConfigDir, "presets.json");
    if (fs.existsSync(presetsJsonPath)) {
        console.log("Detected presets.json, transforming presets.json...");
        await transformPresetsJson(presetsJsonPath);
    }
}
