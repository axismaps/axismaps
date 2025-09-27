"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  website: z.string().optional(), // Honeypot field - bots love filling in website fields
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
  });

  // Watch fields to trigger re-renders
  const watchAllFields = watch();

  const onSubmit = async (data: ContactFormData) => {
    // Check honeypot (website field)
    if (data.website) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company,
          message: data.message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        reset();
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.error || "Failed to send message");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="fade-in-section">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Get in Touch</h1>

        <div className="mb-12">
          <p className="text-gray-600 mb-4">
            {`Have a project in mind? We'd love to hear from you. Send us a message
            using the form below, or email us directly.`}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name *
            </label>
            <input
              {...register("name")}
              type="text"
              id="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
              placeholder="Enter your name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email *
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2">
              Company/Organization
            </label>
            <input
              {...register("company")}
              type="text"
              id="company"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
              placeholder="Your company or organization (optional)"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message *
            </label>
            <textarea
              {...register("message")}
              id="message"
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
              placeholder="Tell us about your project..."
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">
                {errors.message.message}
              </p>
            )}
          </div>

          {/* Honeypot field - hidden from users */}
          <input
            {...register("website")}
            type="text"
            name="website"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>

            {submitStatus === "success" && (
              <p className="text-green-600">
                {`Message sent successfully! We'll get back to you soon.`}
              </p>
            )}

            {submitStatus === "error" && (
              <p className="text-red-600">{errorMessage}</p>
            )}
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Other Ways to Connect</h2>

          <div className="space-y-3 text-gray-600">
            <p>
              Email us directly at:{" "}
              <a
                href="mailto:info@axismaps.com"
                className="text-blue-600 hover:underline"
              >
                info@axismaps.com
              </a>
            </p>

            <p>
              For typographic maps, visit our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                typographic map store
              </a>
            </p>

            <p>
              Follow us on X/Twitter:{" "}
              <a
                href="https://twitter.com/axismaps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                @axismaps
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
