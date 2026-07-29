import ReviewsPage from "@/components/pages/ReviewsPage";
import { liveReviews } from "@/lib/live/reviews";

export const metadata = { title: "리뷰 · 피드백 — LIKELION HR" };

export default async function Reviews() {
  return <ReviewsPage live={await liveReviews()} />;
}
