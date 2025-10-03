"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const navItems = {
  "/projects": {
    name: "Projects",
  },
  "/about": {
    name: "About",
  },
  "/guide": {
    name: "Guide",
  },
  "/contact": {
    name: "Contact",
  },
};

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="mb-8 relative">
      <nav className="flex flex-row items-center justify-between">
        {/* Logo and Company Name */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/axis-logo.png"
            alt="Axis Maps Logo"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="text-xl font-semibold tracking-tight">
            Axis Maps
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex flex-row items-center gap-1">
          {Object.entries(navItems).map(([path, { name }]) => {
            return (
              <Link
                key={path}
                href={path}
                className="transition-all hover:text-neutral-600 dark:hover:text-neutral-300 px-3 py-2 text-base"
              >
                {name}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          ref={buttonRef}
          className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors relative z-50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 bg-black/20 z-30"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Floating Dropdown Menu */}
            <div
              ref={menuRef}
              className="md:hidden absolute right-0 top-14 z-40 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {Object.entries(navItems).map(([path, { name }]) => {
                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2.5 text-base hover:bg-neutral-100 transition-colors"
                  >
                    {name}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
