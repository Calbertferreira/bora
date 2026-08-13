import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { serviceCategories, userProfiles } from "@/lib/db/schema";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const [profile] = await getDb().select({ userId: userProfiles.userId }).from(userProfiles).where(eq(userProfiles.userId, session.user.id)).limit(1);
  if (profile) redirect("/painel");
  const serviceSuggestions = await getDb().select({ id: serviceCategories.id, name: serviceCategories.name }).from(serviceCategories).where(eq(serviceCategories.active, true)).orderBy(asc(serviceCategories.name));
  return <main className="auth-page">
    <a className="brand auth-brand" href="/">bora<span>.</span></a>
    <section className="auth-card">
      <div className="auth-heading"><span>ÚLTIMA ETAPA</span><h1>Complete seu cadastro</h1><p>Precisamos de poucas informações para personalizar sua experiência.</p></div>
      <OnboardingForm serviceSuggestions={serviceSuggestions} />
    </section>
  </main>;
}
