# Suki-dashboard

## Schemas

Schemas were designed trying to follow N5 level normalization. The harder part ot figure out about the modeling was producing a good data model that took into account different prices for different sizes of each product

## Order

The **extras** field in the [OrderSchema](./server/models/Products/Order.js) is meant to capture wheter a customer asks for extra fries, extra soy sauce, etc.
The `excludedIngredients` is utilized to do the oposite operation of placing the order by increasing the `RawIngredients`'s `currentInventory` by the same amount as it will decrease

The `OrderSchema` middleware consists of 3 functions

It does this keeping in mind that **ingredients**, stored as **extras**, have to have their own quantity. The restaurant may give extra soy sauce, but not necessarily double the normal amount as it comes for that particular product, thus, the restaurant should enter how much is the extra quantity of soy sauce, in this example, that they will add to the order annd how much will they charge for it.

**extras** are only allowed to be **ingredients**.

Updating order registries will not have any effect on the Inventory History because the Ingrediens used for each product are calculated only as a placeholder for the actual value which can be selected overwirtten by the user if the number is not right.

## Packages

There may be some cases in which the customer may want to negoatiate and ask for a special package that is not currently available. The restaurant may accept or decline the negoatiation. If accepted, the restaurant should create a new package with the speciffied products. This pacakge should then be deleted if the restaurant no longer requires it. This action will not affect the registry of `Orders`, `Sales` nor `Income` but on all subsequent _GET_ requests, the field will not be _populated_ since the document no longer exists.

## Inventories

### Inventory Items

If you save a registry in which `endingInventory` doesnt match with the `beginningInventory` minus `usedUnits` and `wastedUnits`, a purchase should have been made to account for this discrepancy. After reviewing inventory and getting the actual value for the `endingInventory` and the **purchased units**, you should register this discrepancy as `wastedUnits` as it is assumed that more units/quantity were used than in the recipe.

On `wastedUnits`. If a bottle of an ingredient goes bad or is no longer edible, it should be reigstered under `wastedUnits` as well.

#### Updating and deleting registries

Currently the user is only allowed to update and/or delete the **most recent** registry for an `InventoryItem`. Because it would increase computing power and many read/write actions for updating

The user needs to keep in mind that

### Inventory Items

## Expenses

**Expense Concepts** are not mean to be used as a way to register granularly for which Item an Expense was writen. They are mean to be used as classifications of expenses. Much like the classification of Inventory Items that could be _cleaning material, promotional material, input for production, etc_. These should be used to classify expenses in general terms.

## Income

## Account
