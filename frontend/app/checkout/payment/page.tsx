"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import * as PortOne from "@portone/browser-sdk/v2";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


const PORTONE_STORE_ID =
  process.env.NEXT_PUBLIC_PORTONE_STORE_ID;


const PORTONE_CHANNEL_KEY =
  process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;


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


type PaymentCreateResponse = {
  payment_id: string;
  order_id: string;
  payment_reference: string;
  amount: number | string;
  currency: string;
  status: string;
};


type PaymentVerifyResponse = {
  payment_id: string;
  order_id: string;
  provider: string;
  provider_payment_id: string;
  amount: number | string;
  currency: string;
  status: string;
};


function formatKRW(
  value: number | string
) {
  return new Intl.NumberFormat(
    "ko-KR",
    {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }
  ).format(Number(value));
}


function PaymentPageContent() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const orderId =
    searchParams.get("order");


  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [paying, setPaying] =
    useState(false);

  const [error, setError] =
    useState("");


  async function authenticatedFetch(
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

    const response =
      await fetch(
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

            Authorization:
              `Bearer ${token}`,

            ...options.headers,
          },
        }
      );


    if (
      response.status === 401
    ) {
      sessionStorage.removeItem(
        "susi_access_token"
      );

      router.push("/login");

      return null;
    }

    return response;
  }


  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setError(
          "No order was provided."
        );

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
        const response =
          await fetch(
            `${API_URL}/orders/${orderId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        if (
          response.status === 401
        ) {
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
            typeof data.detail ===
            "string"
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

        if (
          err instanceof Error
        ) {
          setError(
            err.message
          );
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


  async function handlePayment() {
    if (
      !order ||
      !orderId
    ) {
      return;
    }


    if (
      !PORTONE_STORE_ID ||
      !PORTONE_CHANNEL_KEY
    ) {
      setError(
        "PortOne configuration is missing."
      );

      return;
    }


    if (
      order.status_id !== 1
    ) {
      setError(
        "This order is no longer awaiting payment."
      );

      return;
    }


    setPaying(true);
    setError("");


    try {

      const createResponse =
        await authenticatedFetch(
          `/payments/${order.id}`,
          {
            method: "POST",
          }
        );


      if (!createResponse) {
        return;
      }


      const createData =
        await createResponse.json();


      if (!createResponse.ok) {

        if (
          typeof createData.detail ===
          "string"
        ) {
          throw new Error(
            createData.detail
          );
        }

        throw new Error(
          "Unable to prepare payment."
        );
      }


      const payment:
        PaymentCreateResponse =
        createData;


      const paymentResponse =
        await PortOne.requestPayment({
          storeId:
            PORTONE_STORE_ID,

          channelKey:
            PORTONE_CHANNEL_KEY,

          paymentId:
            payment.payment_reference,

          orderName:
            order.lines.length === 1
              ? order.lines[0]
                  .product_name
              : `SUSI Order - ${order.lines.length} items`,

          totalAmount:
            Number(
              order.total_amount
            ),

          currency: "KRW",

          payMethod: "CARD",

          customer: {
            email:
              order.customer_email,

            fullName:
              order.addresses.find(
                (address) =>
                  address.address_type ===
                  "shipping"
              )?.recipient_name,

            phoneNumber:
              order.addresses.find(
                (address) =>
                  address.address_type ===
                  "shipping"
              )?.phone_number,
          },
        });


      if (!paymentResponse) {
        throw new Error(
          "No response was received from PortOne."
        );
      }


      if (
        paymentResponse.code
      ) {
        throw new Error(
          paymentResponse.message ??
            "Payment was not completed."
        );
      }


      const verifyResponse =
        await authenticatedFetch(
          "/payments/verify",
          {
            method: "POST",

            body: JSON.stringify({
              payment_id:
                payment.payment_reference,
            }),
          }
        );


      if (!verifyResponse) {
        return;
      }


      const verifyData =
        await verifyResponse.json();


      if (!verifyResponse.ok) {

        if (
          typeof verifyData.detail ===
          "string"
        ) {
          throw new Error(
            verifyData.detail
          );
        }

        throw new Error(
          "Payment verification failed."
        );
      }


      const verifiedPayment:
        PaymentVerifyResponse =
        verifyData;


      if (
        verifiedPayment.status !==
        "paid"
      ) {
        throw new Error(
          "Payment has not been confirmed."
        );
      }


      router.push(
        `/checkout/success?order=${encodeURIComponent(
          order.id
        )}`
      );


    } catch (err) {

      if (
        err instanceof Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Payment could not be completed."
        );
      }

    } finally {
      setPaying(false);
    }
  }


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">

        <p className="text-sm text-neutral-500">
          Loading payment...
        </p>

      </main>
    );
  }


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
              Payment unavailable
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


  return (
    <main className="min-h-screen bg-white text-black">

      <header className="flex items-center justify-between px-6 py-6 md:px-14">

        <Link
          href="/"
          className="text-2xl font-bold tracking-[0.25em]"
        >
          SUSI
        </Link>


        <span className="text-xs tracking-[0.2em] text-neutral-500">
          SECURE PAYMENT
        </span>

      </header>


      <section className="mx-auto max-w-3xl px-6 py-12 md:px-14">

        <p className="text-xs tracking-[0.25em] text-neutral-500">
          CHECKOUT
        </p>


        <h1 className="mt-3 text-3xl font-medium md:text-4xl">
          Payment
        </h1>


        <p className="mt-3 text-sm text-neutral-500">
          Complete your payment securely
          through Toss Payments.
        </p>


        {error && (

          <div className="mt-8 border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm text-red-700">
              {error}
            </p>

          </div>

        )}


        <div className="mt-10 border border-neutral-200 p-6 md:p-8">

          <div className="flex items-center justify-between border-b border-neutral-200 pb-5">

            <div>

              <p className="text-xs text-neutral-500">
                ORDER
              </p>

              <p className="mt-1 text-sm font-medium">
                {order.order_number}
              </p>

            </div>


            <p className="text-xs text-neutral-500">
              KRW
            </p>

          </div>


          <div className="divide-y divide-neutral-200">

            {order.lines.map(
              (line) => (

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
                      Qty{" "}
                      {line.quantity}
                    </p>

                  </div>


                  <p className="whitespace-nowrap text-sm">
                    {formatKRW(
                      line.line_total
                    )}
                  </p>

                </div>

              )
            )}

          </div>


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


            <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-6">

              <span className="font-medium">
                Total
              </span>

              <span className="text-2xl font-medium">
                {formatKRW(
                  order.total_amount
                )}
              </span>

            </div>

          </div>


          <button
            type="button"
            onClick={
              handlePayment
            }
            disabled={
              paying ||
              order.status_id !== 1
            }
            className="mt-8 w-full bg-black px-6 py-4 text-sm font-medium tracking-[0.15em] text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {paying
              ? "OPENING PAYMENT..."
              : `PAY ${formatKRW(
                  order.total_amount
                )}`}
          </button>


          <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
            Payment is processed securely
            through Toss Payments.
          </p>

        </div>


        {order.reservation_expires_at && (

          <p className="mt-5 text-center text-xs text-neutral-500">
            Your items are temporarily
            reserved while payment is
            pending.
          </p>

        )}

      </section>

    </main>
  );
}


export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white text-black">

          <p className="text-sm text-neutral-500">
            Loading payment...
          </p>

        </main>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}