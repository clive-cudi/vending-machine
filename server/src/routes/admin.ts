import { Router } from "express";
import { runInContext } from "vm";
import { home, backup, addProduct, removeProduct, login, signup, getLogs, checkBalance, setDenominations, changePrice, addFunds, withdrawFunds } from "../controllers/admin.controller";
import { authAdmin } from "../middleware/authAdmin";

const router = Router();

// `/admin` routes

router.get("/", home);

router.post("/signup", signup);

router.post("/login", login);

router.get("/backup", authAdmin, backup);

router.post("/add-product", authAdmin, addProduct);

router.post("/remove-product", authAdmin, removeProduct);

router.get("/logs", authAdmin, getLogs);

router.get("/check-balance", authAdmin, checkBalance);

router.post("/change-denominations", authAdmin, setDenominations);

router.post("/add-funds", authAdmin, addFunds);

router.post("/withdraw", authAdmin, withdrawFunds);

router.post("/change-price", authAdmin, changePrice);

export default router;