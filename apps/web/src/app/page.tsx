export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-r from-primary to-secondary py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Jhaz-imprints
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Bespoke Nigerian traditional dresses, crafted to perfection
          </p>
          <a
            href="/checkout"
            className="inline-block bg-white text-primary px-8 py-3 rounded font-semibold hover:bg-gray-100"
          >
            Start Shopping
          </a>
        </div>
      </section>

      <section className="py-12 max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <p className="text-muted">
          Welcome to Jhaz-imprints. Browse our collection of authentic African
          traditional dresses and place your custom order today.
        </p>
      </section>
    </main>
  );
}
