async function run() {
  try {
    const loginRes = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@jhaz-imprints.com", password: "StrongPassword123!" })
    });
    const { token } = await loginRes.json();
    
    const prodRes = await fetch("http://localhost:3001/api/products");
    const products = await prodRes.json();
    const product = products.products[0];
    
    const measRes = await fetch("http://localhost:3001/api/orders/measurements", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ profileName: "Standard Fit", chest: 105.5, waist: 88 })
    });
    const measurement = await measRes.json();
    
    const orderRes = await fetch("http://localhost:3001/api/orders", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        measurementId: measurement.id,
        productId: product.id,
        fabricOptionName: product.fabricOptions[0].name,
        styleOptionName: product.styleOptions[0].name
      })
    });
    const order = await orderRes.json();
    console.log(JSON.stringify(order, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
