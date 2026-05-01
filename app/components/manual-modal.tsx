"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { DockviewReact, DockviewReadyEvent } from "dockview";
import "dockview/dist/styles/dockview.css";

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MiniDockview = () => {
  const onReady = (event: DockviewReadyEvent) => {
    event.api.addPanel({
      id: "panel_1",
      component: "default",
      title: "　Memo 1",
    });
    event.api.addPanel({
      id: "panel_2",
      component: "default",
      title: "　Memo 2",
      position: { referencePanel: "panel_1", direction: "right" },
    });
    event.api.addPanel({
      id: "panel_3",
      component: "default",
      title: "　Memo 3",
      position: { referencePanel: "panel_1", direction: "below" },
    });
  };

  return (
    <div className="w-full h-full dockview-theme-memo opacity-90">
      <DockviewReact
        onReady={onReady}
        components={{
          default: (props) => (
            <div className="p-4 h-full bg-[var(--panel-bg)] text-[10px] opacity-60 font-mono overflow-hidden">
              <div className="space-y-2">
                <div className="h-2 w-20 bg-slate-500/20 rounded" />
                <div className="h-2 w-32 bg-slate-500/10 rounded" />
                <div className="h-2 w-24 bg-slate-500/10 rounded" />
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
};

const FeatureCard = ({ icon, title, description, colorClass, iconColor }: { icon: string, title: string, description: React.ReactNode, colorClass: string, iconColor: string }) => (
  <div className={`p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] hover:shadow-xl transition-all duration-300 group`}>
    <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center mb-4 shadow-lg`}>
      <Icon icon={icon} className={`w-6 h-6 ${iconColor}`} />
    </div>
    <h4 className="text-lg font-bold mb-2 text-[var(--foreground)]">{title}</h4>
    <p className="text-sm text-[var(--foreground)] opacity-60 leading-relaxed">
      {description}
    </p>
  </div>
);

const MockHeaderAction = ({ icon, title, active = false, color = "text-cyan-500" }: { icon: string, title: string, active?: boolean, color?: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-slate-500/5 group">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-cyan-500/20 ' + color : 'bg-slate-500/10 text-slate-400 group-hover:text-[var(--foreground)]'}`}>
      <Icon icon={icon} className="w-5 h-5" />
    </div>
    <span className="text-xs font-bold opacity-70 group-hover:opacity-100">{title}</span>
  </div>
);

export default function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 md:p-8"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[85vw] h-full max-h-[90vh] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

              {/* Header */}
              <div className="px-8 py-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--header-bg)]/50 backdrop-blur-md relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Icon icon="mdi:book-open-variant" className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-[var(--foreground)] uppercase">User Manual</h2>
                    <p className="text-[10px] text-cyan-500 font-bold tracking-[0.2em] uppercase opacity-80 mt-0.5">My Secret Memo Guide</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-500/10 transition-all text-[var(--foreground)] opacity-40 hover:opacity-100 hover:rotate-90 duration-300"
                >
                  <Icon icon="mdi:close" className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar relative z-10">
                <div className="max-w-full mx-auto space-y-16">

                  {/* Introduction */}
                  <section className="text-center space-y-4">
                    <h3 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight">
                      당신의 비밀스러운 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">메모장</span>
                    </h3>
                    <p className="text-base text-[var(--foreground)] opacity-60 max-w-3xl mx-auto leading-relaxed">
                      My Secret Memo는 중요한 정보와 일정을 안전하게 관리하는 <strong>보안 중심 작업 공간</strong>입니다.<br className="hidden md:block" />
                      모든 데이터는 브라우저 내부(IndexedDB)에만 저장되어 외부로 절대 유출되지 않습니다.
                    </p>
                  </section>

                  {/* Core Panels */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-cyan-500 rounded-full" />
                      <h3 className="text-xl font-bold text-[var(--foreground)]">강력한 편집 도구</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FeatureCard
                        icon="mdi:file-document-outline"
                        title="메모장"
                        description={<>Markdown 지원 에디터로<br />자유로운 문서 작성이 가능합니다.</>}
                        colorClass="bg-cyan-500/10"
                        iconColor="text-cyan-500"
                      />
                      <FeatureCard
                        icon="mdi:format-list-checks"
                        title="TO-DO LIST"
                        description={<>드래그 앤 드롭으로 할 일 순서를<br />유연하게 관리하고 체크하세요.</>}
                        colorClass="bg-emerald-500/10"
                        iconColor="text-emerald-500"
                      />
                      <FeatureCard
                        icon="mdi:google-spreadsheet"
                        title="스프레드시트"
                        description={<>엑셀 스타일의 그리드로<br />표 형식의 데이터를 정리하세요.</>}
                        colorClass="bg-green-500/10"
                        iconColor="text-green-500"
                      />
                    </div>
                  </section>

                  {/* Layout & Workspace */}
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                        <h3 className="text-xl font-bold text-[var(--foreground)]">자유로운 레이아웃</h3>
                      </div>
                      <p className="text-sm text-[var(--foreground)] opacity-60 leading-relaxed">
                        Dockview 시스템을 통해 화면을 원하는 대로 분할하고 배치할 수 있습니다.<br />
                        탭을 드래그하여 위치를 옮기거나, 경계선을 조절해 보세요.<br />
                        설정된 레이아웃은 브라우저를 닫아도 자동으로 저장됩니다.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <MockHeaderAction icon="material-symbols:expand-content" title="전체 화면" />
                        <MockHeaderAction icon="material-symbols:close" title="패널 닫기" />
                      </div>
                    </div>
                    <div className="p-2 rounded-none bg-slate-500/5 border border-[var(--border-color)] aspect-video flex flex-col relative overflow-hidden shadow-inner">
                      <div className="flex-1 rounded-none overflow-hidden border border-[var(--border-color)] bg-[var(--background)]">
                        <MiniDockview />
                      </div>
                      <div className="absolute inset-0 pointer-events-none border-[8px] border-slate-500/5 rounded-none" />
                    </div>
                  </section>

                  {/* Security Features */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-red-500 rounded-full" />
                      <h3 className="text-xl font-bold text-[var(--foreground)]">보안 및 개인정보 보호</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-4">
                          <h4 className="text-base font-bold flex items-center gap-2 text-red-500">
                            <Icon icon="mdi:lock-outline" /> 탭별 암호화 잠금
                          </h4>
                          <p className="text-sm opacity-70 leading-relaxed">
                            개별 탭을 비밀번호로 암호화할 수 있습니다.<br />
                            암호화된 탭은 비밀번호 입력 없이는<br />
                            내용을 절대 볼 수 없습니다.
                          </p>
                          <div className="flex gap-2">
                            <MockHeaderAction icon="material-symbols:visibility-outline" title="공개 상태" />
                            <MockHeaderAction icon="material-symbols:visibility-off-outline" title="암호화 잠금" active color="text-red-500" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                          <h4 className="text-base font-bold flex items-center gap-2 text-amber-500">
                            <Icon icon="mdi:shield-sync-outline" /> 자동 잠금 (Auto Lock)
                          </h4>
                          <p className="text-sm opacity-70 leading-relaxed">
                            설정에서 활성화 시, <strong>앱 재접속 시</strong><br />
                            자동으로 모든 데이터가 잠깁니다.<br />
                            철저한 보안을 위한 필수 기능입니다.
                          </p>
                          <div className="flex gap-2">
                            <MockHeaderAction icon="mdi:cog-outline" title="환경 설정" />
                            <MockHeaderAction icon="mdi:lock-reset" title="재접속 시 잠금" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>


                  {/* Data Management */}
                  <section className="space-y-8 pb-12">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                      <h3 className="text-xl font-bold text-[var(--foreground)]">데이터 이력 및 백업</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                          <Icon icon="mdi:history" className="w-6 h-6 text-cyan-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold mb-2">히스토리 캘린더</h4>
                          <p className="text-sm opacity-60 leading-relaxed">
                            매일의 데이터가 자동으로 스냅샷으로 저장됩니다.<br />
                            과거 특정 날짜의 기록을 언제든지 조회하고 복원하세요.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Icon icon="mdi:file-export-outline" className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold mb-2">내보내기 / 가져오기</h4>
                          <p className="text-sm opacity-60 leading-relaxed">
                            전체 데이터를 JSON 파일 형태로 백업하세요.<br />
                            다른 기기에서도 동일한 환경을 유지할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-[var(--border-color)] bg-[var(--header-bg)]/30 backdrop-blur-md flex items-center justify-center text-[10px] text-[var(--foreground)] opacity-30 font-bold tracking-widest uppercase relative z-10">
                &copy; 2026 My Secret Memo &bull; Security First Workspace
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
