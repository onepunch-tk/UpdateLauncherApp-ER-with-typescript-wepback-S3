import * as fileAsync from 'fs/promises';
import * as fs from 'fs';
import {Readable} from "stream";
import path from "path";


/**
 * json 파일 쓰기
 * filePath: 파일 쓸 위치
 * release: 데이터*/
export const jsonWriteAsync = async (filePath: string, release: { ver: string, date: string }) => {
    try {
        const updateRelese = {
            ver: release.ver,
            date: release.date
        };
        const jsonBuffer = JSON.stringify(updateRelese);
        await fileAsync.writeFile(filePath, jsonBuffer, {flag: 'w+'});
    } catch (err) {
        console.log(err);
    }
};

/**
 * json 파일 읽기
 * filePath: 파일 읽을 위치*/
export const jsonReadAsync = async (filePath: string) => {
    try {
        const releaseJson = await fileAsync.readFile(filePath, "utf8");
        return JSON.parse(releaseJson);
    } catch (err) {
        console.log(err);
    }
}

/**
 * s3 오브젝트 파일 쓰기
 * readable: readStream(s3 object.body)
 * filePath: 패치 할 위치
 * fileName: 파일 이름
 * rootPath: 파일 쓸 위치에 디렉토리가 없을 것을 대비하여 받는 인자*/
export const fileWriteAsync = async (readable: Readable, filePath: string, fileName: string, rootPath?: string) => {
    try {
        /**
         * 디렉토리가 없다면,*/
        if (!fs.existsSync(filePath)) {
            /**
             * extra root path가 없다면 생성*/
            if (!fs.existsSync(rootPath)) await fs.promises.mkdir(rootPath);

            /**
             * extra root path를 분리해서 디렉토리 이름 하나하나 얻어온다*/
            const paths = filePath.replace(rootPath, '').split('/');
            let mkdirPath = rootPath;
            for (const p of paths) {
                /**
                 * 다운받을 디렉토리 이름이 없으면 패스(extra root path에 받는 다는 뜻)*/
                if (!p && !p.trim()) {
                    continue;
                }
                /**
                 * rootpath + 띠어낸 다운로드 디렉토리*/
                mkdirPath = path.join(mkdirPath, p);
                /**
                 * 비동기 처리 시 밀고들어오는 이슈때문에 넣었지만, 테스트후 제거해도될 로직*/
                if (fs.existsSync(mkdirPath)) continue;
                /**
                 * 디렉토리 생성*/
                await fs.promises.mkdir(mkdirPath);
            }
        }
        /**
         * 파일 쓰기 I/O 비동기 호출이기때문에 shared/ipc/event-main 에서 리턴받은후 이벤트 리스너 등록후 파일다운로드 완료 대기*/
        return readable.pipe(fs.createWriteStream(path.join(filePath, fileName)));
    } catch (err) {
        console.error(err + `${rootPath}, ${filePath} ${fileName}`);
        return undefined;
    }
}