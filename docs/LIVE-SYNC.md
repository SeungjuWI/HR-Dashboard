# 실시간 연동 켜는 법 (진우님 키 수령 후)

코드는 이미 준비되어 있습니다. 아래 환경변수 3개만 등록하면 대시보드가 자동으로
실시간 모드로 전환됩니다. 등록 전까지는 기존 스냅샷으로 동작합니다 (리스크 없음).

## 1. 준비물 (진우님께 받을 것)

- 서비스 계정 키 JSON 파일 (Google Cloud에서 발급)
- 그 서비스 계정 이메일(`xxx@....iam.gserviceaccount.com`)이 **[HR] 인원_퇴직 시트에
  뷰어로 공유되어 있어야 함** — 사람 초대하듯 이메일 추가하면 끝
- 연동할 시트의 URL (주소의 `/d/` 와 `/edit` 사이 문자열이 시트 ID)

## 2. Vercel 환경변수 등록

vercel.com → HR 팀 → likelion-hr-dashboard → Settings → Environment Variables에서
Production 환경으로 3개 추가:

| 이름 | 값 |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 키 JSON의 `client_email` 값 |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | 키 JSON의 `private_key` 값 전체 (`-----BEGIN...` 부터 끝까지, 개행 그대로 붙여넣기) |
| `HR_SHEET_ID_PEOPLE` | 인원_퇴직 시트의 ID |

CLI로 하려면 (키 JSON이 `key.json`일 때):

```bash
node -e "console.log(require('./key.json').client_email)" | vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production --scope hr-5529
node -e "console.log(require('./key.json').private_key)" | vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production --scope hr-5529
echo "<시트ID>" | vercel env add HR_SHEET_ID_PEOPLE production --scope hr-5529
```

## 3. 재배포 & 확인

```bash
vercel deploy --prod --scope hr-5529
```

배포 후 로그인한 브라우저에서 `https://likelion-hr-dashboard.vercel.app/api/live-status` 접속:

- `"mode": "live"` 면 성공 — `counts`가 실제 시트 행 수와 맞는지 확인
- `"mode": "snapshot"` 이면 `envMissing`에 빠진 변수가 표시됨
- live인데 counts가 이상하면 시트 탭 이름/권한 문제 — Claude에게 결과 붙여넣고 문의

## 현재 연동 범위 (1차)

인원_퇴직 시트: 구성원 명부, 퇴사 명부(2024~2026), 월별 인원 + 조직/고용형태/근속 집계.
시트를 수정하면 **10분 안에** 대시보드에 반영됩니다.
채용 4개 파일·잡플래닛·블라인드 시트는 실제 시트 구조 확인 후 같은 방식으로 확장 예정.
