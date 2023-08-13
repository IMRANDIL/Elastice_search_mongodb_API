const { Client } = require("@elastic/elasticsearch");
const Product = require("../models/product.model");
const { validationResult } = require("express-validator");
const client = new Client({ node: "http://elasticsearch:9200" });

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

// Function to check if Elasticsearch is up and running
// async function checkElasticsearchConnection() {
//   try {
//     const response = await client.ping();
//     console.log(response);
//     return response.statusCode === 200;
//   } catch (error) {
//     return false;
//   }
// }

const createProduct = async (req, res, next) => {
  // Check if Elasticsearch is available
  // const isElasticsearchAvailable = await checkElasticsearchConnection();
  // if (!isElasticsearchAvailable) {
  //   return res.status(500).json({
  //     success: false,
  //     msg: "Elasticsearch is not available",
  //   });
  // }

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

const searchProduct = async (req, res) => {
  // Check if Elasticsearch is available
  // const isElasticsearchAvailable = await checkElasticsearchConnection();
  // console.log(isElasticsearchAvailable);
  // if (!isElasticsearchAvailable) {
  //   return res.status(500).json({
  //     success: false,
  //     msg: "Elasticsearch is not available",
  //   });
  // }

  try {
    const { q, category, minPrice, maxPrice, size, sort } = req.query;

    const searchQuery = {
      index: "products",
      body: {
        size: size || 10,
      },
    };

    // if (q || category || (!isNaN(minPrice) && !isNaN(maxPrice))) {
    //   searchQuery.body.query = {
    //     bool: {
    //       must: [],
    //     },
    //   };

    //   if (q) {
    //     searchQuery.body.query.bool.must.push({
    //       multi_match: {
    //         query: q,
    //         fields: ["name^2", "description"],
    //       },
    //     });
    //   }

    //   if (category) {
    //     searchQuery.body.query.bool.must.push({
    //       match: {
    //         category,
    //       },
    //     });
    //   }

    //   if (!isNaN(minPrice) && !isNaN(maxPrice)) {
    //     searchQuery.body.query.bool.must.push({
    //       range: {
    //         price: {
    //           gte: minPrice,
    //           lte: maxPrice,
    //         },
    //       },
    //     });
    //   }
    // }

    // if (sort) {
    //   const sortFields = sort.split(",");
    //   searchQuery.body.sort = sortFields.map((field) => ({ [field]: "asc" }));
    // }

    const { body } = await client.search(searchQuery);

    if (body && body.hits && body.hits.hits) {
      const hits = body.hits.hits.map((hit) => hit._source);
      res.json(hits);
    } else {
      console.error("Unexpected Elasticsearch response:", body);
      res.status(500).json({ error: "An error occurred" });
    }
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
