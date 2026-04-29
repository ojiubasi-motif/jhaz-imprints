export const dynamic = "force-dynamic";

import MeasurementWizard from "@/components/checkout/MeasurementWizard";

interface CheckoutPageProps {
  searchParams: {
    productId?: string;
  };
}

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const productId = searchParams.productId || "default";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
        <p className="text-muted mb-8">
          Follow the steps below to customize and order your bespoke garment.
        </p>

        <MeasurementWizard productId={productId} />
      </div>
    </main>
  );
}
