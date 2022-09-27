import {
    _Object,
    GetObjectCommand,
    GetObjectCommandInput,
    ListObjectsCommand,
    S3Client
} from '@aws-sdk/client-s3';
import {Readable} from "stream";
import {listCommandArray, S3Config, Bucket,} from "./configures";
import {fileWriteAsync} from "./file-stream";
import * as fs from "fs";
import path from "path";
import {getExtraPath} from "../../shared/path/extra-path";


const s3Client = new S3Client(S3Config);

/**
 * downloadParams: {Bucket: bucket name, Key:directory/filename...}
 * updatePath: download directory for your production path
 * fileName: download file name*/
export const downloadFiles = async (downloadParams: GetObjectCommandInput, updatePath: string, fileName: string, rootPath?: string) => {
    try {
        const fileResult = await s3Client.send(new GetObjectCommand(downloadParams));
        if (fileResult.Body instanceof Readable) {
            return await fileWriteAsync(fileResult.Body, updatePath, fileName, rootPath);
        }

    } catch (err) {
        console.log(err);
    }
}

/**
 * 파일 목록 가져오기*/
export const getUpdateFiles = async (listCommandParams: listCommandArray, updateVer: string, isDev: boolean) => {
    try {
        const fileArr = new Array<_Object>();
        for (const listCommand of listCommandParams) {

            const download_list_parmas = {
                Bucket,
                Prefix: listCommand.Prefix,
            }
            const outputs = await s3Client.send(new ListObjectsCommand(download_list_parmas));

            outputs.Contents.map(s3Object => {
                const parsedPath = s3Object.Key.replace("download", "");
                const extraFullPath = path.join(getExtraPath(isDev), parsedPath);

                if (!fs.existsSync(extraFullPath)) {
                    console.log(extraFullPath);
                    return fileArr.push(s3Object);
                }

                const currentFileStat = fs.statSync(extraFullPath);
                const createdDate = new Date(currentFileStat.ctime);
                if (s3Object.LastModified > createdDate) {
                    return fileArr.push(s3Object);
                }
            });
        }
        return fileArr;
    } catch (err) {
        console.log(err);
    }
};