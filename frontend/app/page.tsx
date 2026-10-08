import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductSlider from "@/components/ProductSlider";


type StorefrontProduct = {
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


type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


async function getProducts(): Promise<
  StorefrontProduct[]
> {
  const response = await fetch(
    `${API_URL}/storefront/products`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load storefront products"
    );
  }

  return response.json();
}


async function getCategories(): Promise<
  Category[]
> {
  const response = await fetch(
    `${API_URL}/categories`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load categories"
    );
  }

  return response.json();
}


type ProductSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  products: StorefrontProduct[];
};


function ProductSection({
  id,
  title,
  subtitle,
  products,
}: ProductSectionProps) {
  return (
    <section
      id={id}
      className="py-16 md:py-24"
    >
      <div className="susi-container">

        <div className="mb-10 flex items-end justify-between gap-6">

          <div>

            {subtitle && (
              <p className="mb-2 text-xs uppercase tracking-[0.15em] text-black/45">
                {subtitle}
              </p>
            )}

            <h2 className="text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
              {title}
            </h2>

          </div>


          <p className="shrink-0 text-xs text-black/45">
            {String(
              products.length
            ).padStart(
              2,
              "0"
            )}{" "}
            products
          </p>

        </div>


        <ProductSlider
          products={products}
        />

      </div>
    </section>
  );
}


export default async function Home() {
  const [
    products,
    categories,
  ] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);


  const tshirtCategory =
    categories.find(
      (category) =>
        category.slug ===
        "t-shirts"
    );


  const hoodieCategory =
    categories.find(
      (category) =>
        category.slug ===
        "hoodies"
    );


  const joggerCategory =
    categories.find(
      (category) =>
        category.slug ===
        "joggers"
    );


  const tshirts =
    tshirtCategory
      ? products.filter(
          (product) =>
            product.category_id ===
            tshirtCategory.id
        )
      : [];


  const hoodies =
    hoodieCategory
      ? products.filter(
          (product) =>
            product.category_id ===
            hoodieCategory.id
        )
      : [];


  const joggers =
    joggerCategory
      ? products.filter(
          (product) =>
            product.category_id ===
            joggerCategory.id
        )
      : [];


  return (
    <main className="min-h-screen bg-[#fcfcfc] pt-16 text-[#1f1f1f]">

      {/* NAVBAR */}
      <Navbar />


      {/* HERO */}
      <section className="relative z-0 mx-4 h-[85vh] overflow-hidden md:mx-8">

        <img
          src="/hero.jpg"
          alt="SUSI hero"
          className="absolute inset-0 h-full w-full object-cover"
        />


        <div className="absolute inset-0 bg-black/35" />


        <div className="relative z-10 flex h-full items-center px-8 md:px-16">

          <div className="max-w-xl text-white">

            <p className="mb-4 text-xs uppercase tracking-[0.35em]">
              SUSI
            </p>


            <h1 className="text-5xl font-semibold leading-none md:text-7xl">
              Unisex Streetwear
            </h1>


            <p className="mt-6 max-w-md text-sm leading-6 text-white/80 md:text-base">
              Minimal essentials inspired by
              modern street culture.
            </p>


            <a
              href="#collection"
              className="mt-8 inline-block border border-white px-8 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black"
            >
              SHOP NOW
            </a>

          </div>

        </div>

      </section>


      {/* COLLECTION */}
      <ProductSection
        id="collection"
        title="Collection"
        subtitle="All products"
        products={products}
      />


      <div className="susi-container border-t border-[#e8e8e8]" />


      {/* T-SHIRTS */}
      <ProductSection
        id="t-shirts"
        title="T-Shirts"
        subtitle="Essentials"
        products={tshirts}
      />


      <div className="susi-container border-t border-[#e8e8e8]" />


      {/* HOODIES */}
      <ProductSection
        id="hoodies"
        title="Hoodies"
        subtitle="Layers"
        products={hoodies}
      />


      <div className="susi-container border-t border-[#e8e8e8]" />


      {/* JOGGERS */}
      <ProductSection
        id="joggers"
        title="Joggers"
        subtitle="Everyday"
        products={joggers}
      />


      {/* FOOTER */}
      <footer className="mt-8 bg-[#1f1f1f] text-white">

        <div className="susi-container py-12 md:py-16">

          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

            {/* BRAND */}
            <div className="col-span-2 md:col-span-1">

              <Link
                href="/"
                className="inline-block text-xl font-bold tracking-[0.2em]"
              >
                SUSI
              </Link>


              <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">
                Unisex fashion.
                <br />
                Made for everyone.
              </p>

            </div>


            {/* SHOP */}
            <div>

              <p className="mb-4 text-xs font-medium text-white/45">
                Shop
              </p>


              <div className="space-y-2 text-sm">

                <a
                  href="#collection"
                  className="block text-white/80 transition-colors hover:text-white"
                >
                  Collection
                </a>

                <a
                  href="#t-shirts"
                  className="block text-white/80 transition-colors hover:text-white"
                >
                  T-Shirts
                </a>

                <a
                  href="#hoodies"
                  className="block text-white/80 transition-colors hover:text-white"
                >
                  Hoodies
                </a>

                <a
                  href="#joggers"
                  className="block text-white/80 transition-colors hover:text-white"
                >
                  Joggers
                </a>

              </div>

            </div>


            {/* ACCOUNT */}
            <div>

              <p className="mb-4 text-xs font-medium text-white/45">
                Account
              </p>


              <div className="space-y-2 text-sm">

                <Link
                  href="/login"
                  className="block text-white/80 transition-colors hover:text-white"
                >
                  Login
                </Link>

                <Link
                  href="/account/orders"
                  className="block text-white/80 transition-colors hover:text-white"
                >
                  Orders
                </Link>

              </div>

            </div>


            {/* FOLLOW */}
            <div>

              <p className="mb-4 text-xs font-medium text-white/45">
                Follow
              </p>


              <div className="space-y-2 text-sm text-white/80">

                <p>
                  Instagram
                </p>

                <p>
                  TikTok
                </p>

              </div>

            </div>

          </div>


          {/* BOTTOM FOOTER */}
          <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-7 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © {new Date().getFullYear()} SUSI
            </p>


            <div className="flex gap-6">

              <span>
                South Korea
              </span>

              <span>
                KRW
              </span>

            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}