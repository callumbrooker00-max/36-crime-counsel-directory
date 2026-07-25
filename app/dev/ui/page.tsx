import { notFound } from "next/navigation";
import { Gallery } from "./gallery";

export const metadata = { title: "UI gallery — dev" };

// Dev-only verification surface. Never ships to clients.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}
