import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());

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

app.use('/api',paymentRoutes);


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
