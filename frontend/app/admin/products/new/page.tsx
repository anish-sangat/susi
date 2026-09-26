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


type CreatedProduct = {
  id: string;
  category_id: string;
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


export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [categoryId, setCategoryId] =
    useState("");

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

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadPage() {
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


        const categoryResponse =
          await fetch(
            `${API_URL}/categories`
          );

        const categoryData =
          await categoryResponse.json();


        if (!categoryResponse.ok) {
          throw new Error(
            categoryData.detail ??
              "Unable to load categories"
          );
        }


        setCategories(categoryData);

        if (categoryData.length > 0) {
          setCategoryId(
            categoryData[0].id
          );
        }

      } catch (err) {

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to load page"
          );
        }

      } finally {
        setLoading(false);
      }
    }


    loadPage();

  }, [router]);


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


    if (!categoryId) {
      setError(
        "Please select a category."
      );

      return;
    }


    if (!name.trim()) {
      setError(
        "Product name is required."
      );

      return;
    }


    if (!slug.trim()) {
      setError(
        "Product slug is required."
      );

      return;
    }


    const token =
      sessionStorage.getItem(
        "susi_access_token"
      );

    if (!token) {
      router.push("/login");
      return;
    }


    setSaving(true);


    try {
      const response =
        await fetch(
          `${API_URL}/products`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              category_id: categoryId,
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
            "Unable to create product"
        );
      }


      const product =
        data as CreatedProduct;


      router.push(
        `/admin/products/${product.id}`
      );

    } catch (err) {

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to create product"
        );
      }

    } finally {
      setSaving(false);
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
          Loading...
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
            BACK TO PRODUCTS
          </Link>

        </div>

      </header>


      <section className="susi-container py-12">

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
            Add product
          </h1>

          <p
            className="mt-3 max-w-xl text-sm leading-6"
            style={{
              color: "#777777",
            }}
          >
            Create the base product first.
            After this, we will add SKU,
            price, stock, variants and images.
          </p>

        </div>


        <form
          onSubmit={handleSubmit}
          className="mt-10 max-w-2xl"
        >

          {error && (
            <div
              className="mb-8 border px-4 py-3"
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


          {/* CATEGORY */}
          <div className="mb-7">

            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium"
            >
              Category
            </label>

            <select
              id="category"
              value={categoryId}
              onChange={(event) =>
                setCategoryId(
                  event.target.value
                )
              }
              className="w-full border px-4 py-3 text-sm outline-none"
              style={{
                borderColor: "#d9d9d9",
                backgroundColor: "#ffffff",
                color: "#111111",
              }}
              required
            >

              {categories.length === 0 && (
                <option value="">
                  No categories available
                </option>
              )}


              {categories.map(
                (category) => (

                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>

                )
              )}

            </select>

          </div>


          {/* NAME */}
          <div className="mb-7">

            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Product name
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
              placeholder="SUSI Oversized Hoodie"
              className="w-full border px-4 py-3 text-sm outline-none"
              style={{
                borderColor: "#d9d9d9",
                backgroundColor: "#ffffff",
                color: "#111111",
              }}
              maxLength={255}
              required
            />

          </div>


          {/* SLUG */}
          <div className="mb-7">

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
              placeholder="susi-oversized-hoodie"
              className="w-full border px-4 py-3 text-sm outline-none"
              style={{
                borderColor: "#d9d9d9",
                backgroundColor: "#ffffff",
                color: "#111111",
              }}
              maxLength={255}
              required
            />

            <p
              className="mt-2 text-xs"
              style={{
                color: "#888888",
              }}
            >
              Product URL:
              {" "}
              /products/
              {slug || "product-slug"}
            </p>

          </div>


          {/* DESCRIPTION */}
          <div className="mb-8">

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
              placeholder="Describe the product..."
              rows={6}
              className="w-full resize-y border px-4 py-3 text-sm leading-6 outline-none"
              style={{
                borderColor: "#d9d9d9",
                backgroundColor: "#ffffff",
                color: "#111111",
              }}
            />

          </div>


          {/* ACTIONS */}
          <div
            className="flex flex-col-reverse gap-3 border-t pt-7 sm:flex-row sm:justify-end"
            style={{
              borderColor: "#e5e5e5",
            }}
          >

            <Link
              href="/admin/products"
              className="inline-flex items-center justify-center border px-6 py-3 text-sm font-medium"
              style={{
                borderColor: "#d9d9d9",
                backgroundColor: "#ffffff",
                color: "#111111",
              }}
            >
              CANCEL
            </Link>


            <button
              type="submit"
              disabled={
                saving ||
                categories.length === 0
              }
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: "#111111",
                color: "#ffffff",
              }}
            >
              {saving
                ? "CREATING..."
                : "CREATE PRODUCT"}
            </button>

          </div>

        </form>

      </section>

    </main>
  );
}