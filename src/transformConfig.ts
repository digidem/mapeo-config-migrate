import * as fs from "fs";
import * as archiver from "archiver";
import * as path from "path";
import * as os from "os";
import * as child_process from "child_process";
import ignore from "ignore";
import { transformField, transformPreset } from "./transformFunctions";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const lstat = promisify(fs.lstat);

async function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
}

async function copyFolder(src: string, dest: string) {
    await ensureDir(dest);
    const entries = await readdir(src, { withFileTypes: true });

    // Check for .gitignore
    const gitignorePath = path.join(src, ".gitignore");
    const ig = ignore();
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = await readFile(gitignorePath, "utf8");
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
            await copyFolder(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath);
        }
    }
}

async function transformFields(fieldsDir: string) {
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

async function transformPresets(presetsDir: string) {
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

async function transformMetadata(metadataPath: string) {
    console.log("Transforming metadata.json...");
    const data = await readFile(metadataPath, "utf8");
    const metadata = JSON.parse(data);
    const transformedMetadata = {
        name: metadata.dataset_id,
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

async function transformPresetsJson(presetsPath: string) {
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

async function transformTranslations(translationsPath: string) {
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

async function extractMapeosettings(oldConfigDir: string): Promise<string> {
    console.log("Detected .mapeosettings file. Extracting to a temporary directory...");
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "mapeo-settings-"));
    child_process.execSync(`tar -xf ${oldConfigDir} -C ${tempDir}`);
    console.log(`Extracted to temporary directory: ${tempDir}`);
    return tempDir;
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

async function packageComapeocat(oldConfigDir: string, newConfigDir: string, configDir: string) {
    console.log("Packaging transformed config into .comapeocat file...");
    const baseName = path.basename(oldConfigDir, ".mapeosettings");
    const comapeocatName = newConfigDir.endsWith(".comapeocat")
        ? newConfigDir
        : path.join(newConfigDir, `${baseName}.comapeocat`);
    
    const comapeocatDir = path.dirname(comapeocatName);
    if (!fs.existsSync(comapeocatDir)) {
        await mkdir(comapeocatDir, { recursive: true });
    }

    const output = fs.createWriteStream(comapeocatName);
    const archive = archiver.create("zip", { zlib: { level: 9 } });
    output.on("close", () => {
        console.log(`Packaged transformed config into ${comapeocatName} (${archive.pointer()} total bytes)`);
    });
    archive.on("error", (err: Error) => {
        throw err;
    });

    archive.pipe(output);
    archive.directory(configDir, false);
    await archive.finalize();
}

export async function transformConfig(oldConfigDir: string, newConfigDir: string) {
    console.log("Checking if the first argument is a folder or a .mapeosettings file...");
    const stats = await lstat(oldConfigDir);
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

if (require.main === module) {
    const oldConfigDir = process.argv[2];
    if (!oldConfigDir) {
        console.error(
            "Usage: ts-node transformConfig.ts <path-to-old-config> [path-to-new-config]",
        );
        process.exit(1);
    }
    const newConfigDir = process.argv[3] || path.join(oldConfigDir, "new_config");
    transformConfig(oldConfigDir, newConfigDir).catch((error) => {
        console.error("An error occurred:", error);
        process.exit(1);
    });
}
