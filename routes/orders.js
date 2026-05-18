import Order from "../models/Order.js";
import auth from "../middleware/auth.js";
import Product from "../models/Product.js";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();

// get all orders
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const orders = await Order.find({ user: userId })
      .populate("products.product")
      .populate("user", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json(orders);
  })
);

// get one order
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.userId,
    })
      .populate("products.product")
      .populate("user");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    res.status(200).json(order);
  })
);

// create order
router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const requestProducts = req.body.products;

    if (!Array.isArray(requestProducts) || requestProducts.length === 0) {
      res.status(400);
      throw new Error("Products not provided!");
    }

    const productIds = [...new Set(requestProducts.map((p) => p.product))];

    const dbProducts = await Product.find({
      _id: { $in: productIds },
    });

    if (dbProducts.length !== productIds.length) {
      res.status(400);
      throw new Error("Some products not found!");
    }

    let total = 0;
    const orderProducts = [];

    for (const item of requestProducts) {
      if (!item.product) {
        res.status(400);
        throw new Error("Invalid product data!");
      }

      if (typeof item.quantity !== "number" || item.quantity < 1) continue;

      const product = dbProducts.find(
        (p) => p._id.toString() === item.product.toString()
      );

      if (!product) {
        res.status(400);
        throw new Error("Product not found in DB");
      }

      total += product.price * item.quantity;

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
      });
    }

    if (orderProducts.length === 0) {
      res.status(400);
      throw new Error("No valid products in order!");
    }

    const order = await Order.create({
      user: userId,
      products: orderProducts,
      total,
      status: req.body.status || "pending",
      payment: {
        method: req.body.payment || "cash",
        paid: false,
      },
      address: req.body.address,
    });

    res.status(201).json(order);
  })
);

// update order
router.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const orderId = req.params.id;
    const requestProducts = req.body.products;

    if (!Array.isArray(requestProducts) || requestProducts.length === 0) {
      res.status(400);
      throw new Error("Products not provided!");
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    }).populate("products.product");

    if (!order) {
      res.status(404);
      throw new Error("Order not found!");
    }

    const uniqueProducts = {};

    requestProducts.forEach((p) => {
      uniqueProducts[p.product] = p.quantity;
    });

    for (const prodId in uniqueProducts) {
      const newQuantity = uniqueProducts[prodId];

      const prodInOrder = order.products.find(
        (p) => p.product._id.toString() === prodId
      );

      if (!prodInOrder) {
        const productFromDb = await Product.findById(prodId);

        if (!productFromDb) continue;

        order.products.push({
          product: productFromDb._id,
          quantity: newQuantity,
        });

        continue;
      }

      if (newQuantity <= 0) {
        order.products = order.products.filter(
          (p) => p.product._id.toString() !== prodId
        );
      }

      else {
        prodInOrder.quantity = newQuantity;
      }
    }

    await order.populate("products.product");

    order.total = order.products.reduce(
      (sum, p) => sum + p.quantity * p.product.price,
      0
    );

    order.status = req.body.status || order.status;

    order.payment = req.body.payment || order.payment;

    order.address = req.body.address || order.address;

    await order.save();

    res.status(200).json(order);
  })
);

// delete order
router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    res.status(200).json(order);
  })
);

// delete all orders
router.delete(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const result = await Order.deleteMany({ user: userId });

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error("No orders found");
    }

    res.status(200).json({ message: "Deleted all orders" });
  })
);

export default router;
