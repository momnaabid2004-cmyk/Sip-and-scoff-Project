import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth/guard";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentAdmin()) redirect("/admin");
  const { next } = await searchParams;
  return <LoginForm next={next?.startsWith("/admin") ? next : "/admin"} />;
}
