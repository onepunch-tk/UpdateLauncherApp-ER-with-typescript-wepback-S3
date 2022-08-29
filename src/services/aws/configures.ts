export const S3Config = {
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    }
}

export const Bucket: string = process.env.S3_BUCKET_NAME;
export const releaseJsonKey = 'version/release.json';
export const prefix_main = "download/Brainer_Main";
export const prefix_game = "download/Brainer_Game";

export type listCommandArray = { Prefix: string, UpdatePath: string }[];

export const getObjectCommandInput = (Key:string) => {
    const objectCommandInput = {
        Bucket,
        Key
    };
    return objectCommandInput;
}



