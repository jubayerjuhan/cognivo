import { AuthForm } from "@/components/AuthForm";

export default function Page() {
  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <AuthForm mode="sign-in" />
    </main>
  );
}
