form the context in `.github/context-bolt`, `.github/context-cat`, `.github/context-api`,and the databases in `package` let us fix category and other customization data so the frontend can easily be in sync. 

since category data doesn't change,  it doesn't need much fields other than name, slug and decsription(for the admin) and it is not much(highest 50); let's save all  categories to the backend in  a json file as an array i.e
```json
 {category: [
     {name: "ankara wears", slug:"ankara-wears", desc:"wears made from ankara fabrics"},
    {name: "blazer top", slug:"blazer-top", desc:"blazer style blouse"}
]}
``` 
and when admin is creating a new product, the categories field array will be populated from the json data. 

as for  fabric, we create a seperate table:

// db/collections/Fabric
```json 
{
  _id: ObjectId,
  slug: String,              // "premium-aso-oke"
  name: String,              // "Premium Aso-oke"
  description: String?,
  
  properties: [ {
  colorName: String,         // "Royal Blue"
  colorCode: String,         // "#4169E1" hex
  imageUrl: String,          // Cloudinary URL
   
  // Pricing & inventory
  priceModifier: Number,     // +10000 naira
  inStock: Boolean,
  stockLevel: Number?,       // Quantity available
  
  // Metadata
  isActive: Boolean }] ,
  
  // Audit
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date?
}
```
finally, the product collection takes shape as thus:

```json
    // db/collections/Product
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  basePrice: Number,
  images: [String],
  productionDays: Number,
  
  // ✅ References (not embedded)
  categoryIds: [{name:"ankara wears", slug:"ankara-wears"},{name:"blazer top", slug:"blazer-top"}],      // from category.json
  fabrics: [ObjectId],        // Links to Fabric collection
  
  // ✅ Enums (stable, small)
  gender: Enum(['men', 'women', 'unisex', 'kids']),
  occasion: Enum(['social-events-celebrations', 'casual', 'corporate']),
  
  // Style options (lightweight, embedded is fine)
  styleOptions: [{
    name: String,
    priceModifier: Number,
    description: String?
  }],
  
  seoMeta: { title, description, keywords },
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

 