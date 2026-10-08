"use client";

export default function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-[999999] isolate h-16 border-b border-[#e8e8e8] bg-[#fcfcfc]">

      <div className="susi-container flex h-full items-center justify-between">

        <a
          href="/"
          className="relative z-[999999] text-xl font-bold tracking-[0.2em]"
        >
          SUSI
        </a>


        <nav className="relative z-[999999] flex h-full items-center gap-5 text-xs font-medium md:gap-8">

          <a
            href="/#collection"
            className="relative z-[999999] hidden cursor-pointer transition-opacity hover:opacity-50 sm:block"
          >
            Collection
          </a>


          <a
            href="/cart"
            className="relative z-[999999] cursor-pointer px-2 py-5 transition-opacity hover:opacity-50"
          >
            Cart
          </a>


          <a
            href="/account/orders"
            className="relative z-[999999] cursor-pointer px-2 py-5 transition-opacity hover:opacity-50"
          >
            Account
          </a>

        </nav>

      </div>

    </header>
  );
}