"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";


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


type Address = {
  id: string;
  label: string | null;
  recipient_name: string;
  phone_number: string;
  postal_code: string;
  city: string;
  district: string;
  address_line1: string;
  address_line2: string | null;
  is_default: boolean;
};


type ShippingMethod = {
  id: number;
  name: string;
  price: number;
  estimated_days: string | null;
};


type AddressForm = {
  label: string;
  recipient_name: string;
  phone_number: string;
  postal_code: string;
  city: string;
  district: string;
  address_line1: string;
  address_line2: string;
};


const emptyAddressForm: AddressForm = {
  label: "",
  recipient_name: "",
  phone_number: "",
  postal_code: "",
  city: "",
  district: "",
  address_line1: "",
  address_line2: "",
};


function formatKRW(price: number | string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(price));
}


export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [shippingMethods, setShippingMethods] =
    useState<ShippingMethod[]>([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [selectedShippingMethodId, setSelectedShippingMethodId] =
    useState<number | null>(null);

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [addressForm, setAddressForm] =
    useState<AddressForm>(emptyAddressForm);

  const [loading, setLoading] = useState(true);

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [creatingOrder, setCreatingOrder] =
    useState(false);

  const [error, setError] = useState("");


  // -------------------------------------------------------
  // AUTHENTICATED REQUEST
  // -------------------------------------------------------

  async function authenticatedFetch(
    path: string,
    options: RequestInit = {}
  ) {
    const token = sessionStorage.getItem(
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
                "Content-Type": "application/json",
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
  // LOAD CHECKOUT DATA
  // -------------------------------------------------------

  useEffect(() => {
    async function loadCheckout() {
      setLoading(true);
      setError("");

      try {
        const token = sessionStorage.getItem(
          "susi_access_token"
        );

        if (!token) {
          router.push("/login");
          return;
        }

        const [
          cartResponse,
          addressesResponse,
          shippingResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/cart`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/addresses`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(
            `${API_URL}/storefront/shipping-methods`
          ),
        ]);


        if (
          cartResponse.status === 401 ||
          addressesResponse.status === 401
        ) {
          sessionStorage.removeItem(
            "susi_access_token"
          );

          router.push("/login");
          return;
        }


        if (!cartResponse.ok) {
          throw new Error(
            "Unable to load cart"
          );
        }

        if (!addressesResponse.ok) {
          throw new Error(
            "Unable to load addresses"
          );
        }

        if (!shippingResponse.ok) {
          throw new Error(
            "Unable to load shipping methods"
          );
        }


        const cartData: Cart =
          await cartResponse.json();

        const addressData: Address[] =
          await addressesResponse.json();

        const shippingData: ShippingMethod[] =
          await shippingResponse.json();


        setCart(cartData);
        setAddresses(addressData);
        setShippingMethods(shippingData);


        // Select default address automatically.
        const defaultAddress =
          addressData.find(
            (address) => address.is_default
          ) ?? addressData[0];

        if (defaultAddress) {
          setSelectedAddressId(
            defaultAddress.id
          );
        } else {
          setShowAddressForm(true);
        }


        // Select first available shipping method.
        if (shippingData.length > 0) {
          setSelectedShippingMethodId(
            shippingData[0].id
          );
        }

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Unable to load checkout"
          );
        }

      } finally {
        setLoading(false);
      }
    }

    loadCheckout();

  }, [router]);


  // -------------------------------------------------------
  // ADDRESS FORM
  // -------------------------------------------------------

  function updateAddressField(
    field: keyof AddressForm,
    value: string
  ) {
    setAddressForm((current) => ({
      ...current,
      [field]: value,
    }));
  }


  // -------------------------------------------------------
  // SAVE ADDRESS
  // -------------------------------------------------------

  async function handleSaveAddress(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSavingAddress(true);
    setError("");

    try {
      const response =
        await authenticatedFetch(
          "/addresses",
          {
            method: "POST",
            body: JSON.stringify({
              label:
                addressForm.label.trim() ||
                null,

              recipient_name:
                addressForm.recipient_name.trim(),

              phone_number:
                addressForm.phone_number.trim(),

              postal_code:
                addressForm.postal_code.trim(),

              city:
                addressForm.city.trim(),

              district:
                addressForm.district.trim(),

              address_line1:
                addressForm.address_line1.trim(),

              address_line2:
                addressForm.address_line2.trim() ||
                null,

              is_default:
                addresses.length === 0,
            }),
          }
        );

      if (!response) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (typeof data.detail === "string") {
          setError(data.detail);
        } else {
          setError(
            "Unable to save address"
          );
        }

        return;
      }

      const newAddress: Address = data;

      setAddresses((current) => [
        newAddress,
        ...current,
      ]);

      setSelectedAddressId(
        newAddress.id
      );

      setAddressForm(
        emptyAddressForm
      );

      setShowAddressForm(false);

    } catch {
      setError(
        "Unable to connect to the server"
      );

    } finally {
      setSavingAddress(false);
    }
  }


  // -------------------------------------------------------
  // CREATE ORDER
  // -------------------------------------------------------

  async function handleCreateOrder() {
    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    const selectedAddress =
      addresses.find(
        (address) =>
          address.id === selectedAddressId
      );

    if (!selectedAddress) {
      setError(
        "Please select a shipping address"
      );
      return;
    }

    if (
      selectedShippingMethodId === null
    ) {
      setError(
        "Please select a shipping method"
      );
      return;
    }

    setCreatingOrder(true);
    setError("");

    try {
      const response =
        await authenticatedFetch(
          "/orders",
          {
            method: "POST",
            body: JSON.stringify({
              shipping_method_id:
                selectedShippingMethodId,

              shipping_address: {
                recipient_name:
                  selectedAddress.recipient_name,

                phone_number:
                  selectedAddress.phone_number,

                postal_code:
                  selectedAddress.postal_code,

                city:
                  selectedAddress.city,

                district:
                  selectedAddress.district,

                address_line1:
                  selectedAddress.address_line1,

                address_line2:
                  selectedAddress.address_line2,
              },

              billing_address: null,

              notes: null,
            }),
          }
        );

      if (!response) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (typeof data.detail === "string") {
          setError(data.detail);
        } else {
          setError(
            "Unable to create order"
          );
        }

        return;
      }

      /*
       * Order is now created and inventory is
       * reserved by FastAPI for 15 minutes.
       *
       * Next step will be the PortOne payment page.
       */
      router.push(
        `/checkout/payment?order=${encodeURIComponent(
          data.id
        )}`
      );

    } catch {
      setError(
        "Unable to connect to the server"
      );

    } finally {
      setCreatingOrder(false);
    }
  }


  // -------------------------------------------------------
  // TOTALS
  // -------------------------------------------------------

  const selectedShippingMethod =
    shippingMethods.find(
      (method) =>
        method.id ===
        selectedShippingMethodId
    ) ?? null;


  const subtotal =
    Number(cart?.subtotal ?? 0);

  const shippingPrice =
    Number(
      selectedShippingMethod?.price ?? 0
    );

  const total =
    subtotal + shippingPrice;


  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-black">

        <header className="px-6 py-6 md:px-14">

          <Link
            href="/"
            className="text-2xl font-bold tracking-[0.25em]"
          >
            SUSI
          </Link>

        </header>

        <div className="flex min-h-[70vh] items-center justify-center">

          <p className="text-sm text-neutral-500">
            Loading checkout...
          </p>

        </div>

      </main>
    );
  }


  // -------------------------------------------------------
  // CHECKOUT
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
          href="/cart"
          className="text-sm font-medium transition-opacity hover:opacity-50"
        >
          BACK TO CART
        </Link>

      </header>


      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-12 md:px-14 lg:grid-cols-[1fr_420px]">

        {/* LEFT SIDE */}
        <div>

          <p className="mb-3 text-xs tracking-[0.25em] text-neutral-500">
            SUSI
          </p>

          <h1 className="text-3xl font-medium md:text-4xl">
            Checkout
          </h1>


          {/* ERROR */}
          {error && (

            <div className="mt-8 border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm text-red-700">
                {error}
              </p>

            </div>

          )}


          {/* SHIPPING ADDRESS */}
          <section className="mt-12">

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-medium">
                Shipping address
              </h2>

              {addresses.length > 0 && (

                <button
                  type="button"
                  onClick={() =>
                    setShowAddressForm(
                      (current) => !current
                    )
                  }
                  className="text-xs underline underline-offset-4"
                >
                  {showAddressForm
                    ? "CANCEL"
                    : "ADD NEW ADDRESS"}
                </button>

              )}

            </div>


            {/* SAVED ADDRESSES */}
            {addresses.length > 0 && (

              <div className="mt-6 space-y-3">

                {addresses.map(
                  (address) => {

                    const selected =
                      selectedAddressId ===
                      address.id;

                    return (

                      <button
                        key={address.id}
                        type="button"
                        onClick={() =>
                          setSelectedAddressId(
                            address.id
                          )
                        }
                        className={[
                          "w-full border p-5 text-left transition-colors",

                          selected
                            ? "border-black"
                            : "border-neutral-200 hover:border-neutral-400",

                        ].join(" ")}
                      >

                        <div className="flex items-start justify-between gap-6">

                          <div>

                            <div className="flex items-center gap-3">

                              <p className="text-sm font-medium">
                                {
                                  address.recipient_name
                                }
                              </p>

                              {address.is_default && (

                                <span className="text-[10px] tracking-wider text-neutral-500">
                                  DEFAULT
                                </span>

                              )}

                            </div>


                            <p className="mt-2 text-sm leading-6 text-neutral-600">
                              {
                                address.address_line1
                              }

                              {address.address_line2
                                ? `, ${address.address_line2}`
                                : ""}
                              <br />

                              {
                                address.district
                              }
                              , {address.city}
                              <br />

                              {
                                address.postal_code
                              }
                              <br />

                              {
                                address.phone_number
                              }
                            </p>

                          </div>


                          <div
                            className={[
                              "mt-1 h-4 w-4 rounded-full border",

                              selected
                                ? "border-[5px] border-black"
                                : "border-neutral-300",

                            ].join(" ")}
                          />

                        </div>

                      </button>

                    );
                  }
                )}

              </div>

            )}


            {/* NEW ADDRESS FORM */}
            {showAddressForm && (

              <form
                onSubmit={
                  handleSaveAddress
                }
                className="mt-8 border-t border-neutral-200 pt-8"
              >

                <h3 className="text-sm font-medium">
                  New address
                </h3>


                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* LABEL */}
                  <div className="md:col-span-2">

                    <label
                      htmlFor="label"
                      className="mb-2 block text-xs font-medium tracking-wider"
                    >
                      LABEL (OPTIONAL)
                    </label>

                    <input
                      id="label"
                      type="text"
                      maxLength={50}
                      placeholder="Home"
                      value={
                        addressForm.label
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "label",
                          event.target.value
                        )
                      }
                      className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                  </div>


                  {/* RECIPIENT */}
                  <div>

                    <label
                      htmlFor="recipient"
                      className="mb-2 block text-xs font-medium tracking-wider"
                    >
                      RECIPIENT NAME
                    </label>

                    <input
                      id="recipient"
                      type="text"
                      required
                      maxLength={150}
                      value={
                        addressForm.recipient_name
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "recipient_name",
                          event.target.value
                        )
                      }
                      className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                  </div>


                  {/* PHONE */}
                  <div>

                    <label
                      htmlFor="phone"
                      className="mb-2 block text-xs font-medium tracking-wider"
                    >
                      PHONE NUMBER
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      required
                      maxLength={30}
                      placeholder="010-1234-5678"
                      value={
                        addressForm.phone_number
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "phone_number",
                          event.target.value
                        )
                      }
                      className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                  </div>


                  {/* POSTAL CODE */}
                  <div>

                    <label
                      htmlFor="postalCode"
                      className="mb-2 block text-xs font-medium tracking-wider"
                    >
                      POSTAL CODE
                    </label>

                    <input
                      id="postalCode"
                      type="text"
                      required
                      maxLength={20}
                      value={
                        addressForm.postal_code
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "postal_code",
                          event.target.value
                        )
                      }
                      className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                  </div>


                  {/* CITY */}
                  <div>

                    <label
                      htmlFor="city"
                      className="mb-2 block text-xs font-medium tracking-wider"
                    >
                      CITY / PROVINCE
                    </label>

                    <input
                      id="city"
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Seoul"
                      value={
                        addressForm.city
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "city",
                          event.target.value
                        )
                      }
                      className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                  </div>


                  {/* DISTRICT */}
                  <div className="md:col-span-2">

                    <label
                      htmlFor="district"
                      className="mb-2 block text-xs font-medium tracking-wider"
                    >
                      DISTRICT
                    </label>

                    <input
                      id="district"
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Gangnam-gu"
                      value={
                        addressForm.district
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "district",
                          event.target.value
                        )
                      }
                      className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                  </div>


                  {/* ADDRESS LINE 1 */}
                  <div className="md:col-span-2">

                    <label
                      htmlFor="address1"
                      className="mb-2 block text-xs font-medium tracking-wider"
                    >
                      ADDRESS
                    </label>

                    <input
                      id="address1"
                      type="text"
                      required
                      maxLength={255}
                      value={
                        addressForm.address_line1
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "address_line1",
                          event.target.value
                        )
                      }
                      className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                  </div>


                  {/* ADDRESS LINE 2 */}
                  <div className="md:col-span-2">

                    <label
                      htmlFor="address2"
                      className="mb-2 block text-xs font-medium tracking-wider"
                    >
                      APARTMENT / UNIT (OPTIONAL)
                    </label>

                    <input
                      id="address2"
                      type="text"
                      maxLength={255}
                      value={
                        addressForm.address_line2
                      }
                      onChange={(event) =>
                        updateAddressField(
                          "address_line2",
                          event.target.value
                        )
                      }
                      className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />

                  </div>

                </div>


                <button
                  type="submit"
                  disabled={savingAddress}
                  className="mt-6 border border-black bg-black px-6 py-3 text-xs font-medium tracking-wider text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {savingAddress
                    ? "SAVING..."
                    : "SAVE ADDRESS"}
                </button>

              </form>

            )}

          </section>


          {/* SHIPPING METHOD */}
          <section className="mt-14 border-t border-neutral-200 pt-10">

            <h2 className="text-lg font-medium">
              Shipping method
            </h2>


            {shippingMethods.length === 0 ? (

              <p className="mt-5 text-sm text-neutral-500">
                No shipping methods are currently available.
              </p>

            ) : (

              <div className="mt-6 space-y-3">

                {shippingMethods.map(
                  (method) => {

                    const selected =
                      selectedShippingMethodId ===
                      method.id;

                    return (

                      <button
                        key={method.id}
                        type="button"
                        onClick={() =>
                          setSelectedShippingMethodId(
                            method.id
                          )
                        }
                        className={[
                          "flex w-full items-center justify-between border p-5 text-left transition-colors",

                          selected
                            ? "border-black"
                            : "border-neutral-200 hover:border-neutral-400",

                        ].join(" ")}
                      >

                        <div>

                          <p className="text-sm font-medium">
                            {method.name}
                          </p>

                          {method.estimated_days && (

                            <p className="mt-1 text-xs text-neutral-500">
                              {
                                method.estimated_days
                              }
                            </p>

                          )}

                        </div>


                        <div className="flex items-center gap-5">

                          <p className="text-sm">
                            {method.price === 0
                              ? "Free"
                              : formatKRW(
                                  method.price
                                )}
                          </p>

                          <div
                            className={[
                              "h-4 w-4 rounded-full border",

                              selected
                                ? "border-[5px] border-black"
                                : "border-neutral-300",

                            ].join(" ")}
                          />

                        </div>

                      </button>

                    );
                  }
                )}

              </div>

            )}

          </section>

        </div>


        {/* ORDER SUMMARY */}
        <aside className="lg:sticky lg:top-8 lg:self-start">

          <div className="border border-neutral-200 p-6 md:p-8">

            <h2 className="text-lg font-medium">
              Order summary
            </h2>


            {/* CART ITEMS */}
            <div className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">

              {cart?.items.map((item) => (

                <div
                  key={item.id}
                  className="flex justify-between gap-6 py-5"
                >

                  <div>

                    <p className="text-sm font-medium">
                      {item.product_name}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {item.sku}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Qty {item.quantity}
                    </p>

                  </div>


                  <p className="whitespace-nowrap text-sm">
                    {formatKRW(
                      item.line_total
                    )}
                  </p>

                </div>

              ))}

            </div>


            {/* SUBTOTAL */}
            <div className="mt-6 flex justify-between text-sm">

              <span>
                Subtotal
              </span>

              <span>
                {formatKRW(subtotal)}
              </span>

            </div>


            {/* SHIPPING */}
            <div className="mt-4 flex justify-between text-sm">

              <span>
                Shipping
              </span>

              <span>
                {selectedShippingMethod
                  ? shippingPrice === 0
                    ? "Free"
                    : formatKRW(
                        shippingPrice
                      )
                  : "—"}
              </span>

            </div>


            {/* TOTAL */}
            <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-6">

              <span className="font-medium">
                Total
              </span>

              <span className="text-xl font-medium">
                {formatKRW(total)}
              </span>

            </div>


            <p className="mt-3 text-xs text-neutral-500">
              KRW
            </p>


            {/* CONTINUE */}
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={
                creatingOrder ||
                !cart ||
                cart.items.length === 0 ||
                !selectedAddressId ||
                selectedShippingMethodId === null
              }
              className="mt-8 w-full bg-black px-6 py-4 text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {creatingOrder
                ? "CREATING ORDER..."
                : "CONTINUE TO PAYMENT"}
            </button>


            <p className="mt-4 text-xs leading-5 text-neutral-500">
              Stock will be reserved when your order is
              created. Payment must then be completed
              before the reservation expires.
            </p>

          </div>

        </aside>

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