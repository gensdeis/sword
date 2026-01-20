
# ⚔️ 검 키우기 (Sword Master)

"검 키우기"는 웹 기반의 방치형 RPG 게임입니다. 사용자는 다양한 무기를 수집하고 강화하여 전투를 벌이며, 랭킹 시스템을 통해 다른 플레이어와 경쟁할 수 있습니다.

## ✨ 주요 기능

- **🗡️ 무기 시스템**: 다양한 등급과 능력치를 가진 무기를 뽑고, 강화하고, 판매할 수 있습니다.
- **⚔️ 전투 시스템**: 보유한 무기를 사용하여 상대와 자동으로 전투를 벌이고 결과를 확인합니다.
- **🎰 뽑기 (Gacha)**: 재화를 사용하여 무작위로 무기를 획득합니다.
- **🏆 시즌 및 랭킹**: 시즌제로 운영되며, 전투 결과에 따라 랭킹이 산정됩니다.
- **🎁 보상 시스템**: 출석 체크, 우편함, 기도 등 다양한 경로로 재화와 아이템을 얻을 수 있습니다.
- **👤 사용자 인증**: 회원가입 및 로그인을 통해 자신의 계정으로 게임을 즐길 수 있습니다.

## 🛠️ 기술 스택

### 프론트엔드 (Client)
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (추정)
- **API Communication**: `fetch`

### 백엔드 (Server)
- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database ORM**: [TypeORM](https://typeorm.io/)
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: [Redis](https://redis.io/)

### 데이터베이스 (Database)
- **Type**: 관계형 데이터베이스 (e.g., PostgreSQL, MySQL)
- **Schema**: `database/init.sql` 파일에 초기 스키마 정의

## 🏛️ 아키텍처

본 프로젝트는 다음과 같은 모놀리식(Monolithic) 아키텍처 기반의 풀스택 애플리케이션입니다.

1.  **Client (Next.js)**: 사용자에게 보여지는 UI를 렌더링하고, 사용자의 입력을 받아 처리합니다. 모든 비즈니스 로직 요청은 백엔드 API로 전달됩니다.
2.  **Server (NestJS)**: Client로부터 받은 요청을 처리하는 API 서버입니다. 다음과 같은 모듈화된 구조로 게임의 핵심 비즈니스 로직을 처리합니다.
    - `AuthModule`: 사용자 인증 및 인가
    - `UsersModule`: 사용자 정보 관리
    - `WeaponsModule`: 무기 관련 로직 (획득, 강화, 판매 등)
    - `GachaModule`: 무기 뽑기 로직
    - `BattleModule`: 전투 시뮬레이션 및 결과 처리
    - `SeasonModule`: 시즌 및 랭킹 관리
    - `AttendanceModule`, `MailModule`, `PrayerModule`: 각종 보상 시스템
3.  **Database**: 모든 게임 데이터(사용자 정보, 무기, 전투 기록 등)를 영구적으로 저장합니다.
4.  **Redis**: 자주 사용되는 데이터(예: 랭킹 정보)를 캐싱하여 데이터베이스 부하를 줄이고 응답 속도를 향상시킵니다.

## 🚀 시작하기

> (프로젝트 실행에 필요한 구체적인 스크립트와 환경 설정 방법은 `package.json` 파일들을 참고하여 추가해야 합니다.)

### 1. 환경 설정

- 각 `client` 및 `server` 디렉토리의 `.env.example` 파일을 복사하여 `.env` 파일을 생성하고, 필요한 환경 변수(데이터베이스 접속 정보, JWT 시크릿 등)를 설정합니다.

### 2. 백엔드 서버 실행

```bash
cd server
npm install
npm run start:dev
```

### 3. 프론트엔드 클라이언트 실행

```bash
cd client
npm install
npm run dev
```
