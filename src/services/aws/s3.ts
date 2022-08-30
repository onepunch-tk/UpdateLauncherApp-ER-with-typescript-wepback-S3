import {
    _Object,
    GetObjectCommand,
    GetObjectCommandInput,
    ListObjectsCommand,
    S3Client
} from '@aws-sdk/client-s3';
import {Readable} from "stream";
import { listCommandArray, S3Config, Bucket,} from "./configures";
import path from "path";
import {fileWriteAsync} from "./file-stream";


const s3Client = new S3Client(S3Config);

/**
 * downloadParams: {Bucket: bucket name, Key:directory/filename...}
 * updatePath: download directory for your production path
 * fileName: download file name*/
export const downloadFiles = async (downloadParams: GetObjectCommandInput, updatePath: string, fileName: string, rootPath?:string) => {
    try {
        const fileResult = await s3Client.send(new GetObjectCommand(downloadParams));
        if (fileResult.Body instanceof Readable) {
            await fileWriteAsync(fileResult.Body, updatePath, fileName, rootPath);
        }
        // const s3 = new AWS.S3();
        // const s3Object = await s3.getObject(downloadParams);
        // await fileWriteAsync(s3Object.createReadStream(), updatePath, fileName, rootPath);

    } catch (err) {
        console.log(err);
    }
}

export const listFiles = async (listCommandParams: listCommandArray) => {
    try {
        const filesArray: _Object[][] = [];
        for (const listCommand of listCommandParams) {

            const download_list_parmas = {
                Bucket,
                Prefix: listCommand.Prefix,
            }

            const outputs = await s3Client.send(new ListObjectsCommand(download_list_parmas));
            // const filterOutputs = outputs.Contents.filter((output)=>{
            //    const parsedPath = path.parse(output.Key);
            //    if(parsedPath.ext !== '') return output;
            // });
            filesArray.push(outputs.Contents);
            // filesArray.push(filterOutputs);
            // if (data.Contents) {
            //     for (const content of data.Contents) {
            //         if (content.Key?.includes('.')) {
            //             const fileFullName = content.Key?.split('/');
            //             const fileName = fileFullName[fileFullName.length - 1];
            //
            //             const updatePath = path.join(rootPath,
            //                 content.Key?.replace(listObj.Prefix, listObj.UpdatePath)
            //                     .replace(fileName, ''));
            //             await downloadFiles(content.Key, updatePath, fileName);
            //         }
            //     }
            // }
        }

        return filesArray;
    } catch (err) {
        console.log(err);
    }
};