import { getSnapshot } from "@/lib/data";
import Directory from "@/components/Directory";
import { PageHead } from "@/components/nav";

export const metadata = { title: "구성원 명부 — LIKELION HR" };
export const revalidate = 600;

export default async function DirectoryRoute() {
  const data = await getSnapshot();
  return (
    <>
      <PageHead eyebrow="Directory" title="구성원 명부"
        desc={`재직중 ${data.roster.length}명 · 퇴사자 ${data.leavers.length}명 — 검색·정렬·필터와 CSV 내보내기를 지원합니다.`} />
      <section className="block" style={{ marginTop: 24 }}>
        <Directory data={data} tall asOf={new Date().toISOString().slice(0, 10)} />
      </section>
    </>
  );
}
