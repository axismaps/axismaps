"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative -mx-4 md:-mx-6 h-[500px] overflow-hidden">
      {/* Contour Background Images with Parallax */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-7xl">
          <div
            className="absolute inset-0"
            style={{
              transform: `translateY(${scrollY * 0.2}px)`,
            }}
          >
            <Image
              src="/contours_0.svg"
              alt=""
              fill
              className="object-cover opacity-40"
              priority
              style={{
                objectPosition: "60% 50%",
              }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`,
            }}
          >
            <Image
              src="/contours_750.svg"
              alt=""
              fill
              className="object-cover opacity-35"
              priority
              style={{
                objectPosition: "60% 50%",
              }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              transform: `translateY(${scrollY * 0.4}px)`,
            }}
          >
            <Image
              src="/contours_1500.svg"
              alt=""
              fill
              className="object-cover opacity-30"
              priority
              style={{
                objectPosition: "60% 50%",
              }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
            }}
          >
            <Image
              src="/contours_2250.svg"
              alt=""
              fill
              className="object-cover opacity-25"
              priority
              style={{
                objectPosition: "60% 50%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 max-w-4xl">
          We bring the traditions of cartography to the Web
        </h1>
        <Link href="/contact" className="btn-primary">
          Contact Us
        </Link>
      </div>

      {/* Bottom Curve */}
      <div className="absolute bottom-0 left-0 right-0">
        <Image
          src="/contours_curve.svg"
          alt=""
          width={1920}
          height={100}
          className="w-full"
        />
      </div>
    </section>
  );
}
