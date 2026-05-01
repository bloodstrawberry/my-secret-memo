# My Secret Memo

개인의 중요한 정보와 일정, 데이터 등을 안전하게 관리할 수 있는 **보안 중심의 다목적 개인용 작업 공간** 입니다.   
Next.js 기반으로 구축되었으며, 브라우저 내에 데이터를 안전하게 보관합니다.

- **GitHub Pages**: [https://bloodstrawberry.github.io/my-secret-memo/](https://bloodstrawberry.github.io/my-secret-memo/)
- **Vercel**: [https://my-secret-memo.vercel.app/](https://my-secret-memo.vercel.app/)

https://github.com/user-attachments/assets/dfc32e42-6884-4b73-b49e-cfde98b62531

## ✨ 주요 기능 (Key Features)

### 🔒 암호화 기능 및 자동 암호화 (Security & Auto-Encryption)
- 사용자가 설정한 비밀번호를 통해 전체 데이터를 안전하게 **암호화(Encryption)** 및 **복호화(Decryption)** 합니다.
- **자동 잠금(Auto Lock)** 기능을 지원하여, 애플리케이션 접속 시 자동으로 세션을 잠그고 안전하게 데이터를 보호합니다.
- 개별 탭마다 잠금(Lock)을 설정할 수 있어, 민감한 정보가 있는 메모나 시트만 선택적으로 보호할 수 있습니다.

### 📝 메모장, TO-DO LIST, SPREADSHEET
사용자의 필요에 따라 원하는 형태의 데이터를 관리할 수 있습니다:
- **메모장 (Markdown Editor)** : 텍스트 포맷팅, 이미지 첨부, 코드 블록 하이라이팅을 지원하는 강력한 텍스트 에디터.
- **TO-DO LIST** : 드래그 앤 드롭으로 작업 순서를 유연하게 변경하고, 체크박스로 진행 상태를 확인할 수 있는 할 일 관리.
- **SPREADSHEET (스프레드시트)** : 엑셀과 유사한 그리드 인터페이스를 제공, 표 형태의 데이터 정리 및 관리가 가능.

### 🧩 Dockview를 활용한 자유로운 레이아웃 설정
- **Dockview 라이브러리** 를 기반으로 화면을 원하는 대로 창 분할, 탭 이동, 리사이징할 수 있습니다.
- 자신이 원하는 패널을 **제한 없이 자유롭게 추가** 하고 본인만의 작업 환경 레이아웃으로 커스터마이징이 가능합니다.
- 설정한 레이아웃과 탭의 위치는 데이터와 함께 자동으로 로컬에 저장, 새로고침 후에도 사용하던 환경을 그대로 제공합니다.

### 💾 로컬 기반 저장 및 이력 관리 (Local-First & History)
- 서버에 데이터를 보내지 않고 오로지 브라우저 로컬 환경 내에 데이터를 저장합니다.
- **데이터 백업 및 복원** : 모든 작성 내용과 레이아웃 설정, 이력까지 JSON 형태로 다운로드하고 언제든지 업로드 할 수 있습니다.
- **히스토리 캘린더** : 매일의 데이터 상태를 스냅샷으로 백업하여, 달력에서 과거의 기록을 쉽게 조회할 수 있습니다.

### 🌓 직관적인 테마 지원
- 눈의 피로를 덜어주는 **다크 모드(Dark Mode)** 와 **라이트 모드(Light Mode)** 전환을 지원합니다.
- 각종 사용자 편의를 위한 시각적 토글 및 세팅 환경을 지원합니다.

---

<img width="1821" height="2671" alt="manual" src="https://github.com/user-attachments/assets/69e1fc79-5e30-4a65-8d66-deb2431fd219" />

---

## 🚀 시작하기 (Getting Started)

이 프로젝트는 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)으로 생성된 [Next.js](https://nextjs.org) 프로젝트입니다.

### 설치 및 실행

1. 패키지 설치:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. 개발 서버 실행:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 실행된 앱을 확인하세요.

## 🛠 기술 스택 (Tech Stack)
- **Framework**: Next.js 15, React 19
- **Layout & Drag**: Dockview, dnd-kit
- **Editor**: TipTap (WYSIWYG/Markdown)
- **Spreadsheet**: Fortune Sheet
- **Database**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS, Material UI (MUI), Framer Motion
- **State Management**: Zustand
