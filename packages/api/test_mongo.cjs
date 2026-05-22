const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const fabricOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priceModifier: { type: Number, required: true, default: 0 }
});
const styleOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priceModifier: { type: Number, required: true, default: 0 }
});
const productSchema = new mongoose.Schema({
  name: String,
  fabricOptions: [fabricOptionSchema],
  styleOptions: [styleOptionSchema]
});
const Product = mongoose.model("Product", productSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/jhaz-catalog");
  const p = await Product.findOne({ name: "Elegant Agbada" });
  if (!p) return console.log("Not found");
  
  console.log("DB Fabrics:", p.fabricOptions.map(f => f.name));
  console.log("DB Styles:", p.styleOptions.map(s => s.name));

  const inputFabric = "Silk Blend";
  const inputStyle = "With Traditional Beads";

  const f = p.fabricOptions.find(f => f.name === inputFabric);
  const s = p.styleOptions.find(s => s.name === inputStyle);

  console.log("Found fabric?", !!f);
  console.log("Found style?", !!s);
  
  process.exit(0);
}
run();
