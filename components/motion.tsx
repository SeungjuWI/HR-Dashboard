"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* 스크롤 진입 시 .in 클래스를 붙여 CSS 애니메이션을 트리거한다 */
export function Reveal({
  children,
  className = "",
  delay,
  grow,
  id,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  grow?: boolean;
  id?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            node.classList.add("in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      id={id}
      className={`rv${grow ? " grow" : ""} ${className}`.trim()}
      style={{ ...(delay ? { transitionDelay: `${delay}s` } : {}), ...style }}
    >
      {children}
    </div>
  );
}

export function CountUp({ value, dec = 0 }: { value: number; dec?: number }) {
  const fmt = (v: number) =>
    v.toLocaleString("ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const ref = useRef<HTMLSpanElement>(null);
  // 서버 렌더·hydration 시점에는 최종 값을 그대로 둔다 — JS가 안 돌아도 숫자가 보인다.
  const [display, setDisplay] = useState(() => fmt(value));
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(fmt(value));
      return;
    }
    setDisplay(fmt(0));
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        let t0: number | null = null;
        const DUR = 1100;
        const step = (ts: number) => {
          if (t0 === null) t0 = ts;
          const p = Math.min((ts - t0) / DUR, 1);
          const e = 1 - Math.pow(1 - p, 3);
          setDisplay(fmt(value * e));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dec]);
  return <span ref={ref}>{display}</span>;
}

/* data-tip 속성을 가진 .hit 요소의 툴팁.
   마우스는 커서를 따라가고, 키보드 포커스·터치는 요소 위쪽에 고정해서 띄운다.
   차트마다 tabIndex를 달지 않아도 되도록, 여기서 .hit[data-tip]에 일괄로 부여한다. */
export function Tooltip() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tip = ref.current;
    if (!tip) return;

    const hit = (t: EventTarget | null) =>
      (t as Element)?.closest?.(".hit") as HTMLElement | null;

    const show = (h: HTMLElement) => {
      if (!h.dataset.tip) return;
      tip.innerHTML = h.dataset.tip;
      tip.classList.add("on");
    };
    const hide = () => tip.classList.remove("on");
    const at = (x: number, y: number) => {
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    };
    /* 요소 위쪽 가운데 — 포커스/터치용 고정 위치 */
    const atElement = (h: HTMLElement) => {
      const r = h.getBoundingClientRect();
      at(r.left + r.width / 2, r.top);
    };

    const over = (e: MouseEvent) => {
      const h = hit(e.target);
      if (h) show(h);
    };
    const move = (e: MouseEvent) => {
      if (tip.classList.contains("on")) at(e.clientX, e.clientY);
    };
    const out = (e: MouseEvent) => {
      if (hit(e.target)) hide();
    };
    const focusIn = (e: FocusEvent) => {
      const h = hit(e.target);
      if (!h) return;
      atElement(h);
      show(h);
    };
    const touch = (e: TouchEvent) => {
      const h = hit(e.target);
      if (!h) return hide();
      atElement(h);
      show(h);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };

    /* 툴팁이 달린 요소를 탭 순서에 넣는다 (차트는 나중에 그려질 수 있어 감시) */
    const makeFocusable = (root: ParentNode) =>
      root.querySelectorAll?.(".hit[data-tip]:not([tabindex])").forEach((el) => {
        el.setAttribute("tabindex", "0");
      });
    makeFocusable(document);
    const mo = new MutationObserver(() => makeFocusable(document));
    mo.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("mouseover", over);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseout", out);
    document.addEventListener("focusin", focusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("touchstart", touch, { passive: true });
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      mo.disconnect();
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseout", out);
      document.removeEventListener("focusin", focusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("touchstart", touch);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", hide);
    };
  }, []);
  return <div ref={ref} className="tip" role="status" aria-live="polite" />;
}
