const express = require("express");
const http = require("http");
const { URLSearchParams } = require("url");

const app = express();
const port = 3000;

// Function to fetch top products from the test server
async function fetchTopProducts(
  company,
  category,
  top,
  minPrice,
  maxPrice,
  sortBy,
  sortOrder,
  page = 1
) {
  const testServerUrl =
    "http://20.244.56.144/test/companies/:companyname/categories/:categoryname/products";

  const params = new URLSearchParams({
    top,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    page,
  });
  const url =
    testServerUrl
      .replace(":companyname", company)
      .replace(":categoryname", category) +
    "?" +
    params;

  return new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const products = JSON.parse(data);
          resolve(products);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// GET /categories/:categoryname/products
app.get("/categories/:categoryname/products", async (req, res) => {
  const { categoryname } = req.params;
  const {
    top = 10,
    minPrice = 0,
    maxPrice = Infinity,
    sortBy = "rating",
    sortOrder = "desc",
    page = 1,
  } = req.query;
  try {
    const products = await fetchTopProducts(
      categoryname,
      top,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      page
    );
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /categories/:categoryname/products/:productid
app.get("/categories/:categoryname/products/:productid", async (req, res) => {
  const { categoryname, productid } = req.params;
  try {
    const products = await fetchTopProducts(categoryname);
    const product = products.find((p) => p.id === productid);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else {
      res.json(product);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
