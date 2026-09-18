"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";


export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ?? "Unable to sign in"
        );
        return;
      }

      /*
       * Temporary frontend authentication storage.
       *
       * We will replace this with an HttpOnly-cookie
       * session before production deployment.
       */
      sessionStorage.setItem(
        "susi_access_token",
        data.access_token
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


      {/* LOGIN */}
      <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">

        <div className="w-full max-w-md">

          <p className="mb-3 text-xs tracking-[0.25em] text-neutral-500">
            SUSI
          </p>

          <h1 className="text-3xl font-medium">
            Sign in
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            Sign in to continue shopping.
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
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
                ? "SIGNING IN..."
                : "SIGN IN"}
            </button>

          </form>


          <p className="mt-8 text-sm text-neutral-500">
            Don&apos;t have an account?{" "}

            <Link
              href="/register"
              className="text-black underline underline-offset-4"
            >
              Create account
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