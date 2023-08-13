const { query } = require("express-validator");
const {
  createProduct,
  searchProduct,
} = require("../controllers/product.controller");

const router = require("express").Router();

router.post("/products", createProduct);
router.get(
  "/products/search",
  [
    // Input validation and sanitization middleware
    query("q").optional().isString().trim().escape(),
    query("category").optional().isString().trim().escape(),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("sortBy").optional().isIn(["price", "createdAt"]), // Add more valid sort fields if needed
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  searchProduct
);

module.exports = router;
