import * as fileAsync from 'fs/promises';
import * as fs from 'fs';
import {Readable} from "stream";
import path from "path";


export const jsonWriteAsync = async (filePath: string, release: {ver:string, date:string}) => {
    try {
        const updateRelese = {
            ver:release.ver,
            date:release.date
        };
        const jsonBuffer = JSON.stringify(updateRelese);
        await fileAsync.writeFile(filePath, jsonBuffer,{flag:'w+'} );
    } catch (err) {
        console.log(err);
    }
};
export const jsonReadAsync = async (filePath: string) => {
    try {
        const releaseJson = await fileAsync.readFile(filePath, "utf8");
        return JSON.parse(releaseJson);
    } catch (err) {
        console.log(err);
    }
}

export const fileWriteAsync = async (readable: Readable, filePath: string, fileName: string, rootPath?:string) => {
    try {
        /**
         * full path check*/
        if (!fs.existsSync(filePath)) {
            if(!fs.existsSync(rootPath)) await fs.promises.mkdir(rootPath);

            const paths = filePath.replace(rootPath, '').split('/');
            let mkdirPath = rootPath;
            for (const p of paths) {
                if (!p && !p.trim()) {
                    continue;
                }
                mkdirPath = path.join(mkdirPath, p);
                if (fs.existsSync(mkdirPath)) continue;
                await fs.promises.mkdir(mkdirPath);
            }
        }
        readable.pipe(fs.createWriteStream(path.join(filePath, fileName)));
    } catch (err) {
        console.error(err + `${rootPath}, ${filePath} ${fileName}`);
    }
}