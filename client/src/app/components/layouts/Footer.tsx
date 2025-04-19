import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-2">TravelPal</h3>
            <p className="text-gray-300">Your personal AI travel guide</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
            <ul className="text-gray-300">
              <li className="mb-1">
                <Link href="/" className="hover:text-blue-300">
                  Home
                </Link>
              </li>
              <li className="mb-1">
                <Link href="/itineraries" className="hover:text-blue-300">
                  My Trips
                </Link>
              </li>
              <li className="mb-1">
                <Link href="#" className="hover:text-blue-300">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-700 text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} TravelPal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
