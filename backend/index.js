import express from "express";
import bodyParser from "body-parser";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use(
  cors({
    origin: process.env.ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// Load VAPID keys
const { publicKey, privateKey } = JSON.parse(
  process.env.VAPID_KEYS_JSON || "{}"
);
webpush.setVapidDetails("mailto:rp031776@gmail.com", publicKey, privateKey);

// Supabase client
// console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// console.log(supabase)
// 1) Endpoint to receive and store subscription from the PWA
app.post("/api/subscribe", async (req, res) => {
  const { user_id, subscription } = req.body;
  const {
    endpoint,
    keys: { p256dh, auth },
  } = subscription;
  console.log("I am able to reach here");

  await supabase
    .from("push_subscriptions")
    .insert({ user_id, endpoint, p256dh_key: p256dh, auth_key: auth });

  
  res.send({ success: true });
});

// 2) Webhook called by Supabase trigger
// ...existing code...
app.post("/webhook/task-created", async (req, res) => {
  console.log("Webhook triggered");
  const { id: todoId, user_id, title, description } = req.body;

  const payload = JSON.stringify({
    title: "New Task Created!",
    body: title,
    data: { todoId },
  });

  try {
    // Fetch the subscription from your database
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return res.status(500).json({ error: "Failed to fetch subscriptions" });
    }

    if (!subs || subs.length === 0) {
      console.log("No subscriptions found for user:", user_id);
      return res.json({ delivered: 0 });
    }

    // Send notifications to all subscriptions
    const results = await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh_key,
                auth: sub.auth_key
              }
            },
            payload
          );
          return true;
        } catch (error) {
          console.error("Error sending notification:", error);
          return false;
        }
      })
    );

    const deliveredCount = results.filter(Boolean).length;
    res.json({ delivered: deliveredCount });
  } catch (error) {
    console.error("Error in webhook:", error);
    res.status(500).json({ error: "Internal server error" });
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
    console.log("data",data);

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
      postal_code: postalCode,
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
