import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { api } from "@/utils/routes";

export default async function ProtectedLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    redirect("/auth/signin");
  }

  const res = await fetch(`${api}user/get/me`, {
    headers: {
      Authorization: `Bearer ${session.user.accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/auth/signin");
  }

  return <>{children}</>;
}