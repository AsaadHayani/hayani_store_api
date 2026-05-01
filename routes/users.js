import User from "../models/User.js";
import auth from "../middleware/auth.js";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();

// get all users
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const users = await User.find().select("-password").sort({ updatedAt: -1 });

    res.status(200).json(users);
  })
);

// get one user
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json(user);
  })
);

// create user
router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const { email, ...rest } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error("Email already exists");
    }

    const user = await User.create({
      email,
      ...rest,
    });

    res.status(201).json(user);
  })
);

// update user
router.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { email, password, ...rest } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error("Email already exists");
      }
      user.email = email;
    }

    if (password) user.password = await bcrypt.hash(password, 10);

    Object.assign(user, rest);

    await user.save();

    res.status(200).json(user);
  })
);

// delete user
router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({ message: "User has been deleted successfully" });
  })
);

// delete all users
router.delete(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const deleted = await User.deleteMany({ role: "user" });

    return res.sendStatus(200);
  })
);

export default router;
