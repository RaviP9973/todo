import express from "express";
import bodyParser from "body-parser";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use(
  cors({
    origin: "http://localhost:3000",
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

app.listen(process.env.PORT || 4000, () =>
  console.log("Server running on port", process.env.PORT || 3000)
);
