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
      .populate("user")
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

    if (!requestProducts || requestProducts.length === 0) {
      res.status(400);
      throw new Error("Products not provided!");
    }

    const productIds = requestProducts.map((p) => p.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (requestProducts.length !== dbProducts.length) {
      res.status(400);
      throw new Error("Some products not found!");
    }

    let total = 0;
    const orderProducts = [];

    for (const rP of requestProducts) {
      const product = dbProducts.find(
        (p) => p._id.toString() === rP._id.toString()
      );

      if (!product) continue;

      if (rP.quantity < 1) {
        res.status(400);
        throw new Error("Invalid quantity");
      }

      total += product.price * rP.quantity;

      orderProducts.push({
        product: product._id,
        quantity: rP.quantity,
      });
    }

    const order = new Order({
      user: userId,
      total,
      products: orderProducts,
      status: req.body?.status,
      payment: req.body?.payment,
      address: req.body?.address,
    });

    await order.save();

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

    if (!requestProducts || requestProducts.length === 0) {
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
      uniqueProducts[p._id] = p.quantity;
    });

    for (const prodId in uniqueProducts) {
      const newQuantity = uniqueProducts[prodId];
      const prodInOrder = order.products.find(
        (p) => p.product._id.toString() === prodId
      );

      if (!prodInOrder) continue;

      if (newQuantity <= 0) {
        order.products = order.products.filter(
          (p) => p.product._id.toString() !== prodId
        );
      } else if (newQuantity > 0) {
        prodInOrder.quantity = newQuantity;
      }
    }

    order.total = order.products.reduce(
      (sum, p) => sum + p.quantity * p.product.price,
      0
    );

    order.status = req.body?.status;
    order.payment = req.body?.payment;
    order.address = req.body?.address;

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
    const result = await Order.deleteMany({});

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error("No orders found");
    }

    res.status(200).json({ message: "Deleted all orders" });
  })
);

export default router;
