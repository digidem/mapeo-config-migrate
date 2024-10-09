import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const lstat = promisify(fs.lstat);

export async function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
}

export async function copyFolder(src: string, dest: string) {
    await ensureDir(dest);
    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyFolder(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath);
        }
    }
}

export async function extractMapeosettings(oldConfigDir: string): Promise<string> {
    console.log("Detected .mapeosettings file. Extracting to a temporary directory...");
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "mapeo-settings-"));
    child_process.execSync(`tar -xf ${oldConfigDir} -C ${tempDir}`);
    console.log(`Extracted to temporary directory: ${tempDir}`);
    return tempDir;
}
