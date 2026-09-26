"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};


export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  async function loadProducts() {
    const token =
      sessionStorage.getItem(
        "susi_access_token"
      );

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const userResponse =
        await fetch(
          `${API_URL}/auth/me`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (userResponse.status === 401) {
        sessionStorage.removeItem(
          "susi_access_token"
        );

        router.push("/login");
        return;
      }

      const user =
        await userResponse.json();

      if (
        !userResponse.ok ||
        user.role !== "admin"
      ) {
        router.push("/");
        return;
      }


      const productResponse =
        await fetch(
          `${API_URL}/products`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      const data =
        await productResponse.json();


      if (!productResponse.ok) {
        throw new Error(
          data.detail ??
            "Unable to load products"
        );
      }


      setProducts(data);

    } catch (err) {

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to load products"
        );
      }

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadProducts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
          backgroundColor: "#fcfcfc",
          borderColor: "#e5e5e5",
        }}
      >

        <div className="susi-container flex h-16 items-center justify-between">

          <div className="flex items-center gap-6">

            <Link
              href="/admin"
              className="text-xl font-bold tracking-[0.2em]"
              style={{
                color: "#111111",
              }}
            >
              SUSI
            </Link>

            <span
              className="text-xs"
              style={{
                color: "#777777",
              }}
            >
              ADMIN
            </span>

          </div>


          <Link
            href="/"
            className="text-xs font-medium"
            style={{
              color: "#111111",
            }}
          >
            VIEW STORE
          </Link>

        </div>

      </header>


      <section className="susi-container py-12">

        {/* TOP */}
        <div
          className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between"
          style={{
            borderColor: "#e5e5e5",
          }}
        >

          <div>

            <p
              className="mb-2 text-xs uppercase tracking-[0.15em]"
              style={{
                color: "#777777",
              }}
            >
              Catalog
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.04em]">
              Products
            </h1>

          </div>


          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium transition-opacity hover:opacity-75"
            style={{
              backgroundColor: "#111111",
              color: "#ffffff",
            }}
          >
            + ADD PRODUCT
          </Link>

        </div>


        {/* CONTENT */}
        <div className="mt-8">

          {loading && (
            <p
              className="text-sm"
              style={{
                color: "#777777",
              }}
            >
              Loading products...
            </p>
          )}


          {error && (
            <div
              className="border px-4 py-3"
              style={{
                borderColor: "#fecaca",
                backgroundColor: "#fef2f2",
              }}
            >

              <p
                className="text-sm"
                style={{
                  color: "#b91c1c",
                }}
              >
                {error}
              </p>

            </div>
          )}


          {!loading &&
            !error &&
            products.length === 0 && (

              <div className="py-20 text-center">

                <p className="text-lg">
                  No products yet.
                </p>

                <p
                  className="mt-2 text-sm"
                  style={{
                    color: "#777777",
                  }}
                >
                  Add your first SUSI product.
                </p>

              </div>

            )}


          {!loading &&
            !error &&
            products.length > 0 && (

              <div
                className="overflow-hidden border"
                style={{
                  borderColor: "#e5e5e5",
                  backgroundColor: "#ffffff",
                }}
              >

                {/* TABLE HEADER */}
                <div
                  className="hidden grid-cols-[1fr_1fr_120px] gap-4 border-b px-5 py-3 text-xs font-medium md:grid"
                  style={{
                    borderColor: "#e5e5e5",
                    backgroundColor: "#f5f5f5",
                    color: "#777777",
                  }}
                >

                  <span>
                    PRODUCT
                  </span>

                  <span>
                    SLUG
                  </span>

                  <span>
                    ACTION
                  </span>

                </div>


                {products.map(
                  (product) => (

                    <div
                      key={product.id}
                      className="grid gap-4 border-b px-5 py-5 last:border-b-0 md:grid-cols-[1fr_1fr_120px] md:items-center"
                      style={{
                        borderColor: "#e5e5e5",
                        backgroundColor: "#ffffff",
                      }}
                    >

                      <div>

                        <p
                          className="font-medium"
                          style={{
                            color: "#111111",
                          }}
                        >
                          {product.name}
                        </p>

                        {product.description && (
                          <p
                            className="mt-1 line-clamp-1 text-xs"
                            style={{
                              color: "#777777",
                            }}
                          >
                            {
                              product.description
                            }
                          </p>
                        )}

                      </div>


                      <p
                        className="text-sm"
                        style={{
                          color: "#777777",
                        }}
                      >
                        {product.slug}
                      </p>


                      <Link
                        href={`/admin/products/${product.id}`}
                        className="w-fit text-sm font-medium underline underline-offset-4"
                        style={{
                          color: "#111111",
                        }}
                      >
                        MANAGE
                      </Link>

                    </div>

                  )
                )}

              </div>

            )}

        </div>

      </section>

    </main>
  );
}