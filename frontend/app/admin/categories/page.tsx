"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};


function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


export default function AdminCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [name, setName] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  async function getToken() {
    const token =
      sessionStorage.getItem(
        "susi_access_token"
      );

    if (!token) {
      router.push("/login");
      return null;
    }

    return token;
  }


  async function checkAdmin() {
    const token = await getToken();

    if (!token) {
      return null;
    }

    const response =
      await fetch(
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
      return null;
    }


    const data =
      await response.json();


    if (
      !response.ok ||
      data.role !== "admin"
    ) {
      router.push("/");
      return null;
    }


    return token;
  }


  async function loadCategories() {
    try {
      const response =
        await fetch(
          `${API_URL}/categories`,
          {
            cache: "no-store",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to load categories"
        );
      }


      setCategories(data);

    } catch (err) {

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to load categories"
        );
      }
    }
  }


  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setError("");


      const token =
        await checkAdmin();

      if (!token) {
        return;
      }


      await loadCategories();


      setLoading(false);
    }


    loadPage();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function handleNameChange(
    value: string
  ) {
    setName(value);
    setSlug(makeSlug(value));
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");


    if (!name.trim()) {
      setError(
        "Category name is required."
      );
      return;
    }


    if (!slug.trim()) {
      setError(
        "Category slug is required."
      );
      return;
    }


    const token =
      await getToken();

    if (!token) {
      return;
    }


    setSaving(true);


    try {
      const response =
        await fetch(
          `${API_URL}/categories`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              parent_id: null,
              name: name.trim(),
              slug: slug.trim(),
              description:
                description.trim() || null,
            }),
          }
        );


      const data =
        await response.json();


      if (response.status === 401) {
        sessionStorage.removeItem(
          "susi_access_token"
        );

        router.push("/login");
        return;
      }


      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to create category"
        );
      }


      setName("");
      setSlug("");
      setDescription("");

      setSuccess(
        "Category created successfully."
      );


      await loadCategories();

    } catch (err) {

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to create category"
        );
      }

    } finally {
      setSaving(false);
    }
  }


  async function deleteCategory(
    category: Category
  ) {
    const confirmed =
      window.confirm(
        `Deactivate "${category.name}"?`
      );


    if (!confirmed) {
      return;
    }


    const token =
      await getToken();

    if (!token) {
      return;
    }


    setDeletingId(category.id);
    setError("");
    setSuccess("");


    try {
      const response =
        await fetch(
          `${API_URL}/categories/${category.id}`,
          {
            method: "DELETE",

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


      if (!response.ok) {
        let message =
          "Unable to delete category";

        try {
          const data =
            await response.json();

          message =
            data.detail ?? message;

        } catch {
          // DELETE may not return JSON
        }

        throw new Error(message);
      }


      setSuccess(
        `"${category.name}" was deactivated.`
      );


      await loadCategories();

    } catch (err) {

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to delete category"
        );
      }

    } finally {
      setDeletingId(null);
    }
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
          Loading categories...
        </p>
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
              href="/admin"
              className="text-xl font-bold tracking-[0.2em]"
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
            href="/admin/products"
            className="text-xs font-medium"
          >
            PRODUCTS
          </Link>

        </div>

      </header>


      <section className="susi-container py-12">

        {/* PAGE HEADER */}
        <div
          className="border-b pb-8"
          style={{
            borderColor: "#e5e5e5",
          }}
        >

          <p
            className="mb-2 text-xs uppercase tracking-[0.15em]"
            style={{
              color: "#777777",
            }}
          >
            Catalog
          </p>

          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            Categories
          </h1>

          <p
            className="mt-3 max-w-xl text-sm leading-6"
            style={{
              color: "#777777",
            }}
          >
            Create product categories such
            as T-Shirts, Hoodies and Joggers.
          </p>

        </div>


        <div className="mt-10 grid gap-12 lg:grid-cols-[420px_1fr]">

          {/* CREATE CATEGORY */}
          <div>

            <h2 className="text-lg font-semibold">
              Add category
            </h2>


            <form
              onSubmit={handleSubmit}
              className="mt-6"
            >

              {/* NAME */}
              <div className="mb-6">

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  placeholder="T-Shirts"
                  maxLength={100}
                  className="w-full border px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor:
                      "#ffffff",
                    color: "#111111",
                    borderColor:
                      "#d9d9d9",
                  }}
                  required
                />

              </div>


              {/* SLUG */}
              <div className="mb-6">

                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-medium"
                >
                  Slug
                </label>

                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(event) =>
                    setSlug(
                      makeSlug(
                        event.target.value
                      )
                    )
                  }
                  placeholder="t-shirts"
                  maxLength={120}
                  className="w-full border px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor:
                      "#ffffff",
                    color: "#111111",
                    borderColor:
                      "#d9d9d9",
                  }}
                  required
                />

              </div>


              {/* DESCRIPTION */}
              <div className="mb-7">

                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Optional category description"
                  className="w-full resize-y border px-4 py-3 text-sm leading-6 outline-none"
                  style={{
                    backgroundColor:
                      "#ffffff",
                    color: "#111111",
                    borderColor:
                      "#d9d9d9",
                  }}
                />

              </div>


              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundColor:
                    "#111111",
                  color: "#ffffff",
                }}
              >
                {saving
                  ? "CREATING..."
                  : "ADD CATEGORY"}
              </button>

            </form>

          </div>


          {/* CATEGORY LIST */}
          <div>

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-semibold">
                Current categories
              </h2>

              <span
                className="text-xs"
                style={{
                  color: "#777777",
                }}
              >
                {categories.length} active
              </span>

            </div>


            {error && (
              <div
                className="mt-6 border px-4 py-3"
                style={{
                  borderColor: "#fecaca",
                  backgroundColor:
                    "#fef2f2",
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


            {success && (
              <div
                className="mt-6 border px-4 py-3"
                style={{
                  borderColor: "#bbf7d0",
                  backgroundColor:
                    "#f0fdf4",
                }}
              >
                <p
                  className="text-sm"
                  style={{
                    color: "#166534",
                  }}
                >
                  {success}
                </p>
              </div>
            )}


            {categories.length === 0 ? (

              <div
                className="mt-6 border px-6 py-16 text-center"
                style={{
                  borderColor: "#e5e5e5",
                  backgroundColor:
                    "#ffffff",
                }}
              >
                <p
                  className="text-sm"
                  style={{
                    color: "#777777",
                  }}
                >
                  No active categories.
                </p>
              </div>

            ) : (

              <div
                className="mt-6 overflow-hidden border"
                style={{
                  borderColor: "#e5e5e5",
                  backgroundColor:
                    "#ffffff",
                }}
              >

                <div
                  className="hidden grid-cols-[1fr_1fr_100px] gap-4 border-b px-5 py-3 text-xs font-medium md:grid"
                  style={{
                    backgroundColor:
                      "#f5f5f5",
                    borderColor:
                      "#e5e5e5",
                    color: "#777777",
                  }}
                >
                  <span>
                    CATEGORY
                  </span>

                  <span>
                    SLUG
                  </span>

                  <span>
                    ACTION
                  </span>
                </div>


                {categories.map(
                  (category) => (

                    <div
                      key={category.id}
                      className="grid gap-4 border-b px-5 py-5 last:border-b-0 md:grid-cols-[1fr_1fr_100px] md:items-center"
                      style={{
                        borderColor:
                          "#e5e5e5",
                      }}
                    >

                      <div>

                        <p className="font-medium">
                          {category.name}
                        </p>

                        {category.description && (
                          <p
                            className="mt-1 line-clamp-1 text-xs"
                            style={{
                              color:
                                "#777777",
                            }}
                          >
                            {
                              category.description
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
                        {category.slug}
                      </p>


                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          category.id
                        }
                        onClick={() =>
                          deleteCategory(
                            category
                          )
                        }
                        className="w-fit text-xs font-medium disabled:opacity-40"
                        style={{
                          color: "#b91c1c",
                        }}
                      >
                        {deletingId ===
                        category.id
                          ? "..."
                          : "DELETE"}
                      </button>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      </section>

    </main>
  );
}