# Suki-dashboard









### Schemas
Schemas were designed trying to follow N5 level normalization. The harder part ot figure out about the modeling was producing a good data model that took into account different prices for different sizes of each product

#### Order

The `extras` field in the [OrderSchema](./server/models/Products/Order.js) is meant to capture wheter a customer asks for extra fries, extra soy sauce, etc.
The `excludedIngredients` is utilized to do the oposite operation of placing the order by increasing the `RawIngredients`'s `currentInventory` by the same amount as it will decrease

The `OrderSchema` middleware consists of 3 functions

##### The first `OrderSchema` middleware
```javascript
OrderSchema.pre("save", async function (next) {
  
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Decrement the inventory levels of each ingredient in each product in the order by the quantity of the order
    for (const product of this.products) {
      // Find the ProductIngredient document for the current product in the order
      const dbProductIngredient = await ProductIngredient.findOne({
        product: product.product,
      });
      if (!dbProductIngredient) continue;
  
      // Decrement the inventory levels of the ingredient in the product by the quantity of the product in the order
      await RawIngredient.findByIdAndUpdate(dbProductIngredient.ingredient, {
        $inc: {
          quantity: -dbProductIngredient.quantity.small * product.quantity,
        },
      });
    }
  
    // Decrement the inventory levels of each extra in the order by its quantity
    for (const extra of this.extras) {
      const extraDoc = await Extras.findById(extra);
      if (!extraDoc) continue;
  
      if (extraDoc.productId) {
        // Find the ProductIngredient document for the extra
        const dbProductIngredient = await ProductIngredient.findOne({
          product: extraDoc.productId,
        });
  
        // Decrement the inventory levels of the ingredient in the product by the quantity of the extra multiplied by the small value in the product ingredient
        await RawIngredient.findByIdAndUpdate(dbProductIngredient.ingredient, {
          $inc: {
            quantity: -dbProductIngredient.quantity.small * extraDoc.quantity,
          },
        });
      } else if (extraDoc.ingredientId) {
        // Decrement the inventory levels of the ingredient extra by its quantity
        await RawIngredient.findByIdAndUpdate(extraDoc.ingredientId, {
          $inc: { quantity: -extraDoc.quantity },
        });
      }
    }
    // middleware function 1 goes here
    next();
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});
```
takes the following steps
1. It starts a session and starts a transaction in the session. This is done to ensure that all operations in this function are executed together and either all succeed or all fail.
2. It iterates through the products in the Order document and decrements the inventory levels of the ingredients in each product by the quantity of the product. It does this by finding the ProductIngredient document for the current product, and decrementing the quantity of the ingredient in the RawIngredient collection.
3. It then iterates through the extras in the Order document and decrements the inventory levels of each extra by its quantity. If the extra is a product, it finds the ProductIngredient document for the product and decrements the quantity of the ingredient in the RawIngredient collection. If the extra is an ingredient, it directly decrements the quantity of the ingredient in the RawIngredient collection.
4. It calls the next middleware function in the chain.
5. It commits the transaction.
6. If an error occurs during any of these steps, it aborts the transaction and throws the error.
7. It ends the session.

It does this keeping in mind that `ingredients` stored as `extras` have to have their own quantity. The restaurant may give extra soy sauce, but not necessarily double the normal amount as it comes for that particular product, thus, the restaurant should enter how much is the extra quantity of soy sauce, in this example, that they will add to the order annd how much will they charge for it 

