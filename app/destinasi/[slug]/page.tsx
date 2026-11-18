import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function LegacyDestinationRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destB = await db.getDestinationBySlug("tenant-b", slug);
  if (destB) {
    redirect(`/web-b/destinasi/${slug}`);
  }
  const destC = await db.getDestinationBySlug("tenant-c", slug);
  if (destC) {
    redirect(`/web-c/destinasi/${slug}`);
  }
  redirect(`/web-a/destinasi/${slug}`);
}
