import Link from "next/link";
import Image from "next/image";

interface ResourceCardProps {
  title: string;
  description: string;
  imageSrc?: string;
  href: string;
  isExternal?: boolean;
  buttonText?: string;
}

export default function ResourceCard({
  title,
  description,
  imageSrc,
  href,
  isExternal = false,
}: ResourceCardProps) {
  const CardContent = () => (
    <>
      <div className="relative h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            width={400}
            height={225}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100">
            <span className="text-4xl font-bold text-blue-200">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-700 mb-4 flex-grow">{description}</p>
      <span className="btn-secondary">
        {`${title} →`}
      </span>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col h-full bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-400 hover:shadow-lg transition-all duration-200"
      >
        <CardContent />
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col h-full bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-400 hover:shadow-lg transition-all duration-200"
    >
      <CardContent />
    </Link>
  );
}
