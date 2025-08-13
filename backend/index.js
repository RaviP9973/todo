import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import Razorpay from "razorpay";
import crypto from "crypto";
dotenv.config();
const app = express();
app.use(bodyParser.json());

// Initialize Razorpay instance (only if keys are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('Razorpay initialized successfully');
} else {
  console.warn('Razorpay keys not found. Payment endpoints will not work.');
}

const allowedOrigins = process.env.ORIGIN?.split(",").map(origin => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Razorpay endpoints
// Create Razorpay order
app.post('/api/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.' });
    }
    console.log("inside the create order of backend");

    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("order created");
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Razorpay payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.' });
    }

    console.log("inside the verify payment of backend");
    console.log("req ka body", req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment parameters' });
    }

    // Create signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log("expectedSignature", expectedSignature);
    console.log("razorpay_signature", razorpay_signature);
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Fetch payment details from Razorpay to get additional info
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      
      console.log("payment", payment);
      res.json({
        success: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        signature: razorpay_signature,
        payment_status: payment.status,
        amount: payment.amount / 100, // Convert back to rupees
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid payment signature' 
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get payment status
app.get('/api/payment-status/:payment_id', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: 'Razorpay not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.' });
    }

    const { payment_id } = req.params;
    const payment = await razorpay.payments.fetch(payment_id);
    
    res.json({
      payment_id: payment.id,
      status: payment.status,
      amount: payment.amount / 100,
      currency: payment.currency,
      method: payment.method,
      created_at: payment.created_at,
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

app.get('/reverse-geocode', async (req, res) => {
  const { lat, lng } = req.query;

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${lat},${lng}`,
          key: apiKey,
        },
      }
    );

    // console.log("response",response.data)
    res.json(response.data);

  } catch (error) {
    // 👇 Show detailed error
    console.error("Geocoding Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    res.status(500).json({
      message: 'Error fetching location data',
      error: {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      },
    });
  }
});

app.get("/address-from-placeid", async (req, res) => {
  const { placeId } = req.query;

  if (!placeId) {
    return res.status(400).json({ error: "Missing placeId parameter" });
  }

  try {
    const googleRes = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const data = googleRes.data;
    // console.log("data",data);

    if (data.status !== "OK") {
      return res.status(400).json({ error: data.status });
    }

    const result = data.result;
    const addressComponents = result.address_components;
    const formattedAddress = result.formatted_address;
    const location = result.geometry.location;

    const getComponent = (types) =>
      addressComponents.find((c) =>
        types.every((t) => c.types.includes(t))
      )?.long_name || "";

    const city = getComponent(["locality"]);
    const state = getComponent(["administrative_area_level_1"]);
    const country = getComponent(["country"]);
    const postalCode = getComponent(["postal_code"]);

    res.json({
      full_address: formattedAddress,
      city,
      state,
      country,
      pincode: postalCode,
      latitude: location.lat,
      longitude: location.lng,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT || 4000, () =>
  console.log("Server running on port", process.env.PORT || 3000)
);
