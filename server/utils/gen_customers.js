import { faker } from "@faker-js/faker";
import fs from "fs";

const generateCustomers = (numOfCustomers) => {
  const customers = [];

  for (let i = 0; i < numOfCustomers; i++) {
    const customer = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      houseNumber: faker.address.streetAddress(),
      streetName: faker.address.streetName(),
      county: faker.address.county(),
      municipality: faker.address.city(),
      state: faker.address.state(),
      description: faker.lorem.sentence(),
    };
    customers.push(customer);
  }

  return customers;
};

const customers = generateCustomers(10);

fs.writeFileSync(
  "./customers.js",
  `export let customers = ${JSON.stringify(customers, null, 2)}`
);

// fs.writeFileSync(
//   "customers.js",
//   "module.exports = " + JSON.stringify(customers,)
// );
