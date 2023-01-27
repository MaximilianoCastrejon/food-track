import { faker } from "@faker-js/faker";
import fs from "fs";

const items = [
  { itemId: "63bb57d6f167db9855d3bc79", name: "Salsa de soya" },
  { itemId: "63bb5806c71c0bbfe6c54a33", name: "Salsa anguila" },
  { itemId: "63bb58bddcf28d8159608da7", name: "Salsa" },
  { itemId: "63bb58e2a74d874234ebac1f", name: "Chorizo" },
  { itemId: "63bb58f6a74d874234ebac21", name: "Panko" },
];

generateMockInventoryData(items, 200, "63d1b2a14db5d5e9c5186d32");

async function generateMockInventoryData(items, days, expenseConceptId) {
  let data = [];
  let inventoryDocs = [];
  let expenseDocs = [];
  for (let i = 0; i < items.length; i++) {
    let lastEndingInventory;
    const currentItem = items[i];
    let previousDate = new Date();
    console.log("items", items[i]);
    for (let j = 0; j < days; j++) {
      let inventory = {
        item: currentItem.itemId,
        beginningInventory: 0,
        usedUnits: 0,
        wastedUnits: 0,
        endingInventory: 0,
        createdAt: 0,
        updatedAt: 0,
      };
      const randomUsedUnits = Number(
        faker.random.numeric(3, {
          allowLeadingZeros: false,
        })
      );
      const randomWastedUnits = Number(
        faker.random.numeric(3, {
          allowLeadingZeros: false,
        })
      );
      let registryDate = faker.date.soon(3, previousDate);
      // console.log("previousDate", previousDate.getDate());
      while (registryDate.getUTCDate() == previousDate.getUTCDate()) {
        registryDate = faker.date.soon(3, previousDate);
      }
      previousDate = registryDate;
      // console.log("previousDate", previousDate);
      // if (Math.random() < 0.2) {
      //   currentDate.setDate(currentDate.getDate() + 5);
      // } else {
      //   currentDate.setDate(currentDate.getDate() + 1);
      // }

      let createdAt = registryDate;
      inventory.createdAt = createdAt;

      inventory.updatedAt = faker.date.between(
        createdAt,
        new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000)
      );
      if (!lastEndingInventory) {
        inventory.beginningInventory = faker.random.numeric(4, {
          allowLeadingZeros: false,
        });
        lastEndingInventory = inventory.beginningInventory;
      } else {
        inventory.beginningInventory = lastEndingInventory;
      }
      inventory.usedUnits = randomUsedUnits;
      inventory.wastedUnits = randomWastedUnits;
      if (inventory.beginningInventory < 1400) {
        inventory.endingInventory =
          inventory.beginningInventory -
          inventory.usedUnits -
          inventory.wastedUnits +
          Number(
            faker.random.numeric(4, {
              bannedDigits: "9",
              allowLeadingZeros: false,
            })
          );
      } else {
        inventory.endingInventory =
          inventory.beginningInventory -
          inventory.usedUnits -
          inventory.wastedUnits;
      }
      if (
        inventory.beginningInventory -
          inventory.usedUnits -
          inventory.wastedUnits !==
        inventory.endingInventory
      ) {
        let units = Math.abs(
          inventory.beginningInventory -
            inventory.usedUnits +
            inventory.wastedUnits -
            inventory.endingInventory
        );
        let expense = {
          name: currentItem.name,
          units: units,
          value: faker.random.numeric(1) * units,
          concept: expenseConceptId,
          createdAt: inventory.createdAt,
          updatedAt: faker.date.between(
            inventory.createdAt,
            new Date(inventory.createdAt.getTime() + 15 * 24 * 60 * 60 * 1000)
          ),
        };
        expenseDocs.push(expense);
      }
      // console.log("inventory.createdAt", inventory.createdAt);
      // console.log("inventory.updatedAt", inventory.updatedAt);

      lastEndingInventory = inventory.endingInventory;
      // console.log("inventory", inventory.createdAt);
      inventoryDocs.push(Object.assign({}, inventory));
    }
    console.log("----------------------------------------");
  }
  try {
    // concatenate the data
    const allData = [...inventoryDocs, ...expenseDocs];
    // write the data to a local JSON file
    // fs.writeFileSync("mockHistoryData.json", JSON.stringify(allData, null, 2));

    fs.writeFileSync(
      "./inventoryDocs.js",
      `export let inventoryDocs = ${JSON.stringify(inventoryDocs, null, 2)}`
    );
    fs.writeFileSync(
      "./expenseDocs.js",
      `export let expensesDocs = ${JSON.stringify(expenseDocs, null, 2)}`
    );
    console.log("Mock data successfully written to mockData.json");
  } catch (error) {
    console.log("Error generating mock data: ", error);
  }
  return data;
}
