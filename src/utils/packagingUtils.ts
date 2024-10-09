import * as fs from "fs";
import * as archiver from "archiver";
import * as path from "path";
import { promisify } from "util";

export async function packageComapeocat(oldConfigDir: string, newConfigDir: string, configDir: string) {
    console.log("Packaging transformed config into .comapeocat file...");
    const baseName = path.basename(oldConfigDir, ".mapeosettings");
    const comapeocatName = newConfigDir.endsWith(".comapeocat")
        ? newConfigDir
        : path.join(newConfigDir, `${baseName}.comapeocat`);
    
    const comapeocatDir = path.dirname(comapeocatName);
    if (!fs.existsSync(comapeocatDir)) {
        await fs.promises.mkdir(comapeocatDir, { recursive: true });
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
