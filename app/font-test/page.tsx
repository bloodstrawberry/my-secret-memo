"use client";

export default function FontTest() {
  return (
    <div className="p-20 space-y-10">
      <h1 className="text-4xl font-bold">Font Test Page</h1>
      
      <div className="space-y-2">
        <p className="text-sm text-slate-500 uppercase tracking-widest">Default Font</p>
        <p className="text-2xl">안녕하세요. 전소민체 테스트입니다. Hello World!</p>
      </div>

      <div className="space-y-2" style={{ fontFamily: "'JeonSoMin', sans-serif" }}>
        <p className="text-sm text-slate-500 uppercase tracking-widest">JeonSoMin Font (Inline Style)</p>
        <p className="text-4xl">안녕하세요. 전소민체 테스트입니다. Hello World!</p>
      </div>

      <div className="space-y-2 font-['JeonSoMin']">
        <p className="text-sm text-slate-500 uppercase tracking-widest">JeonSoMin Font (Tailwind Arbitrary Class)</p>
        <p className="text-4xl">안녕하세요. 전소민체 테스트입니다. Hello World!</p>
      </div>

      <div className="p-4 bg-slate-100 rounded">
        <p className="text-xs font-mono">Current font path: /fonts/jeonsomin.ttf</p>
      </div>
    </div>
  );
}
