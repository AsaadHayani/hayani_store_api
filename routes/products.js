import Product from "../models/Product.js";
import upload from "../middleware/uploadMiddleware.js";
import auth from "../middleware/auth.js";
import { mongoose } from "mongoose";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import uploadToCloudinary from "../middleware/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

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
      .populate("category", "name")
      .sort({ updatedAt: -1 });

    return res.status(200).json(products);
  })
);

// get one product
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name"
    );

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

    if (!mongoose.Types.ObjectId.isValid(category)) {
      res.status(400);
      throw new Error("Invalid category ID");
    }

    let image = {
      url: "",
      public_id: "",
    };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      image = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      isSold: isSold === "true",
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
    product.isSold = isSold === "true";

    if (category && category !== "") {
      product.category = category;
    }

    if (req.file) {
      if (product.image?.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
      }

      const result = await uploadToCloudinary(req.file.buffer);

      product.image = {
        url: result.secure_url,
        public_id: result.public_id,
      };
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

    if (product.image?.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    await product.deleteOne();

    res.status(200).json({
      message: "Product deleted successfully",
    });
  })
);

// delete all products
router.delete(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const products = await Product.find();

    for (const product of products) {
      if (product.image?.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
      }
    }

    await Product.deleteMany({});

    res.status(200).json({
      message: "All products deleted successfully",
    });
  })
);

export default router;
