import { fa, faker } from "@faker-js/faker";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";

async function seedFaker() {
  const productIds = [];

  await User.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Order.deleteMany({});

  // Create categories + products first
  for (let i = 0; i < 4; i++) {
    const category = await Category.create({
      name: faker.commerce.department(),
      description: faker.lorem.sentence(),
      image: faker.image.urlPicsumPhotos(),
    });

    const product = await Product.create({
      name: faker.commerce.productName(),
      description: faker.lorem.words(3),
      price: faker.number.int({ min: 100, max: 1000 }),
      image: faker.image.urlPicsumPhotos(),
      category: category._id,
    });

    productIds.push(product._id);
  }

  // Create admin user
  const admin = await User.create({
    name: "Asaad",
    email: "asaad@gmail.com",
    password: "12345678",
    role: "user",
  });

  // Create order for admin
  await Order.create({
    user: admin._id,
    total: faker.number.int({ min: 100, max: 1000 }),
    products: [
      {
        product: productIds[Math.floor(Math.random() * productIds.length)],
        quantity: faker.number.int({ min: 1, max: 5 }),
      },
    ],
    status: faker.helpers.arrayElement([
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    address: faker.location.streetAddress(),
    payment: {
      method: faker.helpers.arrayElement(["cash", "card"]),
      paid: faker.datatype.boolean(),
    },
  });

  // Create normal users + orders
  for (let i = 0; i < 4; i++) {
    const newUser = await User.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    });

    await Order.create({
      user: newUser._id,
      total: faker.number.int({ min: 100, max: 1000 }),
      products: [
        {
          product: productIds[Math.floor(Math.random() * productIds.length)],
          quantity: faker.number.int({ min: 1, max: 5 }),
        },
      ],
      status: faker.helpers.arrayElement([
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ]),
      address: faker.location.streetAddress(),
      payment: {
        method: faker.helpers.arrayElement(["cash", "card"]),
        paid: false,
      },
    });
  }
}

export default seedFaker;
