const fs = require("fs");
require("dotenv").config();
const path = require("path");
const { Client } = require("@elastic/elasticsearch");
const Product = require("./models/product.model");
const mongoose = require("mongoose");

const client = new Client({ node: "http://localhost:9200" });

mongoose
  .connect(process.env.URI)
  .then(() => console.log("db connected"))
  .catch((err) => console.error(`ouch it's error: ${err}`));

async function indexProduct(product) {
  await client.index({
    index: "products",
    id: product._id.toString(),
    body: {
      ...product,
      _id: undefined,
    },
  });
}

async function reindexAllProducts() {
  try {
    // Clear existing Elasticsearch index
    await client.indices.delete({
      index: "products",
      ignore_unavailable: true,
    });

    // Create new index
    await client.indices.create({ index: "products" });

    // Fetch products from MongoDB
    const products = await Product.find().lean();

    // Index the fetched products in Elasticsearch
    for (const product of products) {
      await indexProduct(product);
    }

    console.info("Reindexed all products in Elasticsearch");
  } catch (error) {
    console.error("Elasticsearch reindexing error:", error);
  }
}

// Read data from JSON file
const jsonFilePath = path.join(__dirname, "products.json");
const rawData = fs.readFileSync(jsonFilePath);
const productsData = JSON.parse(rawData);

// Insert products data into MongoDB
Product.insertMany(productsData)
  .then(() => {
    console.log("Inserted products into MongoDB");
    // Reindex all products in Elasticsearch
    reindexAllProducts().then(() => {
      console.log("Finished reindexing all products");
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error("MongoDB insertion error:", error);
    process.exit(1);
  });
