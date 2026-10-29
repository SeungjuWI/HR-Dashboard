import Link from "next/link";

export const metadata = { title: "페이지를 찾을 수 없음 — LIKELION HR" };

export default function NotFound() {
  return (
    <div className="state-box">
      <p className="eyebrow">404</p>
      <h1>없는 페이지입니다</h1>
      <p className="page-desc">주소가 바뀌었거나 삭제된 화면일 수 있습니다. 상단 메뉴에서 다시 찾아주세요.</p>
      <div className="state-actions">
        <Link className="more" href="/">홈으로 →</Link>
      </div>
    </div>
  );
}
