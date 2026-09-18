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
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";


async function getProducts(): Promise<StorefrontProduct[]> {
  const response = await fetch(
    `${API_URL}/storefront/products`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load storefront products");
  }

  return response.json();
}


function formatKRW(price: number | string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(price));
}


export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white text-black">

      {/* NAVBAR */}
      <header className="flex items-center justify-between px-8 py-6 md:px-14">

        <Link
          href="/"
          className="text-2xl font-bold tracking-[0.25em]"
        >
          SUSI
        </Link>

        <nav className="flex items-center gap-8 text-sm font-medium">

          <a
            href="#collection"
            className="transition-opacity hover:opacity-50"
          >
            COLLECTION
          </a>

          <button
            type="button"
            className="transition-opacity hover:opacity-50"
          >
            CART (0)
          </button>

        </nav>

      </header>


      {/* HERO */}
      <section className="relative mx-4 h-[72vh] overflow-hidden bg-neutral-200 md:mx-8">

        <div className="absolute inset-0 flex items-center justify-center">

          <div className="text-center">

            <h1 className="text-5xl font-semibold tracking-tight md:text-8xl">
              SUSI
            </h1>

            <p className="mt-4 text-sm tracking-[0.3em] md:text-base">
              UNISEX FASHION
            </p>

            <a
              href="#collection"
              className="mt-8 inline-block border border-black px-8 py-3 text-sm font-medium transition-colors hover:bg-black hover:text-white"
            >
              SHOP COLLECTION
            </a>

          </div>

        </div>

      </section>


      {/* COLLECTION */}
      <section
        id="collection"
        className="px-8 py-24 md:px-14"
      >

        <div className="mb-12 flex items-end justify-between">

          <div>

            <p className="mb-2 text-xs tracking-[0.25em] text-neutral-500">
              SUSI
            </p>

            <h2 className="text-3xl font-medium md:text-5xl">
              Collection
            </h2>

          </div>

          <span className="text-sm text-neutral-500">
            {String(products.length).padStart(2, "0")} Products
          </span>

        </div>


        <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">

          {products.map((product) => (

            <article
              key={product.id}
              className="group"
            >

              <Link
                href={`/products/${product.slug}`}
                className="block"
              >

                {/* PRODUCT IMAGE */}
                <div className="aspect-[3/4] overflow-hidden bg-neutral-100">

                  {product.primary_image_url ? (

                    <img
                      src={product.primary_image_url}
                      alt={
                        product.primary_image_alt ??
                        product.name
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />

                  ) : (

                    <div className="h-full w-full bg-neutral-100" />

                  )}

                </div>


                {/* PRODUCT INFO */}
                <div className="mt-4 flex items-start justify-between gap-4">

                  <div>

                    <h3 className="text-sm font-medium">
                      {product.name}
                    </h3>

                    {product.price !== null && (

                      <p className="mt-1 text-sm text-neutral-500">
                        {formatKRW(product.price)}
                      </p>

                    )}

                  </div>


                  {!product.is_available && (

                    <span className="text-xs text-neutral-400">
                      SOLD OUT
                    </span>

                  )}

                </div>

              </Link>

            </article>

          ))}

        </div>

      </section>


      {/* FOOTER */}
      <footer className="px-8 pb-8 pt-12 md:px-14">

        <div className="grid grid-cols-2 gap-10 pb-10 md:grid-cols-4">

          <div>

            <h3 className="mb-3 font-semibold tracking-[0.2em]">
              SUSI
            </h3>

            <p className="text-sm leading-6 text-neutral-600">
              Unisex fashion.
              <br />
              Made for everyone.
            </p>

          </div>


          <div>

            <p className="mb-3 text-xs font-semibold tracking-wider">
              SHOP
            </p>

            <a
              href="#collection"
              className="text-sm text-neutral-600 hover:text-black"
            >
              Collection
            </a>

          </div>


          <div>

            <p className="mb-3 text-xs font-semibold tracking-wider">
              HELP
            </p>

            <p className="text-sm text-neutral-600">
              Contact
            </p>

          </div>


          <div>

            <p className="mb-3 text-xs font-semibold tracking-wider">
              FOLLOW
            </p>

            <div className="space-y-1 text-sm text-neutral-600">
              <p>Instagram</p>
              <p>TikTok</p>
            </div>

          </div>

        </div>


        <div className="border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          © {new Date().getFullYear()} SUSI
        </div>

      </footer>

    </main>
  );
}