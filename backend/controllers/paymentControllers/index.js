import { razorpay } from "../../config/razorpay.js";
import { supabase } from "../../config/supbase.js";
import crypto from "crypto";
import jwt from 'jsonwebtoken';

export const initilisePayment =async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ error: 'Razorpay not configured.' });
  }

  try {
    const { amount, currency = 'INR', orderPayload } = req.body;
    const {user} = req;

    if (!orderPayload) {
      return res.status(400).json({ error: 'Order payload is required.' });
    }

    console.log("user in initiate order",user);
    console.log("orderPayload in initiate order",orderPayload);
    if(user?.id !== orderPayload?.p_user_id) {
      return res.status(403).json({ error: 'User is not authorized to initiate this order.' });
    }
    if (!amount || amount < 49) {
      return res.status(400).json({ error: 'Amount is required and must be at least ₹49.' });
    }

    const receipt = `rcpt_${crypto.randomBytes(12).toString('hex')}`;
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(orderPayload)).digest('hex');

    const paymentToken = jwt.sign(
        { 
            hash: payloadHash, 
            razorpay_order_id: order.id 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '15m' }
    );


    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      token: paymentToken
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to initiate order.' });
  }
}


export const finalisePayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderPayload, // This contains all the params for your RPC function
      token
    } = req.body;

    const {user} = req;
    const paymentType = orderPayload?.p_payment_type;

    // STEP A: VERIFY SIGNATURE (only for online payments)
    if (paymentType === 'online') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing required payment parameters.' });
      }

      if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing.' });
      }

       let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired payment token.' });
      }

      if(orderPayload?.p_user_id !== user?.id) {
        return res.status(403).json({ message: 'User is not authorized to finalize this payment.' });
      }

      if (decodedToken.razorpay_order_id !== razorpay_order_id) {
          return res.status(400).json({ message: 'Token and order ID mismatch.' });
      }

      const receivedPayloadHash = crypto.createHash('sha256').update(JSON.stringify(orderPayload)).digest('hex');
      if (decodedToken.hash !== receivedPayloadHash) {
          return res.status(400).json({ message: 'Order details have been tampered with. Verification failed.' });
      }
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid payment signature.' });
      }
      console.log('✅ Payment signature verified successfully.');

       const payment = await razorpay.payments.fetch(razorpay_payment_id);

       console.log("payment", payment);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found on Razorpay." });
      }

      if (payment.order_id !== razorpay_order_id) {
        return res.status(400).json({ message: "Payment does not belong to the given order." });
      }

      if (payment.status !== "captured") {
        return res.status(400).json({ message: `Payment is not captured. Current status: ${payment.status}` });
      }


    }

    // STEP B: PREPARE AND CALL THE SECURE RPC FUNCTION
    const rpcParams = {
      ...orderPayload,
      // Use the verified payment ID for online, or 'cod' for cash
      p_payment_id: paymentType === 'online' ? razorpay_payment_id : 'cod',
    };

    // Assuming you have a Supabase service role client initialized
    // const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.rpc("handle_place_order_test", rpcParams);

    // STEP C: HANDLE POSTGRES-LEVEL ERRORS (e.g., connection issue, RLS violation)
    if (error) {
      console.error('❌ Supabase RPC Error:', error);
      try {
        // The error message from `RAISE EXCEPTION` is a JSON string
        const parsedError = JSON.parse(error.message);
        return res.status(parsedError.status || 500).json(parsedError);
      } catch (e) {
        // If parsing fails, it's a generic error
        return res.status(500).json({ message: "Failed to place order after payment." });
      }
    }

    // STEP D: HANDLE BUSINESS LOGIC RESPONSES FROM THE FUNCTION
    if (data) {
      console.log("RPC Data:", data);
      // Use a switch to handle all possible statuses returned by the RPC function
      switch (data.status) {
        case 'success':
          console.log('✅ Order successfully created in DB with ID:', data.order_id);
          return res.status(200).json(data); // 200 OK

        case 'price_change':
          console.log('⚠️ Price change detected.');
          return res.status(409).json(data); // 409 Conflict

        case 'item_deactivated':
          console.log('🚫 Item deactivated.');
          return res.status(410).json(data); // 410 Gone

        case 'item_not_found':
          console.log('🔍 Item not found.');
          return res.status(404).json(data); // 404 Not Found

        default:
          // Handle any unexpected but non-error status
          console.error('❓ Unexpected status from RPC:', data.status);
          return res.status(500).json({ message: 'Received an unknown response from the server.' });
      }
    }

    // Fallback for an unexpected state where there's no data and no error
    return res.status(500).json({ message: 'An unknown error occurred.' });

  } catch (err) {
    console.error('🔥 Fatal Error in /api/finalize-order:', err);
    res.status(500).json({ message: 'Internal server error during order finalization.' });
  }
}

