"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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


function getStatusLabel(statusId: number) {
  if (statusId === 1) {
    return "Payment pending";
  }

  if (statusId === 2) {
    return "Confirmed";
  }

  if (statusId === 6) {
    return "Failed / Expired";
  }

  return "Processing";
}


export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadOrders() {
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
          `${API_URL}/orders`,
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
            throw new Error(data.detail);
          }

          throw new Error(
            "Unable to load orders."
          );
        }

        setOrders(data);

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to load orders."
          );
        }

      } finally {
        setLoading(false);
      }
    }

    loadOrders();

  }, [router]);


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        <p className="text-sm text-neutral-500">
          Loading orders...
        </p>
      </main>
    );
  }


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

        <Link
          href="/"
          className="text-xs tracking-[0.2em]"
        >
          SHOP
        </Link>

      </header>


      <section className="mx-auto max-w-4xl px-6 py-12 md:px-14">

        <p className="text-xs tracking-[0.25em] text-neutral-500">
          ACCOUNT
        </p>

        <h1 className="mt-3 text-3xl font-medium md:text-4xl">
          My orders
        </h1>


        {/* ERROR */}
        {error && (
          <div className="mt-8 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* EMPTY */}
        {!error &&
          orders.length === 0 && (

            <div className="mt-12 border border-neutral-200 p-8 text-center">

              <h2 className="text-lg font-medium">
                No orders yet
              </h2>

              <p className="mt-3 text-sm text-neutral-500">
                Your SUSI orders will appear
                here after checkout.
              </p>

              <Link
                href="/"
                className="mt-7 inline-block bg-black px-7 py-3 text-sm text-white"
              >
                START SHOPPING
              </Link>

            </div>

          )}


        {/* ORDERS */}
        <div className="mt-10 space-y-5">

          {orders.map((order) => (

            <div
              key={order.id}
              className="border border-neutral-200"
            >

              {/* ORDER HEADER */}
              <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 p-5 sm:flex-row sm:items-center">

                <div>

                  <p className="text-xs tracking-wider text-neutral-500">
                    ORDER
                  </p>

                  <p className="mt-1 break-all text-sm font-medium">
                    {order.order_number}
                  </p>

                </div>


                <div className="sm:text-right">

                  <p className="text-xs tracking-wider text-neutral-500">
                    STATUS
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {getStatusLabel(
                      order.status_id
                    )}
                  </p>

                </div>

              </div>


              {/* ITEMS */}
              <div className="divide-y divide-neutral-100 px-5">

                {order.lines.map((line) => (

                  <div
                    key={line.id}
                    className="flex justify-between gap-6 py-4"
                  >

                    <div>

                      <p className="text-sm">
                        {line.product_name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {line.sku}
                        {" · "}
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


              {/* FOOTER */}
              <div className="flex flex-col justify-between gap-4 border-t border-neutral-200 p-5 sm:flex-row sm:items-center">

                <div>

                  <p className="text-xs text-neutral-500">
                    Total
                  </p>

                  <p className="mt-1 text-lg font-medium">
                    {formatKRW(
                      order.total_amount
                    )}
                  </p>

                </div>


                <div className="flex flex-wrap gap-3">

                  {order.status_id === 1 && (

                    <Link
                      href={`/checkout/payment?order=${encodeURIComponent(
                        order.id
                      )}`}
                      className="border border-black px-5 py-3 text-xs font-medium tracking-wider"
                    >
                      CONTINUE PAYMENT
                    </Link>

                  )}

                  <Link
                    href={`/checkout/success?order=${encodeURIComponent(
                      order.id
                    )}`}
                    className="bg-black px-5 py-3 text-xs font-medium tracking-wider text-white"
                    style={{
                      backgroundColor: "#111111",
                      color: "#ffffff",
                    }}
                  >
                    VIEW ORDER
                  </Link>

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>


      <footer className="px-8 pb-8 pt-16 md:px-14">

        <div className="border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          © {new Date().getFullYear()} SUSI
        </div>

      </footer>

    </main>
  );
}