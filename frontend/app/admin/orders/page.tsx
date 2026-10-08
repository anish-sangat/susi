"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type OrderLine = {
  id: string;
  order_id: string;
  product_item_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
};


type OrderAddress = {
  id: string;
  order_id: string;
  address_type: string;
  recipient_name: string;
  phone_number: string;
  postal_code: string;
  city: string;
  district: string | null;
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


function getStatusLabel(
  statusId: number
) {
  if (statusId === 1) {
    return "Pending";
  }

  if (statusId === 2) {
    return "Paid";
  }

  if (statusId === 6) {
    return "Failed";
  }

  return `Status ${statusId}`;
}


function getStatusStyle(
  statusId: number
) {
  if (statusId === 1) {
    return {
      backgroundColor: "#fff7ed",
      color: "#9a3412",
      borderColor: "#fed7aa",
    };
  }

  if (statusId === 2) {
    return {
      backgroundColor: "#f0fdf4",
      color: "#166534",
      borderColor: "#bbf7d0",
    };
  }

  if (statusId === 6) {
    return {
      backgroundColor: "#fef2f2",
      color: "#b91c1c",
      borderColor: "#fecaca",
    };
  }

  return {
    backgroundColor: "#f5f5f5",
    color: "#525252",
    borderColor: "#e5e5e5",
  };
}


export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [
    expandedOrder,
    setExpandedOrder,
  ] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      setError("");


      try {
        const token =
          sessionStorage.getItem(
            "susi_access_token"
          );


        if (!token) {
          router.push("/login");
          return;
        }


        // Check admin account first
        const meResponse =
          await fetch(
            `${API_URL}/auth/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache: "no-store",
            }
          );


        if (
          meResponse.status === 401
        ) {
          sessionStorage.removeItem(
            "susi_access_token"
          );

          router.push("/login");
          return;
        }


        const meData =
          await meResponse.json();


        if (
          !meResponse.ok ||
          meData.role !== "admin"
        ) {
          router.push("/");
          return;
        }


        // Load every customer order
        const response =
          await fetch(
            `${API_URL}/orders/admin/all`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache: "no-store",
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
          throw new Error(
            data.detail ??
              "Unable to load orders"
          );
        }


        setOrders(data);

      } catch (err) {

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to load orders"
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
      <main
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundColor: "#fcfcfc",
          color: "#111111",
        }}
      >
        <p
          className="text-sm"
          style={{
            color: "#777777",
          }}
        >
          Loading orders...
        </p>
      </main>
    );
  }


  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "#fcfcfc",
        color: "#111111",
      }}
    >

      {/* HEADER */}
      <header
        className="border-b"
        style={{
          borderColor: "#e5e5e5",
          backgroundColor: "#fcfcfc",
        }}
      >
        <div className="susi-container flex h-16 items-center justify-between">

          <div className="flex items-center gap-6">

            <Link
              href="/admin"
              className="text-xl font-bold tracking-[0.2em]"
            >
              SUSI
            </Link>

            <span
              className="text-xs tracking-[0.15em]"
              style={{
                color: "#777777",
              }}
            >
              ADMIN
            </span>

          </div>


          <div className="flex items-center gap-6">

            <Link
              href="/admin/products"
              className="text-xs font-medium"
            >
              PRODUCTS
            </Link>

            <Link
              href="/admin/categories"
              className="text-xs font-medium"
            >
              CATEGORIES
            </Link>

            <Link
              href="/admin"
              className="text-xs font-medium"
            >
              DASHBOARD
            </Link>

          </div>

        </div>
      </header>


      <section className="susi-container py-12">

        {/* PAGE TITLE */}
        <div
          className="border-b pb-8"
          style={{
            borderColor: "#e5e5e5",
          }}
        >

          <p
            className="text-xs uppercase tracking-[0.18em]"
            style={{
              color: "#777777",
            }}
          >
            Sales
          </p>


          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                Orders
              </h1>

              <p
                className="mt-3 text-sm"
                style={{
                  color: "#777777",
                }}
              >
                Review customer orders,
                payment status and shipping
                information.
              </p>

            </div>


            <p
              className="text-sm"
              style={{
                color: "#777777",
              }}
            >
              {orders.length}{" "}
              {orders.length === 1
                ? "order"
                : "orders"}
            </p>

          </div>

        </div>


        {/* ERROR */}
        {error && (
          <div
            className="mt-8 border px-5 py-4"
            style={{
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
            }}
          >
            <p
              className="text-sm"
              style={{
                color: "#b91c1c",
              }}
            >
              {error}
            </p>
          </div>
        )}


        {/* NO ORDERS */}
        {!error &&
          orders.length === 0 && (

          <div
            className="mt-10 flex min-h-64 items-center justify-center border"
            style={{
              borderColor: "#e5e5e5",
              backgroundColor: "#ffffff",
            }}
          >
            <div className="text-center">

              <h2 className="font-medium">
                No orders yet
              </h2>

              <p
                className="mt-2 text-sm"
                style={{
                  color: "#777777",
                }}
              >
                Customer orders will
                appear here.
              </p>

            </div>
          </div>

        )}


        {/* ORDERS */}
        {orders.length > 0 && (

          <div className="mt-10 space-y-4">

            {orders.map(
              (order) => {

                const expanded =
                  expandedOrder ===
                  order.id;

                const shippingAddress =
                  order.addresses.find(
                    (address) =>
                      address.address_type ===
                      "shipping"
                  );

                const statusStyle =
                  getStatusStyle(
                    order.status_id
                  );


                return (

                  <article
                    key={order.id}
                    className="overflow-hidden border"
                    style={{
                      borderColor:
                        "#e5e5e5",
                      backgroundColor:
                        "#ffffff",
                    }}
                  >

                    {/* ORDER SUMMARY */}
                    <div className="grid gap-5 p-6 md:grid-cols-[1.2fr_1.3fr_0.8fr_0.8fr_auto] md:items-center">

                      {/* ORDER NUMBER */}
                      <div>

                        <p
                          className="text-xs uppercase tracking-[0.1em]"
                          style={{
                            color:
                              "#777777",
                          }}
                        >
                          Order
                        </p>

                        <p className="mt-1 font-medium">
                          {order.order_number}
                        </p>

                      </div>


                      {/* CUSTOMER */}
                      <div>

                        <p
                          className="text-xs uppercase tracking-[0.1em]"
                          style={{
                            color:
                              "#777777",
                          }}
                        >
                          Customer
                        </p>

                        <p className="mt-1 text-sm">
                          {
                            order.customer_email
                          }
                        </p>

                      </div>


                      {/* STATUS */}
                      <div>

                        <p
                          className="text-xs uppercase tracking-[0.1em]"
                          style={{
                            color:
                              "#777777",
                          }}
                        >
                          Status
                        </p>

                        <span
                          className="mt-2 inline-block border px-2.5 py-1 text-xs font-medium"
                          style={
                            statusStyle
                          }
                        >
                          {getStatusLabel(
                            order.status_id
                          )}
                        </span>

                      </div>


                      {/* TOTAL */}
                      <div>

                        <p
                          className="text-xs uppercase tracking-[0.1em]"
                          style={{
                            color:
                              "#777777",
                          }}
                        >
                          Total
                        </p>

                        <p className="mt-1 font-medium">
                          {formatKRW(
                            order.total_amount
                          )}
                        </p>

                      </div>


                      {/* DETAILS BUTTON */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrder(
                            expanded
                              ? null
                              : order.id
                          )
                        }
                        className="w-fit border px-4 py-2.5 text-xs font-medium"
                        style={{
                          borderColor:
                            "#d9d9d9",
                          backgroundColor:
                            "#ffffff",
                        }}
                      >
                        {expanded
                          ? "HIDE DETAILS"
                          : "VIEW DETAILS"}
                      </button>

                    </div>


                    {/* EXPANDED DETAILS */}
                    {expanded && (

                      <div
                        className="border-t"
                        style={{
                          borderColor:
                            "#e5e5e5",
                          backgroundColor:
                            "#fafafa",
                        }}
                      >

                        <div className="grid gap-10 p-6 lg:grid-cols-2">

                          {/* PRODUCTS */}
                          <div>

                            <h3 className="font-medium">
                              Items
                            </h3>


                            <div className="mt-5 space-y-4">

                              {order.lines.map(
                                (line) => (

                                  <div
                                    key={
                                      line.id
                                    }
                                    className="flex justify-between gap-5 border-b pb-4"
                                    style={{
                                      borderColor:
                                        "#e5e5e5",
                                    }}
                                  >

                                    <div>

                                      <p className="text-sm font-medium">
                                        {
                                          line.product_name
                                        }
                                      </p>

                                      <p
                                        className="mt-1 text-xs"
                                        style={{
                                          color:
                                            "#777777",
                                        }}
                                      >
                                        SKU:{" "}
                                        {
                                          line.sku
                                        }
                                      </p>

                                      <p
                                        className="mt-1 text-xs"
                                        style={{
                                          color:
                                            "#777777",
                                        }}
                                      >
                                        Quantity:{" "}
                                        {
                                          line.quantity
                                        }
                                      </p>

                                    </div>


                                    <div className="text-right">

                                      <p className="text-sm font-medium">
                                        {formatKRW(
                                          line.line_total
                                        )}
                                      </p>

                                      <p
                                        className="mt-1 text-xs"
                                        style={{
                                          color:
                                            "#777777",
                                        }}
                                      >
                                        {formatKRW(
                                          line.unit_price
                                        )}{" "}
                                        each
                                      </p>

                                    </div>

                                  </div>

                                )
                              )}

                            </div>

                          </div>


                          {/* SHIPPING */}
                          <div>

                            <h3 className="font-medium">
                              Shipping
                            </h3>


                            {shippingAddress ? (

                              <div
                                className="mt-5 text-sm leading-7"
                                style={{
                                  color:
                                    "#525252",
                                }}
                              >

                                <p
                                  className="font-medium"
                                  style={{
                                    color:
                                      "#111111",
                                  }}
                                >
                                  {
                                    shippingAddress.recipient_name
                                  }
                                </p>

                                <p>
                                  {
                                    shippingAddress.phone_number
                                  }
                                </p>

                                <p className="mt-3">
                                  {
                                    shippingAddress.address_line1
                                  }
                                </p>

                                {shippingAddress.address_line2 && (
                                  <p>
                                    {
                                      shippingAddress.address_line2
                                    }
                                  </p>
                                )}

                                <p>
                                  {shippingAddress.district
                                    ? `${shippingAddress.district}, `
                                    : ""}
                                  {
                                    shippingAddress.city
                                  }
                                </p>

                                <p>
                                  {
                                    shippingAddress.postal_code
                                  }
                                </p>

                              </div>

                            ) : (

                              <p
                                className="mt-5 text-sm"
                                style={{
                                  color:
                                    "#777777",
                                }}
                              >
                                No shipping address.
                              </p>

                            )}


                            {/* NOTES */}
                            {order.notes && (

                              <div className="mt-8">

                                <p
                                  className="text-xs uppercase tracking-[0.1em]"
                                  style={{
                                    color:
                                      "#777777",
                                  }}
                                >
                                  Customer notes
                                </p>

                                <p className="mt-2 text-sm leading-6">
                                  {order.notes}
                                </p>

                              </div>

                            )}

                          </div>

                        </div>


                        {/* ORDER TOTALS */}
                        <div
                          className="border-t p-6"
                          style={{
                            borderColor:
                              "#e5e5e5",
                          }}
                        >

                          <div className="ml-auto max-w-sm space-y-3">

                            <div className="flex justify-between text-sm">

                              <span
                                style={{
                                  color:
                                    "#777777",
                                }}
                              >
                                Subtotal
                              </span>

                              <span>
                                {formatKRW(
                                  order.subtotal
                                )}
                              </span>

                            </div>


                            <div className="flex justify-between text-sm">

                              <span
                                style={{
                                  color:
                                    "#777777",
                                }}
                              >
                                Discount
                              </span>

                              <span>
                                -
                                {formatKRW(
                                  order.discount_amount
                                )}
                              </span>

                            </div>


                            <div className="flex justify-between text-sm">

                              <span
                                style={{
                                  color:
                                    "#777777",
                                }}
                              >
                                Shipping
                              </span>

                              <span>
                                {formatKRW(
                                  order.shipping_amount
                                )}
                              </span>

                            </div>


                            <div className="flex justify-between text-sm">

                              <span
                                style={{
                                  color:
                                    "#777777",
                                }}
                              >
                                Tax
                              </span>

                              <span>
                                {formatKRW(
                                  order.tax_amount
                                )}
                              </span>

                            </div>


                            <div
                              className="flex justify-between border-t pt-4 font-medium"
                              style={{
                                borderColor:
                                  "#d9d9d9",
                              }}
                            >

                              <span>
                                Total
                              </span>

                              <span>
                                {formatKRW(
                                  order.total_amount
                                )}
                              </span>

                            </div>

                          </div>

                        </div>

                      </div>

                    )}

                  </article>

                );

              }
            )}

          </div>

        )}

      </section>

    </main>
  );
}