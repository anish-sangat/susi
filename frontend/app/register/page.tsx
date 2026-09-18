"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";


export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters"
      );
      return;
    }

    setLoading(true);

    try {
      // Create account.
      const registerResponse = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const registerData =
        await registerResponse.json();

      if (!registerResponse.ok) {
        setError(
          registerData.detail ??
            "Unable to create account"
        );
        return;
      }

      // Automatically sign in after registration.
      const loginData = new URLSearchParams();

      loginData.append("username", email);
      loginData.append("password", password);

      const loginResponse = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: loginData.toString(),
        }
      );

      const tokenData = await loginResponse.json();

      if (!loginResponse.ok) {
        router.push("/login");
        return;
      }

      /*
       * Development authentication storage.
       *
       * This will be replaced by an HttpOnly cookie
       * before production deployment.
       */
      sessionStorage.setItem(
        "susi_access_token",
        tokenData.access_token
      );

      router.push("/");
      router.refresh();

    } catch {
      setError(
        "Unable to connect to the server"
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-white text-black">

      {/* NAVBAR */}
      <header className="flex items-center justify-between px-6 py-6 md:px-14">

        <Link
          href="/"
          className="text-2xl font-bold tracking-[0.25em]"
        >
          SUSI
        </Link>

        <Link
          href="/"
          className="text-sm font-medium transition-opacity hover:opacity-50"
        >
          BACK TO SHOP
        </Link>

      </header>


      {/* REGISTER */}
      <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">

        <div className="w-full max-w-md">

          <p className="mb-3 text-xs tracking-[0.25em] text-neutral-500">
            SUSI
          </p>

          <h1 className="text-3xl font-medium">
            Create account
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            Create your SUSI account to continue
            shopping.
          </p>


          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-6"
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium tracking-wider"
              >
                EMAIL
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-black"
              />

            </div>


            {/* PASSWORD */}
            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium tracking-wider"
              >
                PASSWORD
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-black"
              />

              <p className="mt-2 text-xs text-neutral-400">
                Minimum 8 characters
              </p>

            </div>


            {/* CONFIRM PASSWORD */}
            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-xs font-medium tracking-wider"
              >
                CONFIRM PASSWORD
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-black"
              />

            </div>


            {/* ERROR */}
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}


            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black px-6 py-4 text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "CREATING ACCOUNT..."
                : "CREATE ACCOUNT"}
            </button>

          </form>


          <p className="mt-8 text-sm text-neutral-500">
            Already have an account?{" "}

            <Link
              href="/login"
              className="text-black underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="px-8 pb-8 md:px-14">

        <div className="border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          © {new Date().getFullYear()} SUSI
        </div>

      </footer>

    </main>
  );
}