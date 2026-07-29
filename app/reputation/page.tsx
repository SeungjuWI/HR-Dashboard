import { getSnapshot } from "@/lib/data";
import ReputationPage from "@/components/pages/ReputationPage";

export const metadata = { title: "평판 — LIKELION HR" };

export default async function Reputation() {
  return <ReputationPage data={await getSnapshot()} />;
}
