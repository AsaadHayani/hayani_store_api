import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import usersRoutes from "./routes/users.js";
import categoriesRoutes from "./routes/categories.js";
import ordersRoutes from "./routes/orders.js";
import errorHandler from "./middleware/errorHandler.js";
// import seedFaker from "./config/faker.js";
// seedFaker().then(() => console.log("Fake data inserted!"));

dotenv.config();

const app = express();
app.use("/uploads", express.static("uploads"));

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/orders", ordersRoutes);
app.get("/api/health", (req, res) => res.status(200).json("Ok"));

app.use(errorHandler);

// app.listen(process.env.PORT, () => {
//   console.log(`http://localhost:${process.env.PORT}`);
// });
export default app;
