/* SVG 차트 — 순수 렌더 컴포넌트. 등장 애니메이션은 부모의 .grow.in + globals.css가 담당 */

const C = {
  o: "var(--c1)",
  od: "var(--accent-deep)",
  b: "var(--c2)",
  t: "var(--c3)",
  v: "var(--c4)",
  m: "var(--c5)",
  mut: "var(--muted-bar)",
};
const num = (v: number) => v.toLocaleString("ko-KR");

export function Spark({ data, color = C.o }: { data: number[]; color?: string }) {
  const W = 150, H = 34, P = 3;
  const min = Math.min(...data);
  const max = Math.max(...data) === min ? min + 1 : Math.max(...data);
  const pts = data.map((v, i) => [
    P + (i * (W - 2 * P)) / (data.length - 1),
    H - P - ((v - min) / (max - min)) * (H - 2 * P),
  ]);
  const d = `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")}`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={`${d} L${W - P} ${H - 1} L${P} ${H - 1} Z`} fill={color} opacity={0.1} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="ln" pathLength={1} />
      <circle cx={last[0]} cy={last[1]} r={3.2} fill={color} stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}

export function VBars({
  labels, data, w, h, color = C.o, unit = "", label,
}: {
  labels: string[]; data: number[]; w: number; h: number; color?: string; unit?: string; label: string;
}) {
  const padB = 26, padT = 22, padL = 8, padR = 8;
  const max = Math.max(...data) * 1.08;
  const slot = (w - padL - padR) / data.length;
  const bw = Math.min(slot * 0.52, 54);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {data.map((v, i) => {
        const x = padL + slot * i + (slot - bw) / 2;
        const bh = (h - padT - padB) * (v / max);
        const y = h - padB - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx={4} fill={color} className="bar-v hit"
              style={{ transitionDelay: `${0.08 * i}s` }} data-tip={`${labels[i]} · <b>${num(v)}${unit}</b>`} />
            <rect x={x} y={h - padB - 2} width={bw} height={2} fill={color} />
            <text x={x + bw / 2} y={y - 7} className="val fade" textAnchor="middle">{num(v)}</text>
            <text x={x + bw / 2} y={h - 8} className="axis" textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
      <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} className="gridln" />
    </svg>
  );
}

export function HBars({
  rows, w, h, labW = 150, color = C.o, unit = "", focus, fmt = num, label,
}: {
  rows: [string, number][]; w: number; h: number; labW?: number; color?: string;
  unit?: string; focus?: string; fmt?: (v: number) => string; label: string;
}) {
  const padR = 44, padT = 6;
  const max = Math.max(...rows.map((r) => r[1]));
  const rh = (h - padT) / rows.length;
  const bh = Math.min(rh * 0.5, 18);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {rows.map(([name, v], i) => {
        const y = padT + rh * i + (rh - bh) / 2;
        const bwp = (w - labW - padR) * (v / max);
        const isFocus = !focus || name === focus;
        const fill = focus ? (isFocus ? C.o : C.mut) : color;
        return (
          <g key={name + i}>
            <text x={labW - 10} y={y + bh / 2 + 4} className={focus && isFocus ? "val" : "lab"} textAnchor="end">{name}</text>
            <rect x={labW} y={y} width={bwp} height={bh} rx={4} fill={fill} className="bar-h hit"
              style={{ transitionDelay: `${0.05 * i}s` }} data-tip={`${name} · <b>${num(v)}${unit}</b>`} />
            <text x={labW + bwp + 8} y={y + bh / 2 + 4} className="val fade" textAnchor="start">{fmt(v)}</text>
          </g>
        );
      })}
      <line x1={labW} y1={padT} x2={labW} y2={h - 2} className="gridln" />
    </svg>
  );
}

