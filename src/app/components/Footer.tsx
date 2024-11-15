import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>&copy; 2024 Anthemake</p>
        <Link href="/" className="underline px-2">
          Home
        </Link>
        <Link href="/privacy-policy" className="underline px-2">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
