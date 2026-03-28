# 개발 지침

## 개발 가이드 문서
- [Client 개발 가이드](docs/client.md) - Vue 3, Pinia, D3, 라우트, 상태 관리
- [Server 개발 가이드](docs/server.md) - Express, Prisma, JWT, API 엔드포인트
- [스타일 가이드](docs/style_guide.md) - CSS 변수 시스템, 색상, 폰트, 컴포넌트 패턴

## 코드 스타일
- 개발 진행 시 이모지는 사용하지 말 것
- UI 색상은 하드코딩 금지 — 반드시 `style.css`의 CSS 변수(`var(--)`)를 사용할 것
- JS/TS에서 색상이 필요한 경우 `getComputedStyle`로 CSS 변수를 읽을 것 (상세: 스타일 가이드 참고)