export function Donut({ rows, label }: { rows: [string, number, string][]; label: string }) {
  const cx = 110, cy = 92, R = 64, SW = 26;
  const total = rows.reduce((s, r) => s + r[1], 0);
  let a0 = -Math.PI / 2;
  const arcs = rows.map(([name, v, color], i) => {
    const frac = v / total;
    const a1 = a0 + frac * Math.PI * 2;
    const gap = 0.028;
    const s = a0 + gap / 2, e = a1 - gap / 2;
    const large = e - s > Math.PI ? 1 : 0;
    const d = `M${(cx + R * Math.cos(s)).toFixed(1)} ${(cy + R * Math.sin(s)).toFixed(1)} A${R} ${R} 0 ${large} 1 ${(cx + R * Math.cos(e)).toFixed(1)} ${(cy + R * Math.sin(e)).toFixed(1)}`;
    a0 = a1;
    return { name, v, color, d, pct: Math.round(frac * 100), i };
  });
  return (
    <svg viewBox="0 0 220 190" role="img" aria-label={label}>
      {arcs.map((a) => (
        <path key={a.name} d={a.d} fill="none" stroke={a.color} strokeWidth={SW} className="hit fade"
          style={{ transitionDelay: `${0.15 * a.i + 0.2}s` }}
          data-tip={`${a.name} · <b>${a.v}명</b> (${a.pct}%)`} />
      ))}
      <text x={cx} y={cy - 2} className="val big" textAnchor="middle">{total}</text>
      <text x={cx} y={cy + 16} className="lab" textAnchor="middle">명</text>
    </svg>
  );
}

