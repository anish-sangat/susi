import Link from "next/link";


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


function formatKRW(
  price: number | string
) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(price));
}


function productSearchText(
  product: StorefrontProduct
) {
  return `
    ${product.name}
    ${product.description ?? ""}
  `.toLowerCase();
}


function isTshirt(
  product: StorefrontProduct
) {
  const text = productSearchText(product);

  return (
    text.includes("t-shirt") ||
    text.includes("tshirt") ||
    text.includes("tee")
  );
}


function isHoodie(
  product: StorefrontProduct
) {
  const text = productSearchText(product);

  return (
    text.includes("hoodie") ||
    text.includes("hooded")
  );
}


function isJogger(
  product: StorefrontProduct
) {
  const text = productSearchText(product);

  return (
    text.includes("jogger") ||
    text.includes("joggers") ||
    text.includes("sweatpant") ||
    text.includes("track pant")
  );
}


function ProductCard({
  product,
}: {
  product: StorefrontProduct;
}) {
  return (
    <article className="group">

      <Link
        href={`/products/${product.slug}`}
        className="block"
      >

        {/* IMAGE */}
        <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-[12px] bg-[#f5f5f5]">

          {product.primary_image_url ? (

            <img
              src={product.primary_image_url}
              alt={
                product.primary_image_alt ??
                product.name
              }
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />

          ) : (

            <div className="flex h-full w-full items-center justify-center">

              <span className="text-sm font-semibold tracking-[0.2em] text-black/25">
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


        {/* PRODUCT INFO */}
        <div className="space-y-1">

          <h3 className="truncate text-sm font-medium leading-snug text-black/80 transition-colors group-hover:text-black">
            {product.name}
          </h3>


          {product.price !== null && (

            <p className="text-sm font-semibold">
              {formatKRW(product.price)}
            </p>

          )}

        </div>

      </Link>

    </article>
  );
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

        {/* HEADING */}
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
            {String(products.length).padStart(
              2,
              "0"
            )}{" "}
            products
          </p>

        </div>


        {/* PRODUCTS */}
        {products.length > 0 ? (

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">

            {products.map((product) => (

              <ProductCard
                key={product.id}
                product={product}
              />

            ))}

          </div>

        ) : (

          <div className="flex min-h-52 items-center justify-center rounded-[12px] bg-[#f5f5f5]">

            <p className="text-sm text-black/40">
              Coming soon.
            </p>

          </div>

        )}

      </div>

    </section>
  );
}


export default async function Home() {
  const products = await getProducts();

  const tshirts =
    products.filter(isTshirt);

  const hoodies =
    products.filter(isHoodie);

  const joggers =
    products.filter(isJogger);


  const heroProduct =
    products.find(
      (product) =>
        product.primary_image_url
    );


  return (
    <main className="min-h-screen bg-[#fcfcfc] text-[#1f1f1f]">

      {/* =========================================
          NAVBAR
      ========================================= */}

      <header className="sticky top-0 z-50 border-b border-[#e8e8e8] bg-[#fcfcfc]/95 backdrop-blur-md">

        <div className="susi-container flex h-16 items-center justify-between">

          {/* LOGO */}
          <Link
            href="/"
            className="text-xl font-bold tracking-[0.2em]"
          >
            SUSI
          </Link>


          {/* NAV */}
          <nav className="flex items-center gap-5 text-xs font-medium md:gap-8">

            <a
              href="#collection"
              className="hidden transition-opacity hover:opacity-50 sm:block"
            >
              Collection
            </a>

            <Link
              href="/cart"
              className="transition-opacity hover:opacity-50"
            >
              Cart
            </Link>

            <Link
              href="/account/orders"
              className="transition-opacity hover:opacity-50"
            >
              Account
            </Link>

          </nav>

        </div>

      </header>

{/* HERO */}
<section className="relative mx-4 h-[85vh] overflow-hidden md:mx-8">
  <img
    src="/hero.jpg"
    alt="SUSI hero"
    className="absolute inset-0 h-full w-full object-cover"
  />

  {/* dark overlay */}
  <div className="absolute inset-0 bg-black/35" />

  {/* content */}
  <div className="relative z-10 flex h-full items-center px-8 md:px-16">
    <div className="max-w-xl text-white">
      <p className="mb-4 text-xs tracking-[0.35em] uppercase">
        SUSI
      </p>

      <h1 className="text-5xl font-semibold leading-none md:text-7xl">
        Unisex Streetwear
      </h1>

      <p className="mt-6 max-w-md text-sm leading-6 text-white/80 md:text-base">
        Minimal essentials inspired by modern street culture.
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

      {/* =========================================
          COLLECTION — ALL PRODUCTS
      ========================================= */}

      <ProductSection
        id="collection"
        title="Collection"
        subtitle="All products"
        products={products}
      />


      {/* SEPARATOR */}
      <div className="susi-container border-t border-[#e8e8e8]" />


      {/* =========================================
          T-SHIRTS
      ========================================= */}

      <ProductSection
        id="t-shirts"
        title="T-Shirts"
        subtitle="Essentials"
        products={tshirts}
      />


      {/* SEPARATOR */}
      <div className="susi-container border-t border-[#e8e8e8]" />


      {/* =========================================
          HOODIES
      ========================================= */}

      <ProductSection
        id="hoodies"
        title="Hoodies"
        subtitle="Layers"
        products={hoodies}
      />


      {/* SEPARATOR */}
      <div className="susi-container border-t border-[#e8e8e8]" />


      {/* =========================================
          JOGGERS
      ========================================= */}

      <ProductSection
        id="joggers"
        title="Joggers"
        subtitle="Everyday"
        products={joggers}
      />


      {/* =========================================
          SIMPLE DARK FOOTER
      ========================================= */}

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

                <p>Instagram</p>

                <p>TikTok</p>

              </div>

            </div>

          </div>


          {/* BOTTOM */}
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