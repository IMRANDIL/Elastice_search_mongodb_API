const { Client } = require("@elastic/elasticsearch");
const client = new Client({ node: "http://localhost:9200" });

async function indexProduct(product) {
  await client.index({
    index: "products",
    body: product,
  });
}

const createProduct = async (req, res, next) => {};

const searchProduct = async (req, res, next) => {};

module.exports = {
  createProduct,
  searchProduct,
};
