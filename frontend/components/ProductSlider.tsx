"use client";

import Link from "next/link";
import { useRef } from "react";


export type StorefrontProduct = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string | null;
  qty_in_stock: number;
  is_available: boolean;
  primary_image_url: string | null;
  primary_image_alt: string | null;
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


function ProductCard({
  product,
}: {
  product: StorefrontProduct;
}) {
  return (
    <article className="group w-[250px] shrink-0 sm:w-[270px] md:w-[290px] lg:w-[300px]">

      <Link
        href={`/products/${product.slug}`}
        className="block"
      >

        {/* PRODUCT IMAGE */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] bg-[#f3f3f3]">

          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={
                product.primary_image_alt ??
                product.name
              }
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-sm font-semibold tracking-[0.2em] text-black/20">
                SUSI
              </span>
            </div>
          )}


          {!product.is_available && (
            <span className="absolute left-3 top-3 rounded-md bg-black px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white">
              Sold out
            </span>
          )}

        </div>


        {/* PRODUCT DETAILS */}
        <div className="pt-4 text-center">

          <h3 className="text-[14px] font-normal leading-5 tracking-[0.01em] text-black/70 transition-colors group-hover:text-black">
            {product.name}
          </h3>


          {product.price !== null && (
            <p className="mt-1.5 text-[13px] font-normal text-black/45">
              {formatKRW(product.price)}
            </p>
          )}

        </div>

      </Link>

    </article>
  );
}


export default function ProductSlider({
  products,
}: {
  products: StorefrontProduct[];
}) {
  const sliderRef =
    useRef<HTMLDivElement>(null);


  function scrollLeft() {
    sliderRef.current?.scrollBy({
      left: -650,
      behavior: "smooth",
    });
  }


  function scrollRight() {
    sliderRef.current?.scrollBy({
      left: 650,
      behavior: "smooth",
    });
  }


  if (products.length === 0) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-[12px] bg-[#f5f5f5]">

        <p className="text-sm text-black/40">
          Coming soon.
        </p>

      </div>
    );
  }


  return (
    <div className="relative">

      {/* LEFT ARROW */}
      <button
        type="button"
        onClick={scrollLeft}
        aria-label="Previous products"
        className="absolute left-3 top-[38%] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-white/95 shadow-sm backdrop-blur transition duration-200 hover:scale-105 hover:shadow-md"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path
            d="M15 18l-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>


      {/* PRODUCT SLIDER */}
      <div
        ref={sliderRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-2"
      >

        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start"
          >
            <ProductCard
              product={product}
            />
          </div>
        ))}

      </div>


      {/* RIGHT ARROW */}
      <button
        type="button"
        onClick={scrollRight}
        aria-label="Next products"
        className="absolute right-3 top-[38%] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-white/95 shadow-sm backdrop-blur transition duration-200 hover:scale-105 hover:shadow-md"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path
            d="M9 18l6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

    </div>
  );
}