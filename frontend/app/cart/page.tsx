"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type CartItem = {
  id: string;
  product_item_id: string;
  quantity: number;
  sku: string;
  product_name: string;
  unit_price: number | string;
  line_total: number | string;
};


type Cart = {
  id: string;
  user_id: string;
  items: CartItem[];
  subtotal: number | string;
};


function formatKRW(price: number | string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(price));
}


export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] =
    useState<Cart | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingItemId, setUpdatingItemId] =
    useState<string | null>(null);


  // -------------------------------------------------------
  // AUTHENTICATED REQUEST
  // -------------------------------------------------------

  async function cartRequest(
    path: string,
    options: RequestInit = {}
  ) {
    const token =
      sessionStorage.getItem(
        "susi_access_token"
      );

    if (!token) {
      router.push("/login");
      return null;
    }

    const response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers: {
          ...(options.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
          Authorization: `Bearer ${token}`,
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


  // -------------------------------------------------------
  // LOAD CART
  // -------------------------------------------------------

  async function loadCart() {
    setLoading(true);
    setError("");

    try {
      const response =
        await cartRequest("/cart");

      if (!response) {
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.detail ??
            "Unable to load cart"
        );
        return;
      }

      setCart(data);

    } catch {
      setError(
        "Unable to connect to the server"
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadCart();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // -------------------------------------------------------
  // UPDATE QUANTITY
  // -------------------------------------------------------

  async function updateQuantity(
    item: CartItem,
    quantity: number
  ) {
    if (quantity < 1) {
      return;
    }

    setUpdatingItemId(item.id);
    setError("");

    try {
      const response =
        await cartRequest(
          `/cart/items/${item.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              quantity,
            }),
          }
        );

      if (!response) {
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.detail ??
            "Unable to update quantity"
        );
        return;
      }

      setCart(data);

    } catch {
      setError(
        "Unable to connect to the server"
      );

    } finally {
      setUpdatingItemId(null);
    }
  }


  // -------------------------------------------------------
  // REMOVE ITEM
  // -------------------------------------------------------

  async function removeItem(
    itemId: string
  ) {
    setUpdatingItemId(itemId);
    setError("");

    try {
      const response =
        await cartRequest(
          `/cart/items/${itemId}`,
          {
            method: "DELETE",
          }
        );

      if (!response) {
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.detail ??
            "Unable to remove item"
        );
        return;
      }

      setCart(data);

    } catch {
      setError(
        "Unable to connect to the server"
      );

    } finally {
      setUpdatingItemId(null);
    }
  }


  // -------------------------------------------------------
  // CHECKOUT
  // -------------------------------------------------------

  function goToCheckout() {
    if (!cart || cart.items.length === 0) {
      return;
    }

    router.push("/checkout");
  }


  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-black">

        <header className="flex items-center justify-between px-6 py-6 md:px-14">

          <Link
            href="/"
            className="text-2xl font-bold tracking-[0.25em]"
          >
            SUSI
          </Link>

        </header>

        <div className="flex min-h-[70vh] items-center justify-center">

          <p className="text-sm text-neutral-500">
            Loading cart...
          </p>

        </div>

      </main>
    );
  }


  // -------------------------------------------------------
  // CART
  // -------------------------------------------------------

  return (
    <main className="min-h-screen bg-white text-black">

      {/* NAVBAR */}
      <header className="flex items-center justify-between px-6 py-6 md:px-14">

        <Link
          href="/"
          className="text-2xl font-bold tracking-[0.25em]"
        >
          SUSI
        </Link>

        <Link
          href="/#collection"
          className="text-sm font-medium transition-opacity hover:opacity-50"
        >
          CONTINUE SHOPPING
        </Link>

      </header>


      {/* CART */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-14">

        <div className="mb-12 flex items-end justify-between">

          <div>

            <p className="mb-3 text-xs tracking-[0.25em] text-neutral-500">
              SUSI
            </p>

            <h1 className="text-3xl font-medium md:text-4xl">
              Shopping cart
            </h1>

          </div>


          {cart && (
            <p className="text-sm text-neutral-500">

              {cart.items.reduce(
                (total, item) =>
                  total + item.quantity,
                0
              )}{" "}

              item

              {cart.items.reduce(
                (total, item) =>
                  total + item.quantity,
                0
              ) === 1
                ? ""
                : "s"}

            </p>
          )}

        </div>


        {/* ERROR */}
        {error && (
          <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3">

            <p className="text-sm text-red-700">
              {error}
            </p>

          </div>
        )}


        {/* EMPTY CART */}
        {cart && cart.items.length === 0 ? (

          <div className="border-t border-neutral-200 py-20">

            <p className="text-lg">
              Your cart is empty.
            </p>

            <Link
              href="/#collection"
              className="mt-6 inline-block border-b border-black pb-1 text-sm"
            >
              Continue shopping
            </Link>

          </div>

        ) : cart ? (

          <div>

            {/* ITEMS */}
            <div className="border-t border-neutral-200">

              {cart.items.map((item) => {

                const updating =
                  updatingItemId === item.id;

                return (

                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-6 border-b border-neutral-200 py-8 md:grid-cols-[1fr_auto_auto]"
                  >

                    {/* PRODUCT */}
                    <div>

                      <h2 className="text-base font-medium">
                        {item.product_name}
                      </h2>

                      <p className="mt-2 text-xs text-neutral-500">
                        SKU: {item.sku}
                      </p>

                      <p className="mt-3 text-sm">
                        {formatKRW(
                          item.unit_price
                        )}
                      </p>

                    </div>


                    {/* QUANTITY */}
                    <div className="flex items-center gap-4 md:px-10">

                      <button
                        type="button"
                        disabled={
                          updating ||
                          item.quantity <= 1
                        }
                        onClick={() =>
                          updateQuantity(
                            item,
                            item.quantity - 1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center border border-neutral-300 text-lg transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span className="min-w-6 text-center text-sm">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          updateQuantity(
                            item,
                            item.quantity + 1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center border border-neutral-300 text-lg transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>

                    </div>


                    {/* PRICE / REMOVE */}
                    <div className="flex items-center justify-between gap-8 md:min-w-44 md:justify-end">

                      <p className="text-sm font-medium">
                        {formatKRW(
                          item.line_total
                        )}
                      </p>

                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="text-xs text-neutral-500 underline underline-offset-4 transition-colors hover:text-black disabled:opacity-30"
                      >
                        REMOVE
                      </button>

                    </div>

                  </div>

                );
              })}

            </div>


            {/* SUMMARY */}
            <div className="ml-auto mt-12 w-full max-w-md">

              <div className="flex items-center justify-between border-b border-neutral-200 pb-5">

                <p className="text-sm">
                  Subtotal
                </p>

                <p className="text-lg font-medium">
                  {formatKRW(
                    cart.subtotal
                  )}
                </p>

              </div>


              <p className="mt-4 text-xs leading-5 text-neutral-500">
                Shipping will be calculated at
                checkout.
              </p>


              <button
                type="button"
                onClick={goToCheckout}
                className="mt-8 w-full bg-black px-6 py-4 text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-80"
              >
                CHECKOUT
              </button>

            </div>

          </div>

        ) : null}

      </section>


      {/* FOOTER */}
      <footer className="px-8 pb-8 pt-16 md:px-14">

        <div className="border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          © {new Date().getFullYear()} SUSI
        </div>

      </footer>

    </main>
  );
}