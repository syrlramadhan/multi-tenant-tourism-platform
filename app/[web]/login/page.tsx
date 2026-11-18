import { notFound } from "next/navigation";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { WebLoginClient } from "./login-client";

export default async function WebLoginPage({
  params,
}: {
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  if (!["web-a", "web-b", "web-c"].includes(web)) {
    notFound();
  }

  const tenant = await resolveCurrentTenant(web);
  if (!tenant) {
    notFound();
  }

  return <WebLoginClient web={web} tenant={tenant} />;
}
