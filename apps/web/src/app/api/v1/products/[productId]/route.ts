/**
 * Next.js API route for fetching product data.
 * Delegates to the Express API running on packages/api.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${params.productId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch product" },
        { status: res.status }
      );
    }

    const product = await res.json();
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
