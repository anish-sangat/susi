"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type User = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
};


export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function checkAdmin() {
      const token =
        sessionStorage.getItem(
          "susi_access_token"
        );

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/me`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          sessionStorage.removeItem(
            "susi_access_token"
          );

          router.push("/login");
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ??
              "Unable to verify account."
          );
        }

        setUser(data);

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to verify account."
          );
        }

      } finally {
        setLoading(false);
      }
    }

    checkAdmin();

  }, [router]);


  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">

        <p className="text-sm text-neutral-500">
          Loading admin...
        </p>

      </main>
    );
  }


  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-black">

        <div className="w-full max-w-md border border-neutral-200 p-8 text-center">

          <h1 className="text-2xl font-medium">
            Admin unavailable
          </h1>

          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>

          <Link
            href="/"
            className="mt-8 inline-block bg-black px-6 py-3 text-sm text-white"
          >
            RETURN HOME
          </Link>

        </div>

      </main>
    );
  }


  // -------------------------------------------------------
  // NOT ADMIN
  // -------------------------------------------------------

  if (!user || user.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-black">

        <div className="w-full max-w-md border border-neutral-200 p-8 text-center">

          <p className="text-xs tracking-[0.25em] text-neutral-500">
            SUSI
          </p>

          <h1 className="mt-3 text-2xl font-medium">
            Access denied
          </h1>

          <p className="mt-4 text-sm leading-6 text-neutral-500">
            This page is available only to
            SUSI administrators.
          </p>

          <Link
            href="/"
            className="mt-8 inline-block bg-black px-6 py-3 text-sm text-white"
          >
            RETURN HOME
          </Link>

        </div>

      </main>
    );
  }


  // -------------------------------------------------------
  // ADMIN DASHBOARD
  // -------------------------------------------------------

  return (
    <main className="min-h-screen bg-white text-black">

      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-6 md:px-14">

        <div className="flex items-center gap-8">

          <Link
            href="/"
            className="text-2xl font-bold tracking-[0.25em]"
          >
            SUSI
          </Link>

          <span className="text-xs tracking-[0.2em] text-neutral-500">
            ADMIN
          </span>

        </div>


        <Link
          href="/"
          className="text-xs font-medium tracking-wider"
        >
          VIEW STORE
        </Link>

      </header>


      <section className="mx-auto max-w-6xl px-6 py-14 md:px-14">

        <p className="text-xs tracking-[0.25em] text-neutral-500">
          ADMINISTRATION
        </p>

        <h1 className="mt-3 text-3xl font-medium md:text-4xl">
          Dashboard
        </h1>

        <p className="mt-3 text-sm text-neutral-500">
          Manage your SUSI store.
        </p>


        {/* ADMIN NAVIGATION */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">


          {/* PRODUCTS */}
          <Link
            href="/admin/products"
            className="group border border-neutral-200 p-7 transition-colors hover:border-black"
          >

            <p className="text-xs tracking-[0.2em] text-neutral-500">
              CATALOG
            </p>

            <h2 className="mt-4 text-xl font-medium">
              Products
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Add products, manage variants,
              images and product information.
            </p>

            <p className="mt-8 text-sm font-medium">
              MANAGE PRODUCTS →
            </p>

          </Link>


          {/* ORDERS */}
          <Link
            href="/admin/orders"
            className="group border border-neutral-200 p-7 transition-colors hover:border-black"
          >

            <p className="text-xs tracking-[0.2em] text-neutral-500">
              SALES
            </p>

            <h2 className="mt-4 text-xl font-medium">
              Orders
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Review customer orders and
              payment status.
            </p>

            <p className="mt-8 text-sm font-medium">
              VIEW ORDERS →
            </p>

          </Link>


          {/* INVENTORY */}
          <Link
            href="/admin/inventory"
            className="group border border-neutral-200 p-7 transition-colors hover:border-black"
          >

            <p className="text-xs tracking-[0.2em] text-neutral-500">
              STOCK
            </p>

            <h2 className="mt-4 text-xl font-medium">
              Inventory
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              View SKU stock levels and
              manage inventory.
            </p>

            <p className="mt-8 text-sm font-medium">
              MANAGE INVENTORY →
            </p>

          </Link>

        </div>


        {/* ADMIN ACCOUNT */}
        <div className="mt-12 border-t border-neutral-200 pt-6">

          <p className="text-xs text-neutral-500">
            Signed in as
          </p>

          <p className="mt-1 text-sm">
            {user.email}
          </p>

        </div>

      </section>


      <footer className="px-8 pb-8 pt-16 md:px-14">

        <div className="border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          © {new Date().getFullYear()} SUSI
        </div>

      </footer>

    </main>
  );
}