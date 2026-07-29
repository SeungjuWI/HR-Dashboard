import { getSnapshot } from "@/lib/data";
import PeoplePage from "@/components/pages/PeoplePage";

export const metadata = { title: "인원 현황 — LIKELION HR" };

export default async function People() {
  return <PeoplePage data={await getSnapshot()} />;
}
