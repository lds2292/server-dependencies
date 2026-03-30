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