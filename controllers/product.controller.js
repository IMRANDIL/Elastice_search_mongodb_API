const { Client } = require("@elastic/elasticsearch");
const Product = require("../models/product.model");
const { validationResult } = require("express-validator");
const client = new Client({ node: "http://localhost:9200" });

async function indexProduct(product) {
  await client.index({
    index: "products",
    id: product._id.toString(), // Use MongoDB _id as Elasticsearch document ID
    body: {
      ...product,
      _id: undefined, // Exclude _id field from the indexed document
    },
  });
}

const createProduct = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      msg: "Request body invalid",
    });
  }
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    await indexProduct(newProduct.toJSON());
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
};

const searchProduct = async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const query = req.query.q; // User's search query
  const category = req.query.category; // Category filter
  const minPrice = parseFloat(req.query.minPrice); // Min price filter
  const maxPrice = parseFloat(req.query.maxPrice); // Max price filter

  try {
    const searchQuery = {
      bool: {
        must: [],
      },
    };

    if (query) {
      searchQuery.bool.must.push({
        multi_match: {
          query,
          fields: ["name^2", "description"],
        },
      });
    }

    if (category) {
      searchQuery.bool.must.push({
        match: {
          category,
        },
      });
    }

    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      searchQuery.bool.must.push({
        range: {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
        },
      });
    }

    const { body } = await client.search({
      index: "products",
      body: {
        query: searchQuery,
        sort: [{ price: "asc" }], // Sort results by price ascending
      },
    });

    const hits = body.hits.hits.map((hit) => hit._source);
    res.json(hits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
};

// Function to reindex all products
async function reindexAllProducts() {
  try {
    const allProducts = await Product.find(); // Retrieve all products from the database

    // Delete and recreate the Elasticsearch index with appropriate mappings
    await client.indices.delete({
      index: "products",
      ignore_unavailable: true,
    });
    await client.indices.create({
      index: "products",
      // ... (index settings and mappings)
    });

    // Index each product in Elasticsearch
    for (const product of allProducts) {
      await indexProduct(product.toJSON());
    }
  } catch (error) {
    console.error("Error during reindexing:", error);
  }
}

module.exports = {
  createProduct,
  searchProduct,
  reindexAllProducts,
};
