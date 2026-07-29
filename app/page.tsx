import { getSnapshot } from "@/lib/data";
import OverviewPage from "@/components/pages/OverviewPage";

export default async function Home() {
  return <OverviewPage data={await getSnapshot()} />;
}