export function NetBars({ labels, data, w, h, label }: { labels: string[]; data: number[]; w: number; h: number; label: string }) {
  const padL = 8, padR = 8, padT = 20, padB = 26;
  const max = Math.max(...data.map(Math.abs)) * 1.15;
  const zero = padT + (h - padT - padB) / 2;
  const slot = (w - padL - padR) / data.length;
  const bw = Math.min(slot * 0.42, 48);
  const scale = (h - padT - padB) / (max * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <line x1={padL} y1={zero} x2={w - padR} y2={zero} stroke="var(--ink2)" strokeWidth={1} />
      {data.map((v, i) => {
        const x = padL + slot * i + (slot - bw) / 2;
        const bh = Math.max(Math.abs(v) * scale, 3);
        const pos = v >= 0;
        const y = pos ? zero - bh : zero;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx={4} fill={pos ? C.o : C.b} className="bar-v hit"
              style={{ transitionDelay: `${0.08 * i}s`, ...(pos ? {} : { transformOrigin: "top" }) }}
              data-tip={`${labels[i]} · <b>${v > 0 ? "+" : ""}${v}명</b>`} />
            <text x={x + bw / 2} y={pos ? y - 7 : y + bh + 13} className="val fade" textAnchor="middle">{v > 0 ? `+${v}` : v}</text>
            <text x={x + bw / 2} y={h - 8} className="axis" textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function RatingLine({
  years, series, label,
}: {
  years: string[];
  series: { name: string; data: (number | null)[]; color: string }[];
  label: string;
}) {
  const W = 520, H = 210, padL = 30, padR = 86, padT = 14, padB = 26;
  const yMin = 1, yMax = 5;
  const X = (i: number) => padL + (i * (W - padL - padR)) / (years.length - 1);
  const Y = (v: number) => padT + (H - padT - padB) * (1 - (v - yMin) / (yMax - yMin));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((g) => (
        <g key={g}>
          <line x1={padL} y1={Y(g)} x2={W - padR} y2={Y(g)} className="gridln" />
          <text x={padL - 8} y={Y(g) + 3.5} className="axis" textAnchor="end">{g}.0</text>
        </g>
      ))}
      {years.map((y, i) => (
        <text key={y} x={X(i)} y={H - 8} className="axis" textAnchor="middle">{y}</text>
      ))}
      {series.map((s) => {
        const pts = s.data
          .map((v, i) => (v == null ? null : { x: X(i), y: Y(v), v, yr: years[i] }))
          .filter((p): p is NonNullable<typeof p> => p !== null);
        const d = `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L")}`;
        const last = pts[pts.length - 1];
        return (
          <g key={s.name}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="ln" pathLength={1} />
            {pts.map((p) => (
              <g key={p.yr}>
                <circle cx={p.x} cy={p.y} r={3.5} fill={s.color} stroke="#fff" strokeWidth={1.5} className="fade" />
                <circle cx={p.x} cy={p.y} r={12} fill="transparent" className="hit" data-tip={`${s.name} ${p.yr} · <b>${p.v.toFixed(2)}</b>`} />
              </g>
            ))}
            <text x={last.x + 10} y={last.y + 4} className="val fade" textAnchor="start" fill={s.color === C.o ? C.od : s.color} style={{ fill: s.color === C.o ? "var(--accent-deep)" : s.color }}>
              {s.name} {last.v.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* 그룹당 한 줄 누적 가로바 — 길이는 총량, 구간은 구성비 */
export function StackedHBars({
  groups, colorMap, w, h, labW = 56, label,
}: {
  groups: { name: string; rows: [string, number][] }[];
  colorMap: Record<string, string>;
  w: number; h: number; labW?: number; label: string;
}) {
  const padR = 52, padT = 6;
  const max = Math.max(...groups.map((g) => g.rows.reduce((s, r) => s + r[1], 0)));
  const rh = (h - padT) / groups.length;
  const bh = Math.min(rh * 0.5, 20);
  const scale = (w - labW - padR) / max;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {groups.map((g, gi) => {
        const y = padT + rh * gi + (rh - bh) / 2;
        const total = g.rows.reduce((s, r) => s + r[1], 0);
        let x = labW;
        return (
          <g key={g.name}>
            <text x={labW - 10} y={y + bh / 2 + 4} className="lab" textAnchor="end">{g.name}</text>
            {g.rows.map(([cat, v]) => {
              const bw = Math.max(v * scale - 2, 1);
              const seg = (
                <rect key={cat} x={x} y={y} width={bw} height={bh} rx={3}
                  fill={colorMap[cat] ?? "var(--muted-bar)"} className="bar-h hit"
                  style={{ transitionDelay: `${0.07 * gi}s` }}
                  data-tip={`${g.name} ${cat} · <b>${num(v)}건</b> (${Math.round((v / total) * 100)}%)`} />
              );
              x += v * scale;
              return seg;
            })}
            <text x={x + 8} y={y + bh / 2 + 4} className="val fade" textAnchor="start">{num(total)}</text>
          </g>
        );
      })}
      <line x1={labW} y1={padT} x2={labW} y2={h - 2} className="gridln" />
    </svg>
  );
}

/* 월 단위 촘촘한 막대 — x축 라벨은 분기마다, 최대값에만 직접 라벨 */
export function MonthlyBars({
  rows, w, h, color = C.o, unit = "명", label,
}: {
  rows: [string, number][]; w: number; h: number; color?: string; unit?: string; label: string;
}) {
  const padB = 26, padT = 16, padL = 8, padR = 8;
  const max = Math.max(...rows.map((r) => r[1]), 1) * 1.1;
  const slot = (w - padL - padR) / rows.length;
  const bw = Math.max(Math.min(slot * 0.62, 26), 4);
  const maxV = Math.max(...rows.map((r) => r[1]));
  const maxIdx = rows.findIndex((r) => r[1] === maxV);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {rows.map(([m, v], i) => {
        const x = padL + slot * i + (slot - bw) / 2;
        const bh = (h - padT - padB) * (v / max);
        const y = h - padB - bh;
        const isMax = i === maxIdx;
        return (
          <g key={m}>
            <rect x={x} y={y} width={bw} height={Math.max(bh, v > 0 ? 2 : 0)} rx={2.5}
              fill={color} className="bar-v hit" style={{ transitionDelay: `${0.03 * i}s` }}
              data-tip={`20${m} · <b>${num(v)}${unit}</b>`} />
            {isMax && <text x={x + bw / 2} y={y - 6} className="val fade" textAnchor="middle">{v}</text>}
            {i % 3 === 0 && <text x={x + bw / 2} y={h - 8} className="axis" textAnchor="middle">{m}</text>}
          </g>
        );
      })}
      <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} className="gridln" />
    </svg>
  );
}

/* 자동 y-도메인 추세선 — 현원·퇴직률·평점처럼 0에서 멀리 떨어진 값의 변화를 보여줄 때 */
export function TrendLine({
  points, w, h, color = C.o, unit = "", dec = 0, label,
}: {
  points: [string, number][]; w: number; h: number; color?: string; unit?: string; dec?: number; label: string;
}) {
  const padL = 38, padR = 16, padT = 14, padB = 24;
  if (points.length === 0) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
        <text x={w / 2} y={h / 2} className="axis" textAnchor="middle">데이터 없음</text>
      </svg>
    );
  }
  const vals = points.map((p) => p[1]);
  const rawMin = Math.min(...vals), rawMax = Math.max(...vals);
  const span = rawMax - rawMin || Math.abs(rawMax) * 0.1 || 1;
  const min = rawMin - span * 0.18, max = rawMax + span * 0.18;
  const X = (i: number) => padL + (i * (w - padL - padR)) / Math.max(points.length - 1, 1);
  const Y = (v: number) => padT + (h - padT - padB) * (1 - (v - min) / (max - min));
  const fmt = (v: number) => v.toFixed(dec);
  const d = `M${points.map((p, i) => `${X(i).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(" L")}`;
  const last = points[points.length - 1];
  const step = Math.max(1, Math.ceil(points.length / 6));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {[0, 0.5, 1].map((t) => {
        const v = min + (max - min) * t;
        return (
          <g key={t}>
            <line x1={padL} y1={Y(v)} x2={w - padR} y2={Y(v)} className="gridln" />
            <text x={padL - 8} y={Y(v) + 3.5} className="axis" textAnchor="end">{fmt(v)}</text>
          </g>
        );
      })}
      {points.map(([m], i) =>
        i % step === 0 ? (
          <text key={m + i} x={X(i)} y={h - 8} className="axis" textAnchor="middle">{m}</text>
        ) : null,
      )}
      <path d={`${d} L${X(points.length - 1).toFixed(1)} ${h - padB} L${padL} ${h - padB} Z`} fill={color} opacity={0.08} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="ln" pathLength={1} />
      {points.map(([m, v], i) => (
        <g key={m + i}>
          <circle cx={X(i)} cy={Y(v)} r={2.2} fill={color} className="fade" />
          <circle cx={X(i)} cy={Y(v)} r={10} fill="transparent" className="hit" data-tip={`${m} · <b>${fmt(v)}${unit}</b>`} />
        </g>
      ))}
      <circle cx={X(points.length - 1)} cy={Y(last[1])} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} className="fade" />
      <text x={X(points.length - 1) - 6} y={Y(last[1]) - 9} className="val fade" textAnchor="end">{fmt(last[1])}{unit}</text>
    </svg>
  );
}

/* 퍼널 리스트 — 낙차가 커서 막대 대신 수치 중심으로 표기 */
export function FunnelList({ rows }: { rows: [string, number][] }) {
  const base = rows[0][1];
  return (
    <div className="funnel">
      {rows.map(([stage, v], i) => {
        const prev = i === 0 ? v : rows[i - 1][1];
        const pct = i === 0 ? 100 : (v / base) * 100;
        const step = i === 0 ? null : Math.round((v / prev) * 100);
        return (
          <div className="fun-row" key={stage}>
            <span className="fun-stage">{stage}</span>
            <span className="fun-bar"><i style={{ width: `${Math.max(pct, 0.8)}%` }} /></span>
            <span className="fun-num">{num(v)}</span>
            <span className="fun-pct">{step === null ? "100%" : `↳ ${step}%`}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Radar({ rows, label }: { rows: [string, number][]; label: string }) {
  const cx = 130, cy = 116, R = 62, n = rows.length, MAXV = 5, LR = R + 14;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number): [number, number] => {
    const a = ang(i);
    const r = R * (v / MAXV);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ring = (v: number) => rows.map((_, i) => pt(i, v).map((c) => c.toFixed(1)).join(",")).join(" ");
  const poly = rows.map(([, v], i) => pt(i, v).map((c) => c.toFixed(1)).join(",")).join(" ");
  return (
    <svg viewBox="0 0 260 230" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((r) => (
        <polygon key={r} points={ring(r)} fill="none" stroke="var(--line)" strokeWidth={r === 5 ? 1.2 : 0.7} />
      ))}
      {rows.map(([name, v], i) => {
        const a = ang(i);
        const edge = pt(i, MAXV);
        const lx = cx + LR * Math.cos(a);
        const ly = cy + LR * Math.sin(a);
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        /* 항목명과 값을 한 텍스트로 묶어 13px 간격 세로 정렬 — 라벨 겹침 방지 */
        const nameY = ly + (Math.sin(a) < -0.3 ? -10 : Math.sin(a) > 0.3 ? 6 : -2);
        return (
          <g key={name}>
            <line x1={cx} y1={cy} x2={edge[0]} y2={edge[1]} stroke="var(--line)" strokeWidth={0.7} />
            <text x={lx} y={nameY} className="lab" textAnchor={anchor}>
              {name}
              <tspan x={lx} dy={13} className="rad-val">{v.toFixed(2)}</tspan>
            </text>
          </g>
        );
      })}
      <polygon points={poly} fill="rgba(255,119,16,.16)" stroke={C.o} strokeWidth={2} strokeLinejoin="round"
        className="rad hit" data-tip="잡플래닛 항목별 평점 (5점 만점)" />
      {rows.map(([name, v], i) => {
        const p = pt(i, v);
        return <circle key={name} cx={p[0]} cy={p[1]} r={3} fill={C.o} stroke="#fff" strokeWidth={1.2} className="fade" />;
      })}
    </svg>
  );
}
