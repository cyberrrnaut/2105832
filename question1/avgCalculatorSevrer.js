const express = require("express");
const http = require("http");

const app = express();
const port = 3000;

const windowSize = 10;
let numbersWindow = [];
let token = null;

// Function to fetch bearer token from the test server
async function fetchNumbers(numberId) {
  // Check if token exists and is not expired
  if (!token || isTokenExpired(token)) {
    await fetchToken();
  }

  const testServerUrls = {
    p: "http://20.244.56.144/test/primes",
    f: "http://20.244.56.144/test/fibo",
    e: "http://20.244.56.144/test/even",
    r: "http://20.244.56.144/test/rand",
  };
  const url = testServerUrls[numberId];
  if (!url) {
    throw new Error("Invalid number ID");
  }
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    http
      .get(url, options, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const numbers = JSON.parse(data).numbers;
          resolve(numbers);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// Middleware to handle requests
app.use(express.json());

app.get("/numbers/:numberid", async (req, res) => {
  const numberId = req.params.numberid;
  try {
    const numbers = await fetchNumbers(numberId);
    const avg = calculateAverage(numbers);
    updateWindow(numbers);
    const responseData = {
      numbers: numbers,
      windowPrevState: numbersWindow.slice(0, -numbers.length),
      windowCurrState: numbersWindow,
      avg: avg.toFixed(2),
    };
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Function to calculate average of numbers
function calculateAverage(numbers) {
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return sum / numbers.length;
}

// Function to update window with new numbers
function updateWindow(newNumbers) {
  numbersWindow = [...numbersWindow, ...newNumbers];
  if (numbersWindow.length > windowSize) {
    numbersWindow = numbersWindow.slice(-windowSize);
  }
}

// Middleware to check if token is expired
function isTokenExpired(token) {
  const decodedToken = Buffer.from(token.split(".")[1], "base64").toString();
  const expiresAt = JSON.parse(decodedToken).exp;
  return Date.now() >= expiresAt * 1000;
}

// Function to fetch token
async function fetchToken() {
  try {
    const response = await http.post("http://20.244.56.144/test/auth");
    if (!response.ok) {
      throw new Error("Failed to fetch token");
    }
    const data = await response.json();
    token = data.access_token;
  } catch (error) {
    console.error("Error fetching token:", error);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
