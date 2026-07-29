import { getSnapshot } from "@/lib/data";
import RecruitingPage from "@/components/pages/RecruitingPage";

export const metadata = { title: "채용 — LIKELION HR" };

export default async function Recruiting() {
  return <RecruitingPage data={await getSnapshot()} />;
}
