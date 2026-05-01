import Product from "../models/Product.js";
import fs from "fs";
import path from "path";
import upload from "../middleware/uploadMiddleware.js";
import auth from "../middleware/auth.js";
import { mongoose } from "mongoose";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();

// get all products
router.get(
  "/",
  asyncHandler(async (req, res) => {
    let { name, category } = req.query;

    let query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (category) query.category = category;

    let products = await Product.find(query)
      .populate("category")
      .sort({ updatedAt: -1 });

    return res.status(200).json(products);
  })
);

// get one product
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.status(200).json(product);
  })
);

// create product
router.post(
  "/",
  auth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { name, description, price, category, isSold } = req.body;
    let image;
    if (req.file) image = req.file.filename;

    if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
      res.status(400);
      throw new Error("Invalid category ID");
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      isSold,
      image,
    });

    res.status(201).json(product);
  })
);

// update product
router.put(
  "/:id",
  auth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const { name, description, price, category, isSold } = req.body;
    product.name = name;
    product.description = description;
    product.price = price;
    product.isSold = isSold;

    if (category && category !== "") {
      product.category = category;
    }

    if (req.file) {
      const oldImagePath = path.join("uploads", product.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      const newImageName = Date.now() + path.extname(req.file.originalname);
      const newImagePath = path.join("uploads", newImageName);
      fs.renameSync(req.file.path, newImagePath);

      product.image = newImageName;
    }

    await product.save();

    res.status(200).json(product);
  })
);

// delete product
router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const imagePath = path.join("uploads", product.image);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await product.deleteOne();

    res.status(200).json(product);
  })
);

// delete all products
router.delete(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const products = await Product.find();

    for (const product of products) {
      const imagePath = path.join("uploads", product.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Product.deleteMany({});
    res.status(200).json({ status: "Deleted all products" });
  })
);

export default router;
