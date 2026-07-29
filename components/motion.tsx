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
  const [display, setDisplay] = useState(fmt(0));
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(fmt(value));
      return;
    }
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

/* data-tip 속성을 가진 .hit 요소에 마우스를 올리면 따라다니는 툴팁 */
export function Tooltip() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tip = ref.current;
    if (!tip) return;
    const over = (e: MouseEvent) => {
      const h = (e.target as Element).closest?.(".hit") as HTMLElement | null;
      if (!h || !h.dataset.tip) return;
      tip.innerHTML = h.dataset.tip;
      tip.classList.add("on");
    };
    const move = (e: MouseEvent) => {
      if (!tip.classList.contains("on")) return;
      tip.style.left = `${e.clientX}px`;
      tip.style.top = `${e.clientY}px`;
    };
    const out = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(".hit")) tip.classList.remove("on");
    };
    document.addEventListener("mouseover", over);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseout", out);
    return () => {
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseout", out);
    };
  }, []);
  return <div ref={ref} className="tip" role="status" />;
}
