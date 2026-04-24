require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("✅ STK Bot is running");
});

// API key middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
};

// STK Push endpoint
app.post("/stk", authenticate, async (req, res) => {
  try {
    let { phone, amount, reference } = req.body;

    if (phone.startsWith("0")) {
      phone = "254" + phone.slice(1);
    }

    const response = await axios.post(
      "https://api.palpluss.com/v1/payments/stk",
      {
        amount,
        phone,
        accountReference: reference,
        transactionDesc: `Payment for ${reference}`,
        callbackUrl: process.env.CALLBACK_URL,
      },
      {
        headers: {
          Authorization: `Basic ${process.env.PALPLUSS_AUTH}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      message: "STK push sent",
      data: response.data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
});

// Callback endpoint
app.post("/webhooks/mpesa", (req, res) => {
  console.log("Callback:", req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
