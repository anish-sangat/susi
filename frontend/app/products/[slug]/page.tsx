import { notFound } from "next/navigation";

import ProductDetails from "./ProductDetails";


export type ProductOption = {
  variation_id: string;
  variation_name: string;
  option_id: string;
  option_value: string;
  sort_order: number;
};


export type ProductVariant = {
  id: string;
  sku: string;
  price: number | string;
  qty_in_stock: number;
  is_available: boolean;
  options: ProductOption[];
};


export type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};


export type StorefrontProductDetail = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;

  price: number | string | null;
  qty_in_stock: number;
  is_available: boolean;

  images: ProductImage[];
  variants: ProductVariant[];
};


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";


async function getProduct(
  slug: string
): Promise<StorefrontProductDetail | null> {
  const response = await fetch(
    `${API_URL}/storefront/products/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load product");
  }

  return response.json();
}


type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};


export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}