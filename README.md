# ERB-typescript-webpack

Eelectron React Boilerplate with typescript and webpack!

react ver: 17,
electron ver: 20


---------------usage dev--------------------------------
1. terminal 에서 'npm i' 명령으를 통해 node_module 을 추가한다
   (nodejs가 설치되어있어야 한다. https://nodejs.org/en/ 16버젼 이상 설치)
2. terminal 에서 yarn 설치 - 'npm i -g yarn' 명령, 'yarn -v'를 통해 정상작동하는지 확인(yarn 명령어를 찾을수 없다고 나오면 windows내 환경변수에서 yarn 등록)
3. 프로젝트 디렉토리에 .env 생성 후 s3 정보 입력(.env는 개발환경에서 파일로 작동하며 배포시 클라이언트가 확인하지 못하도록 되어있다. 보안 환경 변수 선언시 사용)
4. env 생성 방법. window 경우 메모장을 열고 S3_BUCKET_NAME=onequick-repo
   S3_ACCESS_KEY=엑세스키
   S3_SECRET_KEY=시크릿키
   S3_REGION=리전 입력후 파일이름을 .env로 설정하고 파일형식을 '모든'으로 생성
5. 개발환경에서 실행 명령어 terminal - 'yarn start'
6. 프로덕션 배포 - 'yarn package'

