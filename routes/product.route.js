const {
  createProduct,
  searchProduct,
} = require("../controllers/product.controller");

const router = require("express").Router();

router.post("/products", createProduct);
router.get("/products/search", searchProduct);

module.exports = router;
