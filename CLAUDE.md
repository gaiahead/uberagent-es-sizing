# uberAgent ES Sizing Calculator — Task Spec

## 변경 요청: 툴팁(ℹ️) 패널 경계 클리핑 수정

### 배경
`Tooltip` 컴포넌트가 `position: absolute`로 구현되어 있어 부모 패널의 `overflow` 설정에 의해 잘리는 문제가 있음.

### 클리핑 발생 원인
- 좌측 패널: `lg:overflow-y-auto lg:max-h-[calc(100vh-5rem)]` (스크롤 컨테이너)
- `NodeGroupCard`: `overflow-hidden` 적용됨
- `ILMStoragePanel`: 동일한 스크롤 컨테이너 내부

### 영향 범위 (총 14개 Tooltip 인스턴스)
| 컴포넌트 | 인스턴스 수 | 클리핑 위험 |
|---|---|---|
| EndpointProfileCard | 12개 (ParamRow마다) | ⚠️ 스크롤 컨테이너 내부 |
| NodeGroupCard | 7개 | ⚠️ overflow-hidden + 스크롤 컨테이너 |
| ILMStoragePanel | 5개 | ⚠️ 스크롤 컨테이너 내부 |

### 해결 방법
`position: fixed` + `getBoundingClientRect()` 기반 동적 좌표 계산으로 교체.

**구현 내용 (`src/components/Tooltip.tsx`):**
- `position: fixed`로 렌더링 → 부모 overflow 완전 무시
- 버튼 위치를 `getBoundingClientRect()`로 실시간 계산
- 좌우 뷰포트 이탈 시 정렬 방향 자동 전환 (center ↔ left ↔ right)
- 화살표 위치도 정렬에 맞춰 조정
- 스크롤/리사이즈 이벤트 시 위치 재계산
- `pointer-events: none` 적용으로 hover 이벤트 가로채기 방지

### 상태
- [x] Tooltip.tsx 수정 완료
- [x] 빌드 확인 (TypeScript 에러 없음)
- [x] 브라우저 시각 테스트 완료
  - 좌측 패널 내부 (left align): 정상 표시, 잘림 없음
  - 우측 버튼 (right align): 자동 전환 정상 작동
  - position: fixed 기반 로직 뷰포트 780px 기준 검증 완료

---

## 변경 요청: 레플리카 입력 방식 변경

### 배경
현재 ILM 스토리지 설정의 레플리카 샤드 수는 `0` 또는 `1` 두 값만 선택하는 토글 버튼으로 구현되어 있다.
실제 Elasticsearch 운영 환경에서는 레플리카를 2 이상으로 설정하는 경우도 있으므로,
자유롭게 숫자를 입력할 수 있는 입력 필드로 교체한다.

### 변경 파일 목록

1. **`src/lib/types.ts`**
   - `TierConfig.replica` 타입: `0 | 1` → `number`
   - `createDefaultStorage()` 기본값:
     - `hot.replica`: 1 (유지)
     - `warm.replica`: 1 (유지)
     - `cold.replica`: 1 (유지)
     - `frozen.replica`: 0 (유지)

2. **`src/components/ILMStoragePanel.tsx`**
   - 레플리카 컬럼 렌더링: 0/1 버튼 토글 → `NumberInput` 컴포넌트로 교체
   - `handleTierReplica` 시그니처: `value: 0 | 1` → `value: number`
   - min=0, step=1 정수 입력, 음수 불허
   - 레이아웃: 기존 grid 컬럼 너비(`72px`) 유지 또는 적절히 조정

3. **`src/lib/calculator.ts`**
   - 변경 불필요 (이미 `(1 + storage.hot.replica)` 형태로 숫자를 그대로 사용)

### 기대 동작
- 레플리카 입력 필드에서 0, 1, 2 등 임의의 정수 입력 가능
- 기본값: hot=1, warm=1, cold=1, frozen=0
- 음수 입력 시 0으로 보정
- 빈칸 허용 (onBlur 시에도 빈칸 유지 가능, 계산 시 0으로 처리)
