import { getSnapshot } from "@/lib/data";
import AttritionPage from "@/components/pages/AttritionPage";

export const metadata = { title: "퇴직 · 리텐션 — LIKELION HR" };
export const revalidate = 600;

export default async function Attrition() {
  return <AttritionPage data={await getSnapshot()} />;
}
