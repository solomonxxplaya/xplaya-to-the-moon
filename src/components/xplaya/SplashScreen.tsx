import { useEffect, useState } from "react";

const SPLASH_KEY = "xplaya:splash-seen";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY)) return;
    sessionStorage.setItem(SPLASH_KEY, "1");
    setVisible(true);
    const fade = setTimeout(() => setFading(true), 1500);
    const hide = setTimeout(() => setVisible(false), 2100);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-black transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 px-6">
        <span className="grid h-20 w-20 place-items-center rounded-2xl border border-white/15 bg-white/5 shadow-[0_0_60px_-20px_rgba(255,255,255,0.6)]">
          <span className="display-title text-5xl leading-none text-white">X</span>
        </span>
        <span className="display-title text-center text-[19vw] leading-[0.85] tracking-[0.14em] text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.35)] sm:text-[104px]">
          XPLAYA
        </span>
        <span className="h-[3px] w-40 max-w-[60vw] overflow-hidden rounded-full bg-white/15">
          <span className="block h-full w-1/3 animate-[loading_1.4s_ease-in-out_infinite] rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}
