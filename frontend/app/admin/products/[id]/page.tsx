"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";


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


type ProductItem = {
  id: string;
  product_id: string;
  sku: string;
  price: number | string;
  qty_in_stock: number;
  is_active: boolean;
};


type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};


type Variation = {
  id: string;
  name: string;
};


type VariationOption = {
  id: string;
  variation_id: string;
  value: string;
  sort_order: number;
};


type ProductConfiguration = {
  id: string;
  product_item_id: string;
  variation_option_id: string;
};


function formatKRW(
  price: number | string
) {
  return new Intl.NumberFormat(
    "ko-KR",
    {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }
  ).format(Number(price));
}


export default function ProductManagePage() {
  const router = useRouter();
  const params = useParams();

  const productId =
    params.id as string;


  // ============================================
  // DATA
  // ============================================

  const [product, setProduct] =
    useState<Product | null>(null);

  const [items, setItems] =
    useState<ProductItem[]>([]);

  const [images, setImages] =
    useState<ProductImage[]>([]);

  const [variations, setVariations] =
    useState<Variation[]>([]);

  const [
    optionsByVariation,
    setOptionsByVariation,
  ] = useState<
    Record<string, VariationOption[]>
  >({});

  const [
    configurationsByItem,
    setConfigurationsByItem,
  ] = useState<
    Record<string, ProductConfiguration[]>
  >({});


  // ============================================
  // NEW VARIANT FORM
  // ============================================

  const [sku, setSku] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [stock, setStock] =
    useState("0");

  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState<Record<string, string>>(
    {}
  );


  // ============================================
  // STOCK EDITING
  // ============================================

  const [
    stockEdits,
    setStockEdits,
  ] = useState<Record<string, string>>(
    {}
  );

  const [
    savingStock,
    setSavingStock,
  ] = useState<string | null>(null);


  // ============================================
  // IMAGE FORM
  // ============================================

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imageAlt, setImageAlt] =
    useState("");

  const [
    imagePrimary,
    setImagePrimary,
  ] = useState(false);


  // ============================================
  // PAGE STATE
  // ============================================

  const [loading, setLoading] =
    useState(true);

  const [
    savingVariant,
    setSavingVariant,
  ] = useState(false);

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ============================================
  // AUTH
  // ============================================

  function getToken() {
    return sessionStorage.getItem(
      "susi_access_token"
    );
  }


  async function authenticatedFetch(
    path: string,
    options: RequestInit = {}
  ) {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return null;
    }

    const response =
      await fetch(
        `${API_URL}${path}`,
        {
          ...options,

          headers: {
            Authorization:
              `Bearer ${token}`,

            ...options.headers,
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


    return response;
  }


  async function checkAdmin() {
    const response =
      await authenticatedFetch(
        "/auth/me"
      );

    if (!response) {
      return false;
    }

    const data =
      await response.json();

    if (
      !response.ok ||
      data.role !== "admin"
    ) {
      router.push("/");
      return false;
    }

    return true;
  }


  // ============================================
  // LOAD PRODUCT
  // ============================================

  async function loadProduct() {
    const response =
      await fetch(
        `${API_URL}/products/${productId}`,
        {
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ??
          "Unable to load product"
      );
    }

    setProduct(data);
  }


  // ============================================
  // LOAD PRODUCT ITEMS
  // ============================================

  async function loadItems() {
    const response =
      await fetch(
        `${API_URL}/product-items?product_id=${productId}`,
        {
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ??
          "Unable to load product items"
      );
    }

    setItems(data);

    return data as ProductItem[];
  }


  // ============================================
  // LOAD IMAGES
  // ============================================

  async function loadImages() {
    const response =
      await fetch(
        `${API_URL}/product-images?product_id=${productId}`,
        {
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ??
          "Unable to load product images"
      );
    }

    setImages(data);
  }


  // ============================================
  // LOAD VARIATIONS
  // ============================================

  async function loadVariations() {
    const response =
      await fetch(
        `${API_URL}/variations`,
        {
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ??
          "Unable to load variations"
      );
    }

    const variationList =
      data as Variation[];

    setVariations(
      variationList
    );


    const optionEntries =
      await Promise.all(
        variationList.map(
          async (variation) => {
            const optionResponse =
              await fetch(
                `${API_URL}/variations/${variation.id}/options`,
                {
                  cache: "no-store",
                }
              );

            const optionData =
              await optionResponse.json();

            if (!optionResponse.ok) {
              throw new Error(
                optionData.detail ??
                  `Unable to load ${variation.name} options`
              );
            }

            return [
              variation.id,
              optionData as VariationOption[],
            ] as const;
          }
        )
      );


    setOptionsByVariation(
      Object.fromEntries(
        optionEntries
      )
    );
  }


  // ============================================
  // LOAD CONFIGURATIONS
  // ============================================

  async function loadConfigurations(
    productItems: ProductItem[]
  ) {
    const entries =
      await Promise.all(
        productItems.map(
          async (item) => {
            const response =
              await fetch(
                `${API_URL}/product-items/${item.id}/configurations`,
                {
                  cache: "no-store",
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.detail ??
                  `Unable to load configuration for ${item.sku}`
              );
            }

            return [
              item.id,
              data as ProductConfiguration[],
            ] as const;
          }
        )
      );


    setConfigurationsByItem(
      Object.fromEntries(
        entries
      )
    );
  }


  async function reloadItems() {
    const currentItems =
      await loadItems();

    await loadConfigurations(
      currentItems
    );
  }


  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const admin =
          await checkAdmin();

        if (!admin) {
          return;
        }


        const [
          ,
          currentItems,
        ] =
          await Promise.all([
            loadProduct(),
            loadItems(),
            loadImages(),
            loadVariations(),
          ]);


        await loadConfigurations(
          currentItems
        );

      } catch (err) {

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to load product"
          );
        }

      } finally {
        setLoading(false);
      }
    }


    if (productId) {
      loadPage();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);


  // ============================================
  // OPTION LOOKUP
  // ============================================

  const optionLookup =
    useMemo(() => {
      const lookup =
        new Map<
          string,
          {
            option: VariationOption;
            variation: Variation;
          }
        >();


      for (
        const variation
        of variations
      ) {
        const options =
          optionsByVariation[
            variation.id
          ] ?? [];


        for (
          const option
          of options
        ) {
          lookup.set(
            option.id,
            {
              option,
              variation,
            }
          );
        }
      }


      return lookup;

    }, [
      variations,
      optionsByVariation,
    ]);


  // ============================================
  // SELECT OPTION
  // ============================================

  function selectOption(
    variationId: string,
    optionId: string
  ) {
    setSelectedOptions(
      (current) => {

        if (
          current[variationId] ===
          optionId
        ) {
          const copy = {
            ...current,
          };

          delete copy[
            variationId
          ];

          return copy;
        }


        return {
          ...current,
          [variationId]:
            optionId,
        };
      }
    );
  }


  // ============================================
  // CREATE VARIANT
  // ============================================

  async function handleCreateVariant(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");


    if (!sku.trim()) {
      setError(
        "SKU is required."
      );

      return;
    }


    if (
      price.trim() === "" ||
      Number(price) < 0
    ) {
      setError(
        "Enter a valid price."
      );

      return;
    }


    if (
      stock.trim() === "" ||
      Number(stock) < 0
    ) {
      setError(
        "Enter a valid stock quantity."
      );

      return;
    }


    setSavingVariant(true);


    try {
      const response =
        await authenticatedFetch(
          "/product-items/batch",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              product_id:
                productId,

              variants: [
                {
                  sku:
                    sku
                      .trim()
                      .toUpperCase(),

                  price:
                    Number(price),

                  qty_in_stock:
                    Number(stock),

                  option_ids:
                    Object.values(
                      selectedOptions
                    ),
                },
              ],
            }),
          }
        );


      if (!response) {
        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to create variant"
        );
      }


      setSku("");
      setPrice("");
      setStock("0");
      setSelectedOptions({});


      setSuccess(
        "Variant created successfully."
      );


      await reloadItems();

    } catch (err) {

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to create variant"
        );
      }

    } finally {
      setSavingVariant(false);
    }
  }


  // ============================================
  // UPDATE STOCK
  // ============================================

  async function updateStock(
    item: ProductItem
  ) {
    const value =
      stockEdits[item.id] ??
      String(
        item.qty_in_stock
      );

    const newStock =
      Number(value);


    if (
      value.trim() === "" ||
      !Number.isInteger(
        newStock
      ) ||
      newStock < 0
    ) {
      setError(
        "Stock must be a whole number of 0 or more."
      );

      return;
    }


    if (
      newStock ===
      item.qty_in_stock
    ) {
      setSuccess(
        `"${item.sku}" stock is already ${newStock}.`
      );

      return;
    }


    setError("");
    setSuccess("");
    setSavingStock(
      item.id
    );


    try {
      const response =
        await authenticatedFetch(
          `/product-items/${item.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              qty_in_stock:
                newStock,
            }),
          }
        );


      if (!response) {
        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to update stock"
        );
      }


      setSuccess(
        `"${item.sku}" stock updated from ${item.qty_in_stock} to ${newStock}.`
      );


      setStockEdits(
        (current) => {
          const copy = {
            ...current,
          };

          delete copy[
            item.id
          ];

          return copy;
        }
      );


      await reloadItems();

    } catch (err) {

      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Unable to update stock"
        );
      }

    } finally {
      setSavingStock(
        null
      );
    }
  }


  // ============================================
  // DEACTIVATE SKU
  // ============================================

  async function deleteItem(
    item: ProductItem
  ) {
    const confirmed =
      window.confirm(
        `Deactivate SKU "${item.sku}"?`
      );


    if (!confirmed) {
      return;
    }


    setError("");
    setSuccess("");


    try {
      const response =
        await authenticatedFetch(
          `/product-items/${item.id}`,
          {
            method: "DELETE",
          }
        );


      if (!response) {
        return;
      }


      if (!response.ok) {
        let message =
          "Unable to deactivate SKU";

        try {
          const data =
            await response.json();

          message =
            data.detail ??
            message;

        } catch {
          // 204 response
        }

        throw new Error(
          message
        );
      }


      setSuccess(
        `"${item.sku}" was deactivated.`
      );


      await reloadItems();

    } catch (err) {

      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Unable to deactivate SKU"
        );
      }
    }
  }


  // ============================================
  // IMAGE UPLOAD
  // ============================================

  async function handleImageUpload(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");


    if (!imageFile) {
      setError(
        "Choose an image first."
      );

      return;
    }


    setUploadingImage(
      true
    );


    try {
      const formData =
        new FormData();


      formData.append(
        "product_id",
        productId
      );

      formData.append(
        "file",
        imageFile
      );


      if (
        imageAlt.trim()
      ) {
        formData.append(
          "alt_text",
          imageAlt.trim()
        );
      }


      formData.append(
        "sort_order",
        String(
          images.length
        )
      );


      formData.append(
        "is_primary",
        String(
          imagePrimary
        )
      );


      const response =
        await authenticatedFetch(
          "/product-images/upload",
          {
            method: "POST",
            body: formData,
          }
        );


      if (!response) {
        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to upload image"
        );
      }


      setImageFile(null);
      setImageAlt("");
      setImagePrimary(false);


      const fileInput =
        document.getElementById(
          "image"
        ) as HTMLInputElement | null;


      if (fileInput) {
        fileInput.value =
          "";
      }


      setSuccess(
        "Image uploaded successfully."
      );


      await loadImages();

    } catch (err) {

      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Unable to upload image"
        );
      }

    } finally {
      setUploadingImage(
        false
      );
    }
  }


  // ============================================
  // SET PRIMARY IMAGE
  // ============================================

  async function makePrimary(
    image: ProductImage
  ) {
    setError("");
    setSuccess("");


    try {
      const response =
        await authenticatedFetch(
          `/product-images/${image.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                is_primary:
                  true,
              }),
          }
        );


      if (!response) {
        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ??
            "Unable to update image"
        );
      }


      setSuccess(
        "Primary image updated."
      );


      await loadImages();

    } catch (err) {

      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Unable to update image"
        );
      }
    }
  }


  // ============================================
  // DELETE IMAGE
  // ============================================

  async function deleteImage(
    image: ProductImage
  ) {
    const confirmed =
      window.confirm(
        "Delete this product image?"
      );


    if (!confirmed) {
      return;
    }


    setError("");
    setSuccess("");


    try {
      const response =
        await authenticatedFetch(
          `/product-images/${image.id}`,
          {
            method: "DELETE",
          }
        );


      if (!response) {
        return;
      }


      if (!response.ok) {
        let message =
          "Unable to delete image";

        try {
          const data =
            await response.json();

          message =
            data.detail ??
            message;

        } catch {
          // Empty response
        }

        throw new Error(
          message
        );
      }


      setSuccess(
        "Image deleted."
      );


      await loadImages();

    } catch (err) {

      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Unable to delete image"
        );
      }
    }
  }


  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor:
            "#fcfcfc",
          color: "#111111",
        }}
      >
        <p
          className="text-sm"
          style={{
            color:
              "#777777",
          }}
        >
          Loading product...
        </p>
      </main>
    );
  }


  // ============================================
  // PRODUCT NOT FOUND
  // ============================================

  if (!product) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor:
            "#fcfcfc",
          color: "#111111",
        }}
      >
        <div className="text-center">

          <p>
            Product not found.
          </p>

          <Link
            href="/admin/products"
            className="mt-5 inline-block underline"
          >
            Back to products
          </Link>

        </div>
      </main>
    );
  }


  // ============================================
  // PAGE
  // ============================================

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor:
          "#fcfcfc",
        color: "#111111",
      }}
    >

      {/* HEADER */}
      <header
        className="border-b"
        style={{
          backgroundColor:
            "#fcfcfc",
          borderColor:
            "#e5e5e5",
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
                color:
                  "#777777",
              }}
            >
              ADMIN
            </span>

          </div>


          <div className="flex items-center gap-6">

            <Link
              href="/admin/categories"
              className="text-xs font-medium"
            >
              CATEGORIES
            </Link>

            <Link
              href="/admin/products"
              className="text-xs font-medium"
            >
              PRODUCTS
            </Link>

          </div>

        </div>

      </header>


      <section className="susi-container py-12">

        {/* PRODUCT HEADER */}
        <div
          className="border-b pb-8"
          style={{
            borderColor:
              "#e5e5e5",
          }}
        >

          <p
            className="mb-2 text-xs uppercase tracking-[0.15em]"
            style={{
              color:
                "#777777",
            }}
          >
            Product
          </p>


          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                {product.name}
              </h1>

              <p
                className="mt-2 text-sm"
                style={{
                  color:
                    "#777777",
                }}
              >
                /products/{product.slug}
              </p>

            </div>


            <Link
              href={`/products/${product.slug}`}
              className="w-fit border px-5 py-3 text-xs font-medium"
              style={{
                borderColor:
                  "#d9d9d9",
                backgroundColor:
                  "#ffffff",
              }}
            >
              VIEW PRODUCT
            </Link>

          </div>

        </div>


        {/* MESSAGES */}
        {error && (
          <div
            className="mt-8 border px-4 py-3"
            style={{
              borderColor:
                "#fecaca",
              backgroundColor:
                "#fef2f2",
            }}
          >
            <p
              className="text-sm"
              style={{
                color:
                  "#b91c1c",
              }}
            >
              {error}
            </p>
          </div>
        )}


        {success && (
          <div
            className="mt-8 border px-4 py-3"
            style={{
              borderColor:
                "#bbf7d0",
              backgroundColor:
                "#f0fdf4",
            }}
          >
            <p
              className="text-sm"
              style={{
                color:
                  "#166534",
              }}
            >
              {success}
            </p>
          </div>
        )}


        {/* ======================================
            IMAGES
        ====================================== */}

        <section className="py-12">

          <div className="mb-8">

            <h2 className="text-xl font-semibold">
              Product images
            </h2>

            <p
              className="mt-2 text-sm"
              style={{
                color:
                  "#777777",
              }}
            >
              Upload JPEG, PNG or WebP
              images. Images are stored
              in Cloudflare R2.
            </p>

          </div>


          <div className="grid gap-10 lg:grid-cols-[360px_1fr]">

            {/* IMAGE UPLOAD */}
            <form
              onSubmit={
                handleImageUpload
              }
              className="border p-6"
              style={{
                borderColor:
                  "#e5e5e5",
                backgroundColor:
                  "#ffffff",
              }}
            >

              <h3 className="font-medium">
                Upload image
              </h3>


              <div className="mt-6">

                <label
                  htmlFor="image"
                  className="mb-2 block text-sm font-medium"
                >
                  Image
                </label>

                <input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    setImageFile(
                      event.target
                        .files?.[0] ??
                        null
                    )
                  }
                  className="block w-full text-sm"
                  required
                />

              </div>


              <div className="mt-6">

                <label
                  htmlFor="alt"
                  className="mb-2 block text-sm font-medium"
                >
                  Alt text
                </label>

                <input
                  id="alt"
                  type="text"
                  value={imageAlt}
                  onChange={(event) =>
                    setImageAlt(
                      event.target.value
                    )
                  }
                  placeholder={
                    product.name
                  }
                  className="w-full border px-4 py-3 text-sm outline-none"
                  style={{
                    borderColor:
                      "#d9d9d9",
                    backgroundColor:
                      "#ffffff",
                    color:
                      "#111111",
                  }}
                />

              </div>


              <label className="mt-6 flex items-center gap-3 text-sm">

                <input
                  type="checkbox"
                  checked={
                    imagePrimary
                  }
                  onChange={(event) =>
                    setImagePrimary(
                      event.target
                        .checked
                    )
                  }
                />

                Set as primary image

              </label>


              <button
                type="submit"
                disabled={
                  uploadingImage ||
                  !imageFile
                }
                className="mt-7 w-full px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundColor:
                    "#111111",
                  color:
                    "#ffffff",
                }}
              >
                {uploadingImage
                  ? "UPLOADING..."
                  : "UPLOAD IMAGE"}
              </button>

            </form>


            {/* IMAGE LIST */}
            <div>

              {images.length === 0 ? (

                <div
                  className="flex min-h-56 items-center justify-center border"
                  style={{
                    borderColor:
                      "#e5e5e5",
                    backgroundColor:
                      "#ffffff",
                  }}
                >
                  <p
                    className="text-sm"
                    style={{
                      color:
                        "#777777",
                    }}
                  >
                    No images uploaded yet.
                  </p>
                </div>

              ) : (

                <div className="grid grid-cols-2 gap-5 md:grid-cols-3">

                  {images.map(
                    (image) => (

                      <article
                        key={
                          image.id
                        }
                      >

                        <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">

                          <img
                            src={
                              image.image_url
                            }
                            alt={
                              image.alt_text ??
                              product.name
                            }
                            className="h-full w-full object-cover"
                          />


                          {image.is_primary && (
                            <span className="absolute left-3 top-3 bg-black px-2.5 py-1 text-[9px] font-medium text-white">
                              PRIMARY
                            </span>
                          )}

                        </div>


                        <div className="mt-3 flex flex-wrap gap-3">

                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() =>
                                makePrimary(
                                  image
                                )
                              }
                              className="text-xs font-medium underline underline-offset-4"
                            >
                              SET PRIMARY
                            </button>
                          )}


                          <button
                            type="button"
                            onClick={() =>
                              deleteImage(
                                image
                              )
                            }
                            className="text-xs font-medium"
                            style={{
                              color:
                                "#b91c1c",
                            }}
                          >
                            DELETE
                          </button>

                        </div>

                      </article>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </section>


        <div
          className="border-t"
          style={{
            borderColor:
              "#e5e5e5",
          }}
        />


        {/* ======================================
            VARIANTS
        ====================================== */}

        <section className="py-12">

          <div className="mb-8">

            <h2 className="text-xl font-semibold">
              Variants & inventory
            </h2>

            <p
              className="mt-2 max-w-2xl text-sm leading-6"
              style={{
                color:
                  "#777777",
              }}
            >
              Create one SKU for each
              sellable combination. You
              can also update stock for
              existing variants below.
            </p>

          </div>


          <div className="grid gap-10 lg:grid-cols-[420px_1fr]">

            {/* ==================================
                CREATE VARIANT
            ================================== */}

            <form
              onSubmit={
                handleCreateVariant
              }
              className="border p-6"
              style={{
                borderColor:
                  "#e5e5e5",
                backgroundColor:
                  "#ffffff",
              }}
            >

              <h3 className="font-medium">
                Add variant
              </h3>


              {/* SKU */}
              <div className="mt-6">

                <label
                  htmlFor="sku"
                  className="mb-2 block text-sm font-medium"
                >
                  SKU
                </label>

                <input
                  id="sku"
                  type="text"
                  value={sku}
                  onChange={(event) =>
                    setSku(
                      event.target.value
                    )
                  }
                  placeholder="SUSI-TS-BLK-M"
                  className="w-full border px-4 py-3 text-sm uppercase outline-none"
                  style={{
                    borderColor:
                      "#d9d9d9",
                    backgroundColor:
                      "#ffffff",
                    color:
                      "#111111",
                  }}
                  required
                />

              </div>


              {/* PRICE */}
              <div className="mt-6">

                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium"
                >
                  Price (KRW)
                </label>

                <input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(event) =>
                    setPrice(
                      event.target.value
                    )
                  }
                  placeholder="39000"
                  className="w-full border px-4 py-3 text-sm outline-none"
                  style={{
                    borderColor:
                      "#d9d9d9",
                    backgroundColor:
                      "#ffffff",
                    color:
                      "#111111",
                  }}
                  required
                />

              </div>


              {/* INITIAL STOCK */}
              <div className="mt-6">

                <label
                  htmlFor="stock"
                  className="mb-2 block text-sm font-medium"
                >
                  Initial stock
                </label>

                <input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(event) =>
                    setStock(
                      event.target.value
                    )
                  }
                  className="w-full border px-4 py-3 text-sm outline-none"
                  style={{
                    borderColor:
                      "#d9d9d9",
                    backgroundColor:
                      "#ffffff",
                    color:
                      "#111111",
                  }}
                  required
                />

              </div>


              {/* VARIATIONS */}
              {variations.length >
                0 && (

                <div
                  className="mt-8 border-t pt-7"
                  style={{
                    borderColor:
                      "#e5e5e5",
                  }}
                >

                  <p
                    className="mb-6 text-xs uppercase tracking-[0.14em]"
                    style={{
                      color:
                        "#777777",
                    }}
                  >
                    Options
                  </p>


                  <div className="space-y-8">

                    {variations.map(
                      (
                        variation
                      ) => {
                        const variationOptions =
                          optionsByVariation[
                            variation.id
                          ] ?? [];


                        if (
                          variationOptions.length ===
                          0
                        ) {
                          return null;
                        }


                        return (
                          <div
                            key={
                              variation.id
                            }
                          >

                            <div className="mb-3 flex items-center justify-between">

                              <p className="text-sm font-medium">
                                {
                                  variation.name
                                }
                              </p>


                              {selectedOptions[
                                variation.id
                              ] && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedOptions(
                                      (
                                        current
                                      ) => {
                                        const copy =
                                          {
                                            ...current,
                                          };

                                        delete copy[
                                          variation
                                            .id
                                        ];

                                        return copy;
                                      }
                                    )
                                  }
                                  className="text-xs underline underline-offset-4"
                                  style={{
                                    color:
                                      "#777777",
                                  }}
                                >
                                  Clear
                                </button>

                              )}

                            </div>


                            <div className="flex flex-wrap gap-2">

                              {variationOptions.map(
                                (
                                  option
                                ) => {
                                  const selected =
                                    selectedOptions[
                                      variation
                                        .id
                                    ] ===
                                    option.id;


                                  return (
                                    <button
                                      key={
                                        option.id
                                      }
                                      type="button"
                                      onClick={() =>
                                        selectOption(
                                          variation.id,
                                          option.id
                                        )
                                      }
                                      className="min-w-12 border px-4 py-2.5 text-sm transition-colors"
                                      style={{
                                        borderColor:
                                          selected
                                            ? "#111111"
                                            : "#d9d9d9",

                                        backgroundColor:
                                          selected
                                            ? "#111111"
                                            : "#ffffff",

                                        color:
                                          selected
                                            ? "#ffffff"
                                            : "#111111",
                                      }}
                                    >
                                      {
                                        option.value
                                      }
                                    </button>
                                  );
                                }
                              )}

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              )}


              {/* SELECTED OPTIONS */}
              {Object.keys(
                selectedOptions
              ).length > 0 && (

                <div
                  className="mt-8 border p-4"
                  style={{
                    borderColor:
                      "#e5e5e5",
                    backgroundColor:
                      "#f7f7f7",
                  }}
                >

                  <p
                    className="text-xs font-medium uppercase tracking-[0.1em]"
                    style={{
                      color:
                        "#777777",
                    }}
                  >
                    Selected
                  </p>


                  <div className="mt-3 flex flex-wrap gap-2">

                    {Object.values(
                      selectedOptions
                    ).map(
                      (
                        optionId
                      ) => {
                        const info =
                          optionLookup.get(
                            optionId
                          );


                        if (!info) {
                          return null;
                        }


                        return (
                          <span
                            key={
                              optionId
                            }
                            className="border bg-white px-3 py-1.5 text-xs"
                            style={{
                              borderColor:
                                "#d9d9d9",
                            }}
                          >
                            {
                              info
                                .variation
                                .name
                            }
                            :{" "}
                            {
                              info
                                .option
                                .value
                            }
                          </span>
                        );
                      }
                    )}

                  </div>

                </div>

              )}


              <button
                type="submit"
                disabled={
                  savingVariant
                }
                className="mt-8 w-full px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundColor:
                    "#111111",
                  color:
                    "#ffffff",
                }}
              >
                {savingVariant
                  ? "CREATING..."
                  : "ADD VARIANT"}
              </button>

            </form>


            {/* ==================================
                EXISTING VARIANTS
            ================================== */}

            <div>

              {items.length === 0 ? (

                <div
                  className="flex min-h-56 items-center justify-center border"
                  style={{
                    borderColor:
                      "#e5e5e5",
                    backgroundColor:
                      "#ffffff",
                  }}
                >
                  <p
                    className="text-sm"
                    style={{
                      color:
                        "#777777",
                    }}
                  >
                    No variants yet.
                  </p>
                </div>

              ) : (

                <div
                  className="overflow-hidden border"
                  style={{
                    borderColor:
                      "#e5e5e5",
                    backgroundColor:
                      "#ffffff",
                  }}
                >

                  {/* TABLE HEADER */}
                  <div
                    className="hidden grid-cols-[1.2fr_1.2fr_110px_190px_90px] gap-4 border-b px-5 py-3 text-xs font-medium lg:grid"
                    style={{
                      borderColor:
                        "#e5e5e5",
                      backgroundColor:
                        "#f5f5f5",
                      color:
                        "#777777",
                    }}
                  >

                    <span>
                      SKU
                    </span>

                    <span>
                      OPTIONS
                    </span>

                    <span>
                      PRICE
                    </span>

                    <span>
                      STOCK
                    </span>

                    <span>
                      ACTION
                    </span>

                  </div>


                  {items.map(
                    (item) => {

                      const configurations =
                        configurationsByItem[
                          item.id
                        ] ?? [];


                      const displayedStock =
                        stockEdits[
                          item.id
                        ] ??
                        String(
                          item.qty_in_stock
                        );


                      const displayedStockNumber =
                        Number(
                          displayedStock
                        );


                      const stockChanged =
                        displayedStock !==
                        String(
                          item.qty_in_stock
                        );


                      return (
                        <div
                          key={
                            item.id
                          }
                          className="grid gap-5 border-b px-5 py-6 last:border-b-0 lg:grid-cols-[1.2fr_1.2fr_110px_190px_90px] lg:items-center"
                          style={{
                            borderColor:
                              "#e5e5e5",
                          }}
                        >

                          {/* SKU */}
                          <div>

                            <p className="break-all text-sm font-medium">
                              {
                                item.sku
                              }
                            </p>

                            <p
                              className="mt-1 text-xs lg:hidden"
                              style={{
                                color:
                                  "#777777",
                              }}
                            >
                              SKU
                            </p>

                          </div>


                          {/* OPTIONS */}
                          <div>

                            {configurations.length ===
                            0 ? (

                              <span
                                className="text-sm"
                                style={{
                                  color:
                                    "#777777",
                                }}
                              >
                                No options
                              </span>

                            ) : (

                              <div className="flex flex-wrap gap-1.5">

                                {configurations.map(
                                  (
                                    configuration
                                  ) => {

                                    const info =
                                      optionLookup.get(
                                        configuration
                                          .variation_option_id
                                      );


                                    if (
                                      !info
                                    ) {
                                      return null;
                                    }


                                    return (
                                      <span
                                        key={
                                          configuration
                                            .id
                                        }
                                        className="border px-2.5 py-1 text-xs"
                                        style={{
                                          borderColor:
                                            "#e5e5e5",
                                          backgroundColor:
                                            "#f7f7f7",
                                        }}
                                      >
                                        {
                                          info
                                            .variation
                                            .name
                                        }
                                        :{" "}
                                        {
                                          info
                                            .option
                                            .value
                                        }
                                      </span>
                                    );
                                  }
                                )}

                              </div>

                            )}

                          </div>


                          {/* PRICE */}
                          <div>

                            <p className="text-sm font-medium">
                              {formatKRW(
                                item.price
                              )}
                            </p>

                            <p
                              className="mt-1 text-xs lg:hidden"
                              style={{
                                color:
                                  "#777777",
                              }}
                            >
                              Price
                            </p>

                          </div>


                          {/* STOCK EDITOR */}
                          <div>

                            <p
                              className="mb-2 text-[10px] uppercase tracking-[0.1em] lg:hidden"
                              style={{
                                color:
                                  "#777777",
                              }}
                            >
                              Stock
                            </p>


                            <div className="flex items-center gap-2">

                              {/* MINUS */}
                              <button
                                type="button"
                                onClick={() => {
                                  const current =
                                    Number(
                                      stockEdits[
                                        item.id
                                      ] ??
                                        item.qty_in_stock
                                    );

                                  const safeCurrent =
                                    Number.isFinite(
                                      current
                                    )
                                      ? current
                                      : 0;

                                  setStockEdits(
                                    (
                                      values
                                    ) => ({
                                      ...values,

                                      [item.id]:
                                        String(
                                          Math.max(
                                            0,
                                            safeCurrent -
                                              1
                                          )
                                        ),
                                    })
                                  );
                                }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center border text-base transition hover:bg-[#f5f5f5]"
                                style={{
                                  borderColor:
                                    "#d9d9d9",
                                }}
                              >
                                −
                              </button>


                              {/* STOCK INPUT */}
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  displayedStock
                                }
                                onChange={(
                                  event
                                ) =>
                                  setStockEdits(
                                    (
                                      values
                                    ) => ({
                                      ...values,

                                      [item.id]:
                                        event
                                          .target
                                          .value,
                                    })
                                  )
                                }
                                className="h-9 w-16 border text-center text-sm outline-none focus:border-black"
                                style={{
                                  borderColor:
                                    "#d9d9d9",
                                  backgroundColor:
                                    "#ffffff",
                                }}
                              />


                              {/* PLUS */}
                              <button
                                type="button"
                                onClick={() => {
                                  const current =
                                    Number(
                                      stockEdits[
                                        item.id
                                      ] ??
                                        item.qty_in_stock
                                    );

                                  const safeCurrent =
                                    Number.isFinite(
                                      current
                                    )
                                      ? current
                                      : 0;

                                  setStockEdits(
                                    (
                                      values
                                    ) => ({
                                      ...values,

                                      [item.id]:
                                        String(
                                          safeCurrent +
                                            1
                                        ),
                                    })
                                  );
                                }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center border text-base transition hover:bg-[#f5f5f5]"
                                style={{
                                  borderColor:
                                    "#d9d9d9",
                                }}
                              >
                                +
                              </button>

                            </div>


                            <div className="mt-2 flex items-center gap-3">

                              <button
                                type="button"
                                onClick={() =>
                                  updateStock(
                                    item
                                  )
                                }
                                disabled={
                                  savingStock ===
                                    item.id ||
                                  !stockChanged
                                }
                                className="text-[10px] font-medium uppercase tracking-[0.08em] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                {savingStock ===
                                item.id
                                  ? "SAVING..."
                                  : "UPDATE STOCK"}
                              </button>


                              {Number.isFinite(
                                displayedStockNumber
                              ) &&
                                displayedStockNumber <=
                                  3 && (

                                <span
                                  className="text-[10px] font-medium"
                                  style={{
                                    color:
                                      "#b45309",
                                  }}
                                >
                                  LOW
                                </span>

                              )}

                            </div>

                          </div>


                          {/* ACTION */}
                          <div>

                            <button
                              type="button"
                              onClick={() =>
                                deleteItem(
                                  item
                                )
                              }
                              className="w-fit text-xs font-medium"
                              style={{
                                color:
                                  "#b91c1c",
                              }}
                            >
                              DEACTIVATE
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>

          </div>

        </section>

      </section>

    </main>
  );
}