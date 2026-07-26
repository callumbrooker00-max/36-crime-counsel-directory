import { SignInForm } from "@/components/admin/sign-in-form";

// Public — the one /admin route not behind the guard (wireframe 05).
export const metadata = { title: "Sign in — 36 Crime admin" };

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <SignInForm />
    </div>
  );
}
