require("dotenv").config();
const waitOn = require("wait-on");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const { reindexAllProducts } = require("./controllers/product.controller");

const app = express();

// Some middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(compression());

// Routing middleware
app.use("/api/v1", require("./routes/product.route"));

const PORT = process.env.PORT || 8000;

async function waitForElasticsearch() {
  const opts = {
    resources: ["http://elasticsearch:9200"],
  };

  return new Promise((resolve, reject) => {
    waitOn(opts, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function connectAndStartApp() {
  try {
    await waitForElasticsearch();
    console.log("Elasticsearch is ready, starting app...");
    // Now you can proceed with your app startup
    mongoose
      .connect(process.env.URI)
      .then(() => {
        console.info("mongo db connected");
        reindexAllProducts()
          .then(() => {
            console.info("Reindexing completed");
            app.listen(PORT, () => {
              console.info(`Server running on port ${PORT}`);
            });
          })
          .catch((error) => {
            console.error("Reindexing error:", error);
          });
      })
      .catch((err) => {
        console.error(`ouch mongo db connection failed: ${err}`);
      });
  } catch (error) {
    console.error("Error waiting for Elasticsearch:", error);
  }
}

connectAndStartApp();
