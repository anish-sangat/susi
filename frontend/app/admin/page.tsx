"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type User = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
};


export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadAdmin() {
      setLoading(true);
      setError("");


      try {
        const token =
          sessionStorage.getItem(
            "susi_access_token"
          );


        if (!token) {
          router.push("/login");
          return;
        }


        const response =
          await fetch(
            `${API_URL}/auth/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache: "no-store",
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
              "Unable to load admin account"
          );
        }


        if (data.role !== "admin") {
          router.push("/");
          return;
        }


        setUser(data);

      } catch (err) {

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to load admin dashboard"
          );
        }

      } finally {
        setLoading(false);
      }
    }


    loadAdmin();
  }, [router]);


  function handleLogout() {
    sessionStorage.removeItem(
      "susi_access_token"
    );

    router.push("/login");
  }


  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor: "#fcfcfc",
          color: "#111111",
        }}
      >
        <p
          className="text-sm"
          style={{
            color: "#777777",
          }}
        >
          Loading admin dashboard...
        </p>
      </main>
    );
  }


  if (error) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor: "#fcfcfc",
          color: "#111111",
        }}
      >
        <div className="text-center">

          <p
            className="text-sm"
            style={{
              color: "#b91c1c",
            }}
          >
            {error}
          </p>


          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 border px-5 py-3 text-sm"
            style={{
              borderColor: "#d9d9d9",
              backgroundColor: "#ffffff",
            }}
          >
            TRY AGAIN
          </button>

        </div>
      </main>
    );
  }


  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "#fcfcfc",
        color: "#111111",
      }}
    >

      {/* HEADER */}
      <header
        className="border-b"
        style={{
          borderColor: "#e5e5e5",
          backgroundColor: "#fcfcfc",
        }}
      >

        <div className="susi-container flex h-16 items-center justify-between">

          <div className="flex items-center gap-6">

            <Link
              href="/"
              className="text-xl font-bold tracking-[0.2em]"
            >
              SUSI
            </Link>


            <span
              className="text-xs tracking-[0.15em]"
              style={{
                color: "#777777",
              }}
            >
              ADMIN
            </span>

          </div>


          <div className="flex items-center gap-5">

            <Link
              href="/"
              className="text-xs font-medium"
            >
              STOREFRONT
            </Link>


            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-medium"
            >
              LOG OUT
            </button>

          </div>

        </div>

      </header>


      {/* CONTENT */}
      <section className="susi-container py-12 md:py-16">

        {/* TITLE */}
        <div
          className="border-b pb-10"
          style={{
            borderColor: "#e5e5e5",
          }}
        >

          <p
            className="text-xs uppercase tracking-[0.18em]"
            style={{
              color: "#777777",
            }}
          >
            Administration
          </p>


          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                Dashboard
              </h1>


              <p
                className="mt-3 max-w-xl text-sm leading-6"
                style={{
                  color: "#777777",
                }}
              >
                Manage your SUSI catalog,
                customer orders and inventory.
              </p>

            </div>


            {user && (
              <p
                className="text-xs"
                style={{
                  color: "#777777",
                }}
              >
                Signed in as{" "}
                <span
                  style={{
                    color: "#111111",
                  }}
                >
                  {user.email}
                </span>
              </p>
            )}

          </div>

        </div>


        {/* CARDS */}
        <div className="grid gap-5 py-10 md:grid-cols-2 lg:grid-cols-4">

          {/* PRODUCTS */}
          <Link
            href="/admin/products"
            className="group flex min-h-64 flex-col justify-between border p-7 transition-colors hover:border-black"
            style={{
              borderColor: "#e5e5e5",
              backgroundColor: "#ffffff",
            }}
          >

            <div>

              <p
                className="text-xs uppercase tracking-[0.18em]"
                style={{
                  color: "#777777",
                }}
              >
                Catalog
              </p>


              <h2 className="mt-5 text-xl font-medium">
                Products
              </h2>


              <p
                className="mt-3 text-sm leading-6"
                style={{
                  color: "#777777",
                }}
              >
                Create products, upload
                images, manage variants,
                prices and product stock.
              </p>

            </div>


            <p className="mt-8 text-sm font-medium">
              MANAGE PRODUCTS →
            </p>

          </Link>


          {/* CATEGORIES */}
          <Link
            href="/admin/categories"
            className="group flex min-h-64 flex-col justify-between border p-7 transition-colors hover:border-black"
            style={{
              borderColor: "#e5e5e5",
              backgroundColor: "#ffffff",
            }}
          >

            <div>

              <p
                className="text-xs uppercase tracking-[0.18em]"
                style={{
                  color: "#777777",
                }}
              >
                Catalog
              </p>


              <h2 className="mt-5 text-xl font-medium">
                Categories
              </h2>


              <p
                className="mt-3 text-sm leading-6"
                style={{
                  color: "#777777",
                }}
              >
                Create and manage
                categories such as
                T-Shirts, Hoodies and
                Joggers.
              </p>

            </div>


            <p className="mt-8 text-sm font-medium">
              MANAGE CATEGORIES →
            </p>

          </Link>


          {/* ORDERS */}
          <Link
            href="/admin/orders"
            className="group flex min-h-64 flex-col justify-between border p-7 transition-colors hover:border-black"
            style={{
              borderColor: "#e5e5e5",
              backgroundColor: "#ffffff",
            }}
          >

            <div>

              <p
                className="text-xs uppercase tracking-[0.18em]"
                style={{
                  color: "#777777",
                }}
              >
                Sales
              </p>


              <h2 className="mt-5 text-xl font-medium">
                Orders
              </h2>


              <p
                className="mt-3 text-sm leading-6"
                style={{
                  color: "#777777",
                }}
              >
                Review customer orders,
                payment status, shipping
                information and order
                progress.
              </p>

            </div>


            <p className="mt-8 text-sm font-medium">
              MANAGE ORDERS →
            </p>

          </Link>


          {/* INVENTORY */}
          <Link
            href="/admin/inventory"
            className="group flex min-h-64 flex-col justify-between border p-7 transition-colors hover:border-black"
            style={{
              borderColor: "#e5e5e5",
              backgroundColor: "#ffffff",
            }}
          >

            <div>

              <p
                className="text-xs uppercase tracking-[0.18em]"
                style={{
                  color: "#777777",
                }}
              >
                Stock
              </p>


              <h2 className="mt-5 text-xl font-medium">
                Inventory
              </h2>


              <p
                className="mt-3 text-sm leading-6"
                style={{
                  color: "#777777",
                }}
              >
                Monitor stock levels,
                product SKUs and inventory
                movements.
              </p>

            </div>


            <p className="mt-8 text-sm font-medium">
              VIEW INVENTORY →
            </p>

          </Link>

        </div>


        {/* QUICK LINKS */}
        <section
          className="border-t pt-10"
          style={{
            borderColor: "#e5e5e5",
          }}
        >

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-lg font-medium">
                Quick actions
              </h2>

              <p
                className="mt-2 text-sm"
                style={{
                  color: "#777777",
                }}
              >
                Common catalog actions.
              </p>

            </div>


            <div className="flex flex-wrap gap-3">

              <Link
                href="/admin/products/new"
                className="px-5 py-3 text-xs font-medium"
                style={{
                  backgroundColor: "#111111",
                  color: "#ffffff",
                }}
              >
                + ADD PRODUCT
              </Link>


              <Link
                href="/admin/categories"
                className="border px-5 py-3 text-xs font-medium"
                style={{
                  borderColor: "#d9d9d9",
                  backgroundColor: "#ffffff",
                }}
              >
                MANAGE CATEGORIES
              </Link>

            </div>

          </div>

        </section>

      </section>

    </main>
  );
}