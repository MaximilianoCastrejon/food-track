import React from "react";
// TODO: Change for a reusable form component
const ProductForm = ({ ingredients, categories, suppliers }) => {
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:
        <input type="text" name="name" />
      </label>
      <br />
      <label>
        Ingredients:
        <select multiple name="ingredients">
          {ingredients.map((ingredient) => (
            <option key={ingredient._id} value={ingredient._id}>
              {ingredient.name}
            </option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Category:
        <select name="category">
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Supplier:
        <select name="supplier">
          {suppliers.map((supplier) => (
            <option key={supplier._id} value={supplier._id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
};
