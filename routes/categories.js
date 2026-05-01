import Category from "../models/Category.js";
import upload from "../middleware/uploadMiddleware.js";
import path from "path";
import fs from "fs";
import auth from "../middleware/auth.js";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();

// get all categories
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ updatedAt: -1 });

    res.status(200).json(categories);
  })
);

// get one category
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    res.status(200).json(category);
  })
);

// create category
router.post(
  "/",
  auth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    let image;
    if (req.file) image = req.file.filename;

    const category = await Category.create({ name, description, image });
    res.status(201).json(category);
  })
);

// update category
router.put(
  "/:id",
  auth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    if (req.file) {
      const oldPath = path.join("uploads", category.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      category.image = req.file.filename;
    }

    if (name) category.name = name;
    if (description) category.description = description;

    await category.save();
    res.status(200).json(category);
  })
);

// delete category
router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    if (category.image) {
      const imagePath = path.join("uploads", category.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await category.deleteOne();

    res.status(200).json(category);
  })
);

// delete all categories
router.delete(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const categories = await Category.find();

    for (const category of categories) {
      if (category.image) {
        const imagePath = path.join("uploads", category.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }
    }

    await Category.deleteMany();

    res.status(200).json({ status: "Deleted all categories" });
  })
);

export default router;
