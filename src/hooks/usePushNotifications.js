// src/hooks/usePushNotifications.js
import { useEffect } from 'react';
import {supabase} from "../supabase-client";

export function usePushNotifications() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        console.log("inside the usePushNotifications");

    const subscribe = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const reg = await navigator.serviceWorker.ready;
  // console.log("env", import.meta.env.VITE_VAPID_PUBLIC_KEY);
  
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.VITE_VAPID_PUBLIC_KEY
    )
  });

  // Convert the endpoint URL format
  const subscriptionData = sub.toJSON();
  // if (subscriptionData.endpoint.includes('/fcm/send/')) {
  //   subscriptionData.endpoint = subscriptionData.endpoint.replace(
  //     '/fcm/send/',
  //     '/wp/'
  //   );
  // }

  // console.log("Modified subscription:", subscriptionData);

  await fetch('https://todo-13m8.onrender.com/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.id,
      subscription: subscriptionData
    })
  });

  // console.log("Successfully subscribed to push notifications");
};

    Notification.requestPermission().then(permission => {
      if (permission === 'granted') subscribe();
    });
  
  }, []);
}


// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
