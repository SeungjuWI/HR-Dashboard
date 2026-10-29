"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[dashboard] render error:", error);
  }, [error]);

  return (
    <div className="state-box">
      <p className="eyebrow">Error</p>
      <h1>화면을 그리지 못했습니다</h1>
      <p className="page-desc">
        일시적인 문제일 수 있습니다. 다시 시도해도 같은 화면이 나오면 HR팀에 아래 코드와 함께 알려주세요.
      </p>
      {error.digest && <p className="state-code">digest: {error.digest}</p>}
      <div className="state-actions">
        <button type="button" className="load-more" onClick={reset}>다시 시도</button>
        <Link className="more" href="/">홈으로 →</Link>
      </div>
    </div>
  );
}
