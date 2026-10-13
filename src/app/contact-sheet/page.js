import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocalhost } from "@/lib/local-only";
import ContactSheet from "./ContactSheet";

export const dynamic = "force-dynamic";

export default async function ContactSheetPage() {
  if (!isLocalhost(await headers())) notFound();
  return <ContactSheet />;
}
