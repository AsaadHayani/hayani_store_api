import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import auth from "../middleware/auth.js";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();

// register new user
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const user = new User(req.body);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400);
      throw new Error("Email already exists");
    }

    await user.save();

    // generate a token for the new user
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.status(201).json({ token, user });
  })
);

// login user
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // generate a token for the user
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    res.status(200).json({ token, user });
  })
);

// Get count products, categories, orders, and users
router.get(
  "/store-details",
  auth,
  asyncHandler(async (req, res) => {
    const products = await Product.countDocuments();
    const categories = await Category.countDocuments();
    const orders = await Order.countDocuments();
    const users = await User.countDocuments();

    res.status(200).json({ users, products, categories, orders });
  })
);

export default router;
