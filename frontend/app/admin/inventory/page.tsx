"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type InventoryMovement = {
  id: string;
  movement_type: string;
  quantity_change: number;
  order_id: string | null;
  created_at: string;
};


type InventoryItem = {
  product_item_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  price: number | string;
  qty_in_stock: number;
  is_active: boolean;
  movements: InventoryMovement[];
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


function formatDate(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}


function getMovementLabel(
  type: string
) {
  if (type === "reservation") {
    return "Reservation";
  }

  if (type === "release") {
    return "Release";
  }

  if (type === "sale") {
    return "Sale";
  }

  return type;
}


function getMovementStyle(
  type: string
) {
  if (type === "reservation") {
    return {
      backgroundColor: "#fff7ed",
      color: "#9a3412",
      borderColor: "#fed7aa",
    };
  }

  if (type === "release") {
    return {
      backgroundColor: "#eff6ff",
      color: "#1d4ed8",
      borderColor: "#bfdbfe",
    };
  }

  if (type === "sale") {
    return {
      backgroundColor: "#f0fdf4",
      color: "#166534",
      borderColor: "#bbf7d0",
    };
  }

  return {
    backgroundColor: "#f5f5f5",
    color: "#525252",
    borderColor: "#e5e5e5",
  };
}


export default function AdminInventoryPage() {
  const router = useRouter();

  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    expandedItem,
    setExpandedItem,
  ] =
    useState<string | null>(null);


  useEffect(() => {
    async function loadInventory() {
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


        const response =
          await fetch(
            `${API_URL}/inventory/admin`,
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
              "Unable to load inventory"
          );
        }


        setItems(data);

      } catch (err) {

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to load inventory"
          );
        }

      } finally {
        setLoading(false);
      }
    }


    loadInventory();
  }, [router]);


  const filteredItems =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      if (!query) {
        return items;
      }


      return items.filter(
        (item) =>
          item.product_name
            .toLowerCase()
            .includes(query) ||
          item.sku
            .toLowerCase()
            .includes(query)
      );

    }, [items, search]);


  const totalStock =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            item.qty_in_stock,
          0
        ),
      [items]
    );


  const lowStockCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.qty_in_stock > 0 &&
            item.qty_in_stock <= 3
        ).length,
      [items]
    );


  const outOfStockCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.qty_in_stock === 0
        ).length,
      [items]
    );


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
          Loading inventory...
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
              href="/admin/orders"
              className="text-xs font-medium"
            >
              ORDERS
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

        {/* TITLE */}
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
            Stock
          </p>


          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                Inventory
              </h1>


              <p
                className="mt-3 text-sm"
                style={{
                  color: "#777777",
                }}
              >
                Monitor current stock and
                recent inventory movements.
              </p>

            </div>


            <div className="w-full md:w-72">

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product or SKU..."
                className="w-full border px-4 py-3 text-sm outline-none"
                style={{
                  borderColor: "#d9d9d9",
                  backgroundColor: "#ffffff",
                  color: "#111111",
                }}
              />

            </div>

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


        {/* SUMMARY */}
        {!error && (

          <div className="grid gap-4 py-8 md:grid-cols-4">

            <div
              className="border p-5"
              style={{
                borderColor: "#e5e5e5",
                backgroundColor: "#ffffff",
              }}
            >

              <p
                className="text-xs uppercase tracking-[0.12em]"
                style={{
                  color: "#777777",
                }}
              >
                SKUs
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {items.length}
              </p>

            </div>


            <div
              className="border p-5"
              style={{
                borderColor: "#e5e5e5",
                backgroundColor: "#ffffff",
              }}
            >

              <p
                className="text-xs uppercase tracking-[0.12em]"
                style={{
                  color: "#777777",
                }}
              >
                Units in stock
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {totalStock}
              </p>

            </div>


            <div
              className="border p-5"
              style={{
                borderColor: "#e5e5e5",
                backgroundColor: "#ffffff",
              }}
            >

              <p
                className="text-xs uppercase tracking-[0.12em]"
                style={{
                  color: "#777777",
                }}
              >
                Low stock
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {lowStockCount}
              </p>

            </div>


            <div
              className="border p-5"
              style={{
                borderColor: "#e5e5e5",
                backgroundColor: "#ffffff",
              }}
            >

              <p
                className="text-xs uppercase tracking-[0.12em]"
                style={{
                  color: "#777777",
                }}
              >
                Out of stock
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {outOfStockCount}
              </p>

            </div>

          </div>

        )}


        {/* EMPTY */}
        {!error &&
          filteredItems.length === 0 && (

          <div
            className="flex min-h-64 items-center justify-center border"
            style={{
              borderColor: "#e5e5e5",
              backgroundColor: "#ffffff",
            }}
          >

            <div className="text-center">

              <h2 className="font-medium">
                No inventory found
              </h2>

              <p
                className="mt-2 text-sm"
                style={{
                  color: "#777777",
                }}
              >
                No SKUs match your search.
              </p>

            </div>

          </div>

        )}


        {/* INVENTORY TABLE */}
        {!error &&
          filteredItems.length > 0 && (

          <div
            className="overflow-hidden border"
            style={{
              borderColor: "#e5e5e5",
              backgroundColor: "#ffffff",
            }}
          >

            {/* HEADER */}
            <div
              className="hidden grid-cols-[1.4fr_1fr_120px_120px_120px_auto] gap-4 border-b px-5 py-3 text-xs font-medium lg:grid"
              style={{
                borderColor: "#e5e5e5",
                backgroundColor: "#f5f5f5",
                color: "#777777",
              }}
            >

              <span>
                PRODUCT
              </span>

              <span>
                SKU
              </span>

              <span>
                PRICE
              </span>

              <span>
                STOCK
              </span>

              <span>
                STATUS
              </span>

              <span>
                MOVEMENTS
              </span>

            </div>


            {filteredItems.map(
              (item) => {

                const expanded =
                  expandedItem ===
                  item.product_item_id;


                let stockLabel =
                  "In stock";

                let stockStyle = {
                  backgroundColor: "#f0fdf4",
                  color: "#166534",
                  borderColor: "#bbf7d0",
                };


                if (
                  item.qty_in_stock === 0
                ) {
                  stockLabel =
                    "Out of stock";

                  stockStyle = {
                    backgroundColor: "#fef2f2",
                    color: "#b91c1c",
                    borderColor: "#fecaca",
                  };
                } else if (
                  item.qty_in_stock <= 3
                ) {
                  stockLabel =
                    "Low stock";

                  stockStyle = {
                    backgroundColor: "#fff7ed",
                    color: "#9a3412",
                    borderColor: "#fed7aa",
                  };
                }


                return (

                  <div
                    key={
                      item.product_item_id
                    }
                    className="border-b last:border-b-0"
                    style={{
                      borderColor:
                        "#e5e5e5",
                    }}
                  >

                    {/* ROW */}
                    <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.4fr_1fr_120px_120px_120px_auto] lg:items-center">

                      {/* PRODUCT */}
                      <div>

                        <p className="font-medium">
                          {
                            item.product_name
                          }
                        </p>

                        <p
                          className="mt-1 text-xs lg:hidden"
                          style={{
                            color:
                              "#777777",
                          }}
                        >
                          Product
                        </p>

                      </div>


                      {/* SKU */}
                      <div>

                        <p className="text-sm">
                          {item.sku}
                        </p>

                      </div>


                      {/* PRICE */}
                      <p className="text-sm">
                        {formatKRW(
                          item.price
                        )}
                      </p>


                      {/* STOCK */}
                      <div>

                        <p className="font-medium">
                          {
                            item.qty_in_stock
                          }
                        </p>

                        <p
                          className="mt-1 text-xs"
                          style={{
                            color:
                              "#777777",
                          }}
                        >
                          available
                        </p>

                      </div>


                      {/* STOCK STATUS */}
                      <div>

                        <span
                          className="inline-block border px-2.5 py-1 text-xs font-medium"
                          style={
                            stockStyle
                          }
                        >
                          {stockLabel}
                        </span>

                      </div>


                      {/* MOVEMENTS */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItem(
                            expanded
                              ? null
                              : item.product_item_id
                          )
                        }
                        className="w-fit border px-4 py-2 text-xs font-medium"
                        style={{
                          borderColor:
                            "#d9d9d9",
                          backgroundColor:
                            "#ffffff",
                        }}
                      >
                        {expanded
                          ? "HIDE"
                          : "VIEW"}
                      </button>

                    </div>


                    {/* EXPANDED MOVEMENTS */}
                    {expanded && (

                      <div
                        className="border-t px-5 py-6"
                        style={{
                          borderColor:
                            "#e5e5e5",
                          backgroundColor:
                            "#fafafa",
                        }}
                      >

                        <div className="flex items-center justify-between">

                          <div>

                            <h3 className="font-medium">
                              Inventory movements
                            </h3>

                            <p
                              className="mt-1 text-xs"
                              style={{
                                color:
                                  "#777777",
                              }}
                            >
                              Most recent 20
                              movements for this
                              SKU.
                            </p>

                          </div>


                          <Link
                            href={`/admin/products/${item.product_id}`}
                            className="text-xs font-medium underline underline-offset-4"
                          >
                            MANAGE PRODUCT
                          </Link>

                        </div>


                        {item.movements.length ===
                        0 ? (

                          <p
                            className="mt-6 text-sm"
                            style={{
                              color:
                                "#777777",
                            }}
                          >
                            No inventory movements
                            recorded yet.
                          </p>

                        ) : (

                          <div className="mt-6 space-y-3">

                            {item.movements.map(
                              (
                                movement
                              ) => {

                                const movementStyle =
                                  getMovementStyle(
                                    movement.movement_type
                                  );


                                return (

                                  <div
                                    key={
                                      movement.id
                                    }
                                    className="grid gap-4 border p-4 md:grid-cols-[150px_100px_1fr_160px] md:items-center"
                                    style={{
                                      borderColor:
                                        "#e5e5e5",
                                      backgroundColor:
                                        "#ffffff",
                                    }}
                                  >

                                    {/* TYPE */}
                                    <span
                                      className="w-fit border px-2.5 py-1 text-xs font-medium"
                                      style={
                                        movementStyle
                                      }
                                    >
                                      {getMovementLabel(
                                        movement.movement_type
                                      )}
                                    </span>


                                    {/* QUANTITY */}
                                    <p
                                      className="text-sm font-medium"
                                      style={{
                                        color:
                                          movement.quantity_change >
                                          0
                                            ? "#166534"
                                            : movement.quantity_change <
                                                0
                                              ? "#b91c1c"
                                              : "#525252",
                                      }}
                                    >
                                      {movement.quantity_change >
                                      0
                                        ? "+"
                                        : ""}
                                      {
                                        movement.quantity_change
                                      }
                                    </p>


                                    {/* ORDER */}
                                    <div>

                                      {movement.order_id ? (

                                        <p
                                          className="text-xs"
                                          style={{
                                            color:
                                              "#777777",
                                          }}
                                        >
                                          Order:{" "}
                                          {
                                            movement.order_id
                                          }
                                        </p>

                                      ) : (

                                        <p
                                          className="text-xs"
                                          style={{
                                            color:
                                              "#777777",
                                          }}
                                        >
                                          No linked order
                                        </p>

                                      )}

                                    </div>


                                    {/* DATE */}
                                    <p
                                      className="text-xs"
                                      style={{
                                        color:
                                          "#777777",
                                      }}
                                    >
                                      {formatDate(
                                        movement.created_at
                                      )}
                                    </p>

                                  </div>

                                );

                              }
                            )}

                          </div>

                        )}

                      </div>

                    )}

                  </div>

                );

              }
            )}

          </div>

        )}

      </section>

    </main>
  );
}