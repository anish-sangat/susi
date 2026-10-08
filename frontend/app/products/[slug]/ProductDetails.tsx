"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ProductOption,
  StorefrontProductDetail,
} from "./page";


type ProductDetailsProps = {
  product: StorefrontProductDetail;
};


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


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


export default function ProductDetails({
  product,
}: ProductDetailsProps) {
  const router = useRouter();

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>({});

  const [addingToCart, setAddingToCart] =
    useState(false);

  const [addedToCart, setAddedToCart] =
    useState(false);

  const [cartError, setCartError] =
    useState("");


  // -------------------------------------------------------
  // BUILD VARIATION GROUPS
  // -------------------------------------------------------

  const variationGroups =
    useMemo(() => {
      const groups =
        new Map<
          string,
          {
            id: string;
            name: string;
            options: ProductOption[];
          }
        >();


      for (
        const variant
        of product.variants
      ) {
        for (
          const option
          of variant.options
        ) {
          if (
            !groups.has(
              option.variation_id
            )
          ) {
            groups.set(
              option.variation_id,
              {
                id:
                  option.variation_id,
                name:
                  option.variation_name,
                options: [],
              }
            );
          }


          const group =
            groups.get(
              option.variation_id
            )!;


          const optionAlreadyExists =
            group.options.some(
              (
                existingOption
              ) =>
                existingOption.option_id ===
                option.option_id
            );


          if (
            !optionAlreadyExists
          ) {
            group.options.push(
              option
            );
          }
        }
      }


      return Array.from(
        groups.values()
      ).map((group) => ({
        ...group,

        options: [
          ...group.options,
        ].sort(
          (a, b) =>
            a.sort_order -
            b.sort_order
        ),
      }));

    }, [
      product.variants,
    ]);


  // -------------------------------------------------------
  // SELECTED VARIANT
  // -------------------------------------------------------

  const selectedVariant =
    useMemo(() => {
      if (
        variationGroups.length ===
        0
      ) {
        return (
          product.variants[0] ??
          null
        );
      }


      const selectedCount =
        Object.keys(
          selectedOptions
        ).length;


      if (
        selectedCount !==
        variationGroups.length
      ) {
        return null;
      }


      return (
        product.variants.find(
          (variant) =>
            variationGroups.every(
              (group) => {
                const selectedOptionId =
                  selectedOptions[
                    group.id
                  ];


                return variant.options.some(
                  (option) =>
                    option.variation_id ===
                      group.id &&
                    option.option_id ===
                      selectedOptionId
                );
              }
            )
        ) ?? null
      );

    }, [
      product.variants,
      variationGroups,
      selectedOptions,
    ]);


  // -------------------------------------------------------
  // OPTION AVAILABILITY
  // -------------------------------------------------------

  function optionExistsWithCurrentSelection(
    variationId: string,
    optionId: string
  ) {
    return product.variants.some(
      (variant) => {
        if (
          !variant.is_available
        ) {
          return false;
        }


        const hasCandidateOption =
          variant.options.some(
            (option) =>
              option.variation_id ===
                variationId &&
              option.option_id ===
                optionId
          );


        if (
          !hasCandidateOption
        ) {
          return false;
        }


        return Object.entries(
          selectedOptions
        ).every(
          ([
            selectedVariationId,
            selectedOptionId,
          ]) => {
            if (
              selectedVariationId ===
              variationId
            ) {
              return true;
            }


            return variant.options.some(
              (option) =>
                option.variation_id ===
                  selectedVariationId &&
                option.option_id ===
                  selectedOptionId
            );
          }
        );
      }
    );
  }


  // -------------------------------------------------------
  // SELECT OPTION
  // -------------------------------------------------------

  function selectOption(
    variationId: string,
    optionId: string
  ) {
    setCartError("");
    setAddedToCart(false);

    setSelectedOptions(
      (current) => ({
        ...current,
        [variationId]:
          optionId,
      })
    );
  }


  // -------------------------------------------------------
  // ADD TO CART
  // -------------------------------------------------------

  async function handleAddToCart() {
    if (!selectedVariant) {
      setCartError(
        "Please select all options"
      );

      return;
    }


    if (
      !selectedVariant.is_available
    ) {
      setCartError(
        "This variant is sold out"
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


    setAddingToCart(true);
    setAddedToCart(false);
    setCartError("");


    try {
      const response =
        await fetch(
          `${API_URL}/cart/items`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              product_item_id:
                selectedVariant.id,

              quantity: 1,
            }),
          }
        );


      let data: {
        detail?: string;
      } = {};


      try {
        data =
          await response.json();
      } catch {
        // no JSON body
      }


      if (
        response.status === 401
      ) {
        sessionStorage.removeItem(
          "susi_access_token"
        );

        router.push("/login");

        return;
      }


      if (!response.ok) {
        setCartError(
          data.detail ??
            "Unable to add item to cart"
        );

        return;
      }


      setAddedToCart(true);

    } catch {
      setCartError(
        "Unable to connect to the server"
      );

    } finally {
      setAddingToCart(false);
    }
  }


  // -------------------------------------------------------
  // DISPLAY PRICE
  // -------------------------------------------------------

  const displayPrice =
    selectedVariant?.price ??
    product.price;


  return (
    <main className="min-h-screen bg-white text-black">

      {/* PRODUCT */}
      <section className="grid min-h-[75vh] grid-cols-1 lg:grid-cols-2">

        {/* IMAGES */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2">

          {product.images.length >
          0 ? (

            product.images.map(
              (image) => (

                <div
                  key={
                    image.id
                  }
                  className="aspect-[3/4] overflow-hidden bg-neutral-100"
                >
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
                </div>

              )
            )

          ) : (

            <div className="aspect-[3/4] bg-neutral-100" />

          )}

        </div>


        {/* PRODUCT INFORMATION */}
        <div className="flex justify-center px-6 py-12 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:items-center lg:px-16">

          <div className="w-full max-w-md">

            <p className="mb-3 text-xs tracking-[0.25em] text-neutral-500">
              SUSI
            </p>


            <h1 className="text-3xl font-medium md:text-4xl">
              {product.name}
            </h1>


            {/* PRICE */}
            {displayPrice !== null && (
              <p className="mt-4 text-lg">
                {formatKRW(
                  displayPrice
                )}
              </p>
            )}


            {/* DESCRIPTION */}
            {product.description && (
              <p className="mt-8 text-sm leading-7 text-neutral-600">
                {
                  product.description
                }
              </p>
            )}


            {/* VARIATIONS */}
            <div className="mt-10 space-y-8">

              {variationGroups.map(
                (group) => (

                  <div
                    key={
                      group.id
                    }
                  >

                    <div className="mb-3 flex items-center justify-between">

                      <p className="text-xs font-medium uppercase tracking-wider">
                        {
                          group.name
                        }
                      </p>


                      {selectedOptions[
                        group.id
                      ] && (

                        <span className="text-xs text-neutral-500">
                          {
                            group.options.find(
                              (
                                option
                              ) =>
                                option.option_id ===
                                selectedOptions[
                                  group.id
                                ]
                            )
                              ?.option_value
                          }
                        </span>

                      )}

                    </div>


                    <div className="flex flex-wrap gap-2">

                      {group.options.map(
                        (
                          option
                        ) => {
                          const selected =
                            selectedOptions[
                              group.id
                            ] ===
                            option.option_id;


                          const available =
                            optionExistsWithCurrentSelection(
                              group.id,
                              option.option_id
                            );


                          return (
                            <button
                              key={
                                option.option_id
                              }
                              type="button"
                              disabled={
                                !available
                              }
                              onClick={() =>
                                selectOption(
                                  group.id,
                                  option.option_id
                                )
                              }
                              className={[
                                "min-w-16 border px-5 py-3 text-sm transition-colors",

                                selected
                                  ? "border-black bg-black text-white"
                                  : "border-neutral-300 bg-white text-black",

                                available
                                  ? "hover:border-black"
                                  : "cursor-not-allowed opacity-30",
                              ].join(
                                " "
                              )}
                            >
                              {
                                option.option_value
                              }
                            </button>
                          );
                        }
                      )}

                    </div>

                  </div>

                )
              )}

            </div>


            {/* STOCK */}
            <div className="mt-8">

              {selectedVariant ? (

                selectedVariant.is_available ? (

                  <p className="text-xs text-neutral-500">
                    {
                      selectedVariant.qty_in_stock
                    }{" "}
                    in stock
                  </p>

                ) : (

                  <p className="text-xs text-neutral-500">
                    Sold out
                  </p>

                )

              ) :
              variationGroups.length >
              0 ? (

                <p className="text-xs text-neutral-500">
                  Select your options
                </p>

              ) : null}

            </div>


            {/* CART ERROR */}
            {cartError && (
              <p className="mt-4 text-sm text-red-600">
                {cartError}
              </p>
            )}


            {/* CART SUCCESS */}
            {addedToCart && (
              <p className="mt-4 text-sm text-green-700">
                Added to cart.
              </p>
            )}


            {/* ADD TO CART */}
            <button
              type="button"
              onClick={
                handleAddToCart
              }
              disabled={
                addingToCart ||
                !product.is_available ||
                !selectedVariant ||
                !selectedVariant.is_available
              }
              className="mt-5 w-full bg-black px-6 py-4 text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {addingToCart
                ? "ADDING..."
                : addedToCart
                  ? "ADDED TO CART"
                  : !product.is_available
                    ? "SOLD OUT"
                    : !selectedVariant
                      ? "SELECT OPTIONS"
                      : !selectedVariant.is_available
                        ? "SOLD OUT"
                        : "ADD TO CART"}
            </button>


            {/* SKU */}
            {selectedVariant && (
              <p className="mt-3 text-xs text-neutral-400">
                SKU:{" "}
                {
                  selectedVariant.sku
                }
              </p>
            )}

          </div>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="px-8 pb-8 pt-16 md:px-14">

        <div className="border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          ©{" "}
          {new Date().getFullYear()}{" "}
          SUSI
        </div>

      </footer>

    </main>
  );
}