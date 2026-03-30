# Terraform / IaC Import 기능

## 개요
Terraform 등 IaC(Infrastructure as Code) 도구의 state 파일을 파싱하여 서비스에 노드/의존성을 자동으로 import하는 기능.

## 배경
현재 모든 노드를 수동으로 등록해야 하므로 초기 데이터 입력 비용이 높다. IaC state 파일을 활용하면 기존 인프라를 빠르게 시각화할 수 있다.

## 지원 대상 (우선순위)

| 순위 | 도구 | 파싱 대상 | 난이도 |
|------|------|----------|--------|
| 1 | Terraform / OpenTofu | tfstate JSON | 중 |
| 2 | AWS CloudFormation | JSON/YAML 템플릿 + 스택 리소스 | 중 |
| 3 | Pulumi | state JSON | 중 |
| 4 | Ansible | 인벤토리 파일 (YAML/INI) | 하 (의존성 추론 어려움) |

## 리소스 타입 -> 노드 타입 매핑 (Terraform 기준)

| Terraform 리소스 | 노드 타입 |
|-----------------|----------|
| aws_instance, aws_ecs_service, aws_ecs_task_definition | Server |
| aws_lb, aws_alb, aws_elb | L7 |
| aws_rds_cluster, aws_elasticache_cluster, aws_dynamodb_table | Infra |
| aws_route53_record | DNS |
| 외부 API endpoint | External |

## 의존성 추론
- security_group_rule의 source/target으로 네트워크 연결 관계 추론
- IAM role/policy로 서비스 간 접근 관계 추론
- 명시적 depends_on 참조

## 구현 방식 (안)
1. 클라이언트 파일 업로드 (tfstate JSON) -> 프론트엔드 파싱 -> importJSON 형태로 변환
2. 서버 연동 (Terraform Cloud API / S3 backend) -> 주기적 동기화

## 고려사항
- tfstate에 민감 정보(DB 비밀번호 등) 포함 가능 -> 파싱 시 필터링 필수
- 멀티 클라우드(AWS/GCP/Azure) 리소스 타입 차이
- state 파일에 의존 관계가 명시적이지 않은 경우 보안 그룹 규칙으로 추론 필요

---

## 현재 구현 상태 (v1 - Beta)
- 클라이언트 파일 업로드 방식 (`terraform state pull > state.json` 추출 후 업로드)
- AWS 17종 리소스 매핑, depends_on 기반 의존성 추론
- 민감 정보 감지 경고, 브라우저 전용 처리 (서버 미전송)

---

## 향후 로드맵

### Phase 2: 원격 State 연동
tfstate 파일을 수동으로 추출/업로드하는 대신 원격 backend에서 직접 가져오기.

| 방식 | 설명 | 필요 작업 |
|------|------|----------|
| **Terraform Cloud API** | workspace ID + API 토큰으로 state 조회 | 서버 프록시 필요 (CORS), API 토큰 암호화 저장 |
| **S3 Backend** | AWS 자격증명으로 S3의 tfstate 직접 읽기 | 서버 프록시 + AWS SDK 연동 |
| **OpenTofu** | Terraform Cloud와 동일 포맷, 호환 가능 | 추가 작업 없음 (동일 파서 사용) |

### Phase 3: HCL 파싱 (.tf 파일 직접 읽기)
tfstate(실제 배포 상태)가 아닌 .tf 소스 파일(의도된 구성)을 파싱.

- **장점**: state pull 없이 git 저장소의 .tf 파일로 즉시 시각화 가능
- **단점**: HCL 파서 필요 (JavaScript용 HCL 파서 라이브러리 사용), 실제 IP/endpoint 정보 없음 (변수 참조만 존재)
- **적합한 용도**: 인프라 설계 단계에서 구조 시각화 (운영 정보 없이 관계만 파악)

### Phase 4: 다른 IaC 도구 지원

| 도구 | 파싱 대상 | 비고 |
|------|----------|------|
| AWS CloudFormation | 스택 리소스 JSON (aws cloudformation describe-stack-resources) | AWS 전용, 리소스 타입 매핑은 Terraform과 유사 |
| Pulumi | state JSON (pulumi stack export) | 구조가 Terraform과 다르지만 리소스 타입은 동일 (AWS provider) |
| Ansible | 인벤토리 파일 (YAML/INI) | 호스트 목록만 추출 가능, 의존성 추론 어려움 |

### Phase 5: 자동 동기화
수동 import가 아닌 주기적 자동 동기화로 그래프를 최신 상태로 유지.

- 연결된 backend에서 변경 감지 시 diff 계산
- 추가/삭제/변경된 리소스를 자동 반영 또는 알림
- 충돌 해결: 수동 수정된 노드 vs state 변경