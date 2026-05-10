export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold text-primary">Jhaz-imprints</span>
            <p className="mt-4 text-sm text-muted max-w-xs">
              Bespoke Nigerian traditional dresses, crafted to perfection. Aso-oke, Agbada, Kente, and Ankara styles tailored to your measurements.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Shop</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="/products" className="text-sm text-gray-600 hover:text-primary">All Products</a>
              </li>
              <li>
                <a href="/products?category=wedding-aso-oke" className="text-sm text-gray-600 hover:text-primary">Wedding Aso-Oke</a>
              </li>
              <li>
                <a href="/products?category=agbada" className="text-sm text-gray-600 hover:text-primary">Agbada</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary">Contact Us</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary">FAQ</a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary">Sizing Guide</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Jhaz-imprints. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
