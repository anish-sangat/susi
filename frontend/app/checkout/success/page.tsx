"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type OrderLine = {
  id: string;
  product_item_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
};


type OrderAddress = {
  id: string;
  address_type: string;
  recipient_name: string;
  phone_number: string;
  postal_code: string;
  city: string;
  district: string;
  address_line1: string;
  address_line2: string | null;
};


type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status_id: number;
  shipping_method_id: number;
  customer_email: string;
  currency: string;

  subtotal: number | string;
  discount_amount: number | string;
  shipping_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;

  notes: string | null;
  reservation_expires_at: string | null;

  lines: OrderLine[];
  addresses: OrderAddress[];
};


function formatKRW(value: number | string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(value));
}


export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("order");

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setError("No order was provided.");
        setLoading(false);
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

      try {
        const response = await fetch(
          `${API_URL}/orders/${orderId}`,
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
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          if (
            typeof data.detail === "string"
          ) {
            throw new Error(
              data.detail
            );
          }

          throw new Error(
            "Unable to load order."
          );
        }

        setOrder(data);

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to load order."
          );
        }

      } finally {
        setLoading(false);
      }
    }

    loadOrder();

  }, [orderId, router]);


  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        <p className="text-sm text-neutral-500">
          Loading order...
        </p>
      </main>
    );
  }


  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  if (!order) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-xl">

          <Link
            href="/"
            className="text-2xl font-bold tracking-[0.25em]"
          >
            SUSI
          </Link>

          <div className="mt-16 border border-neutral-200 p-8">

            <h1 className="text-2xl font-medium">
              Order unavailable
            </h1>

            <p className="mt-4 text-sm text-red-600">
              {error ||
                "Unable to load this order."}
            </p>

            <Link
              href="/"
              className="mt-8 inline-block bg-black px-6 py-3 text-sm text-white"
            >
              RETURN HOME
            </Link>

          </div>

        </div>
      </main>
    );
  }


  const shippingAddress =
    order.addresses.find(
      (address) =>
        address.address_type === "shipping"
    );


  // -------------------------------------------------------
  // ORDER STATUS
  // -------------------------------------------------------

  const paymentConfirmed =
    order.status_id === 2;

  const paymentPending =
    order.status_id === 1;

  const paymentFailed =
    order.status_id === 6;


  // -------------------------------------------------------
  // PAGE
  // -------------------------------------------------------

  return (
    <main className="min-h-screen bg-white text-black">

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-6 md:px-14">

        <Link
          href="/"
          className="text-2xl font-bold tracking-[0.25em]"
        >
          SUSI
        </Link>

        <span className="text-xs tracking-[0.2em] text-neutral-500">
          ORDER
        </span>

      </header>


      <section className="mx-auto max-w-3xl px-6 py-12 md:px-14">


        {/* ORDER STATUS MESSAGE */}
        <div className="text-center">


          {/* PAID */}
          {paymentConfirmed && (
            <>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl text-white">
                ✓
              </div>

              <p className="mt-8 text-xs tracking-[0.25em] text-neutral-500">
                THANK YOU
              </p>

              <h1 className="mt-3 text-3xl font-medium md:text-4xl">
                Order confirmed
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-neutral-500">
                Your payment has been confirmed
                and your SUSI order has been
                received.
              </p>

            </>
          )}


          {/* PENDING */}
          {paymentPending && (
            <>

              <p className="text-xs tracking-[0.25em] text-neutral-500">
                PAYMENT
              </p>

              <h1 className="mt-3 text-3xl font-medium">
                Payment pending
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-neutral-500">
                This order has not yet been
                confirmed as paid.
              </p>

              <Link
                href={`/checkout/payment?order=${encodeURIComponent(
                  order.id
                )}`}
                className="mt-7 inline-block bg-black px-7 py-3 text-sm text-white"
              >
                RETURN TO PAYMENT
              </Link>

            </>
          )}


          {/* FAILED / EXPIRED */}
          {paymentFailed && (
            <>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-neutral-300 text-2xl">
                ×
              </div>

              <p className="mt-8 text-xs tracking-[0.25em] text-neutral-500">
                PAYMENT
              </p>

              <h1 className="mt-3 text-3xl font-medium">
                Payment unsuccessful
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-neutral-500">
                This order was not completed.
                Any reserved inventory has been
                released.
              </p>

              <Link
                href="/"
                className="mt-7 inline-block bg-black px-7 py-3 text-sm text-white"
              >
                CONTINUE SHOPPING
              </Link>

            </>
          )}


          {/* UNKNOWN STATUS */}
          {!paymentConfirmed &&
            !paymentPending &&
            !paymentFailed && (
              <>

                <p className="text-xs tracking-[0.25em] text-neutral-500">
                  ORDER
                </p>

                <h1 className="mt-3 text-3xl font-medium">
                  Order status updated
                </h1>

                <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-neutral-500">
                  Your order status has changed.
                  Please check your order details
                  for the latest information.
                </p>

              </>
            )}

        </div>


        {/* ORDER INFORMATION */}
        <div className="mt-14 border border-neutral-200 p-6 md:p-8">

          <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row">

            <div>

              <p className="text-xs tracking-wider text-neutral-500">
                ORDER NUMBER
              </p>

              <p className="mt-2 break-all text-sm font-medium">
                {order.order_number}
              </p>

            </div>


            <div className="sm:text-right">

              <p className="text-xs tracking-wider text-neutral-500">
                TOTAL
              </p>

              <p className="mt-2 text-lg font-medium">
                {formatKRW(
                  order.total_amount
                )}
              </p>

            </div>

          </div>


          {/* ITEMS */}
          <div className="divide-y divide-neutral-200">

            {order.lines.map((line) => (

              <div
                key={line.id}
                className="flex justify-between gap-8 py-5"
              >

                <div>

                  <p className="text-sm font-medium">
                    {line.product_name}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {line.sku}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Qty {line.quantity}
                  </p>

                </div>


                <p className="whitespace-nowrap text-sm">
                  {formatKRW(
                    line.line_total
                  )}
                </p>

              </div>

            ))}

          </div>


          {/* TOTALS */}
          <div className="border-t border-neutral-200 pt-5">

            <div className="flex justify-between text-sm">

              <span>
                Subtotal
              </span>

              <span>
                {formatKRW(
                  order.subtotal
                )}
              </span>

            </div>


            {Number(
              order.discount_amount
            ) > 0 && (

              <div className="mt-3 flex justify-between text-sm">

                <span>
                  Discount
                </span>

                <span>
                  -
                  {formatKRW(
                    order.discount_amount
                  )}
                </span>

              </div>

            )}


            <div className="mt-3 flex justify-between text-sm">

              <span>
                Shipping
              </span>

              <span>
                {Number(
                  order.shipping_amount
                ) === 0
                  ? "Free"
                  : formatKRW(
                      order.shipping_amount
                    )}
              </span>

            </div>


            {Number(
              order.tax_amount
            ) > 0 && (

              <div className="mt-3 flex justify-between text-sm">

                <span>
                  Tax
                </span>

                <span>
                  {formatKRW(
                    order.tax_amount
                  )}
                </span>

              </div>

            )}


            <div className="mt-6 flex justify-between border-t border-neutral-200 pt-6">

              <span className="font-medium">
                Total
              </span>

              <span className="text-xl font-medium">
                {formatKRW(
                  order.total_amount
                )}
              </span>

            </div>

          </div>

        </div>


        {/* SHIPPING ADDRESS */}
        {shippingAddress && (

          <div className="mt-6 border border-neutral-200 p-6 md:p-8">

            <h2 className="text-sm font-medium">
              Shipping address
            </h2>

            <div className="mt-4 text-sm leading-6 text-neutral-600">

              <p>
                {shippingAddress.recipient_name}
              </p>

              <p>
                {shippingAddress.address_line1}
              </p>

              {shippingAddress.address_line2 && (
                <p>
                  {shippingAddress.address_line2}
                </p>
              )}

              <p>
                {shippingAddress.district},{" "}
                {shippingAddress.city}
              </p>

              <p>
                {shippingAddress.postal_code}
              </p>

              <p className="mt-2">
                {shippingAddress.phone_number}
              </p>

            </div>

          </div>

        )}


        {/* PAID ORDER ACTION */}
        {paymentConfirmed && (

          <div className="mt-10 flex justify-center">

            <Link
              href="/"
              className="bg-black px-8 py-4 text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-80"
            >
              CONTINUE SHOPPING
            </Link>

          </div>

        )}

      </section>


      <footer className="px-8 pb-8 pt-16 md:px-14">

        <div className="border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          © {new Date().getFullYear()} SUSI
        </div>

      </footer>

    </main>
  );
}