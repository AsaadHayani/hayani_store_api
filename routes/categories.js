import Category from "../models/Category.js";
import upload from "../middleware/uploadMiddleware.js";
import auth from "../middleware/auth.js";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import uploadToCloudinary from "../middleware/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

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

    const category = await Category.create({
      name,
      description,
      image,
    });

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

    if (name) category.name = name;

    if (description) {
      category.description = description;
    }

    if (req.file) {
      if (category.image?.public_id) {
        await cloudinary.uploader.destroy(category.image.public_id);
      }

      const result = await uploadToCloudinary(req.file.buffer);

      category.image = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

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

    if (category.image?.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    await category.deleteOne();

    res.status(200).json({
      message: "Category deleted successfully",
    });
  })
);

// delete all categories
router.delete(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const categories = await Category.find();

    for (const category of categories) {
      if (category.image?.public_id) {
        await cloudinary.uploader.destroy(category.image.public_id);
      }
    }

    await Category.deleteMany({});

    res.status(200).json({
      message: "All categories deleted",
    });
  })
);

export default router;
