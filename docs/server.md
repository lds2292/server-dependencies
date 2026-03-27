# Server 개발 가이드

## 기술 스택

| 항목 | 버전 |
|------|------|
| Express | ^4.21.0 |
| Prisma ORM | ^5.22.0 |
| PostgreSQL | - |
| jsonwebtoken | ^9.0.2 |
| bcryptjs | ^2.4.3 |
| Helmet | ^7.1.0 |
| express-validator | ^7.2.0 |
| Winston | ^3.19.0 |
| TypeScript | ^5.5.3 |
| ts-node-dev | ^2.0.0 |

## 초기 설정

### 환경 변수

`server/.env.example`을 복사해 `server/.env` 생성:

```bash
cp server/.env.example server/.env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/server_dependencies"
JWT_ACCESS_SECRET="..."            # 랜덤 시크릿 (필수)
JWT_REFRESH_SECRET="..."           # 랜덤 시크릿 (필수)
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
CLIENT_ORIGIN="http://localhost:5173"
ENCRYPTION_KEY="..."               # 64자 hex 문자열 (필수)
```

### 데이터베이스 마이그레이션

```bash
npm run db:migrate --workspace=server   # 마이그레이션 실행
npm run db:generate --workspace=server  # Prisma 클라이언트 생성
```

## 개발 서버 실행

```bash
# 루트에서
npm run dev:server

# 또는 workspace 직접 지정
npm run dev --workspace=server
```

접속 URL: `http://localhost:3001`

ts-node-dev로 실행되며 소스 변경 시 자동 재시작된다.

## 디렉토리 구조

```
server/src/
├── server.ts                      # 서버 시작 (포트 바인딩)
├── app.ts                         # Express 앱 설정 (미들웨어, 라우트)
├── prisma.ts                      # Prisma 클라이언트 싱글턴
├── routes/
│   ├── auth.ts                   # 인증 라우트
│   └── projects.ts               # 프로젝트 라우트
├── controllers/
│   ├── authController.ts         # 인증 요청 처리
│   ├── projectController.ts      # 프로젝트 요청 처리
│   └── graphController.ts        # 그래프 데이터 요청 처리
├── services/
│   ├── authService.ts            # 인증 비즈니스 로직
│   ├── projectService.ts         # 프로젝트 비즈니스 로직
│   ├── graphService.ts           # 그래프 분석 로직
│   └── cryptoService.ts          # 데이터 암호화/복호화
├── middleware/
│   └── authenticate.ts           # JWT 인증 미들웨어
├── types/
│   └── index.ts                  # 공용 타입 정의
└── scripts/
    └── migrateEncryption.ts      # 암호화 마이그레이션 스크립트
```

## API 엔드포인트

### 인증 (`/api/auth`)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/auth/register` | 회원가입 | X |
| POST | `/api/auth/login` | 로그인 | X |
| POST | `/api/auth/logout` | 로그아웃 | O |
| POST | `/api/auth/refresh` | Access Token 갱신 | X |

### 프로젝트 (`/api/projects`)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/projects` | 프로젝트 목록 | O |
| POST | `/api/projects` | 프로젝트 생성 | O |
| GET | `/api/projects/:id` | 프로젝트 상세 | O |
| PUT | `/api/projects/:id` | 프로젝트 수정 | O |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 | O |
| GET | `/api/projects/:id/graph` | 그래프 데이터 조회 | O |
| PUT | `/api/projects/:id/graph` | 그래프 데이터 저장 | O |

### 기타

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 헬스 체크 |

## 데이터베이스 스키마

```prisma
model User {
  id            String          @id @default(uuid())
  email         String          @unique
  username      String          @unique
  passwordHash  String
  createdAt     DateTime        @default(now())
  ownedProjects Project[]
  memberships   ProjectMember[]
  sessions      Session[]
}

model Session {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Project {
  id          String          @id @default(uuid())
  name        String
  description String?
  ownerId     String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  owner       User            @relation(fields: [ownerId], references: [id])
  members     ProjectMember[]
  graphData   GraphData?
}

model ProjectMember {
  projectId String
  userId    String
  joinedAt  DateTime @default(now())
  project   Project  @relation(fields: [projectId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  @@id([projectId, userId])
}

model GraphData {
  id        String   @id @default(uuid())
  projectId String   @unique
  data      Json
  positions Json?
  updatedAt DateTime @updatedAt
  project   Project  @relation(fields: [projectId], references: [id])
}
```

## 인증 흐름

1. 로그인 시 Access Token (15분) + Refresh Token (30일) 발급
2. Refresh Token은 `Session` 테이블에 저장
3. Access Token 만료 시 `/api/auth/refresh`로 갱신
4. 로그아웃 시 Session 레코드 삭제

인증이 필요한 라우트는 `authenticate` 미들웨어를 통해 JWT 검증 후 `req.user`에 유저 정보 주입.

## 데이터 암호화

`cryptoService.ts`에서 `ENCRYPTION_KEY`를 사용해 민감한 그래프 데이터를 암호화한다.

암호화 키 생성:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

기존 데이터 암호화 마이그레이션:
```bash
npm run migrate:encryption --workspace=server
```

## Prisma 관리

```bash
# 마이그레이션 생성 및 적용
npm run db:migrate --workspace=server

# Prisma 클라이언트 재생성 (스키마 변경 후)
npm run db:generate --workspace=server

# Prisma Studio (GUI 데이터 조회)
npm run db:studio --workspace=server
```

## 로깅

Winston을 사용하며 요청마다 메서드, 경로, 상태코드, 실행시간을 기록한다.

## 빌드 및 프로덕션 실행

```bash
# 빌드
npm run build --workspace=server
# 결과물: server/dist/

# 프로덕션 실행
npm run start --workspace=server
# node dist/server.js
```
