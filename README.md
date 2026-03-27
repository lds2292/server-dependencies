# Server Dependencies

서버 인프라의 의존성(서버 간 연결 관계)을 시각화하고 관리하는 웹 애플리케이션입니다.
프로젝트별로 멤버를 초대하고, D3 기반 그래프로 서버 토폴로지를 편집·공유할 수 있습니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Vue 3, Pinia, Vue Router, D3.js, TypeScript |
| Backend | Express, TypeScript, Prisma ORM, JWT |
| Database | PostgreSQL |
| 인프라 | Docker Compose |

## 프로젝트 구조

```
server-dependencies/
├── client/          # Vue 3 프론트엔드
├── server/          # Express 백엔드
│   ├── prisma/      # Prisma 스키마 및 마이그레이션
│   └── src/         # 소스 코드
├── docker-compose.yml
└── package.json     # npm workspaces 루트
```

## 초기 설정

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd server-dependencies
npm install
```

### 2. 환경 변수 설정

`server/.env` 파일을 생성합니다.

```bash
cp server/.env.example server/.env  # 예시 파일이 있는 경우
# 또는 직접 생성
```

`server/.env` 내용:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
CLIENT_ORIGIN="http://localhost:5173"
ENCRYPTION_KEY="64자리 hex 문자열"  # openssl rand -hex 32 로 생성
```

### 3. PostgreSQL 실행 (Docker)

```bash
docker-compose up -d
```

> 데이터는 `./pgdata/` 디렉토리에 영구 저장됩니다.

### 4. Prisma 마이그레이션 적용

```bash
cd server
npx prisma migrate deploy
```

마이그레이션이 완료되면 Prisma Client를 생성합니다.

```bash
npx prisma generate
```

### 5. 개발 서버 실행

루트 디렉토리에서 각각 실행합니다.

```bash
# 백엔드 (포트 3001)
npm run dev:server

# 프론트엔드 (포트 5173)
npm run dev:client
```

## Prisma 관련 명령어

```bash
cd server

# 마이그레이션 적용 (운영/초기 설정)
npx prisma migrate deploy

# 스키마 변경 후 마이그레이션 생성 (개발)
npx prisma migrate dev --name <migration-name>

# Prisma Client 재생성
npx prisma generate

# DB GUI 열기
npx prisma studio
```

## Docker 관련 명령어

```bash
# DB 시작
docker-compose up -d

# DB 중지
docker-compose down

# DB 및 데이터 완전 삭제
docker-compose down && rm -rf pgdata/
```
