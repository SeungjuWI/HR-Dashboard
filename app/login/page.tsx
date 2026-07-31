export const metadata = { title: "로그인 — LIKELION HR" };

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="login-box">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.svg" alt="멋쟁이사자처럼" className="login-logo" />
      <h1 className="login-title">HR Dashboard</h1>
      <p className="login-desc">사내 전용 페이지입니다. 접속 비밀번호를 입력하세요.</p>
      <form className="login-form" action="/api/login" method="POST">
        <input
          className="dir-q login-input"
          type="password"
          name="password"
          placeholder="비밀번호"
          aria-label="접속 비밀번호"
          autoFocus
          required
        />
        <button className="login-btn" type="submit">입장</button>
      </form>
      {error && <p className="login-error">비밀번호가 올바르지 않습니다.</p>}
    </div>
  );
}
