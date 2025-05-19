import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase-client";

const Referral = () => {
  const [referralCode, setReferralCode] = useState("");

  const referralLink = `${window.location.origin}/login/`;

  const getReferralCode = async () => {
    const user = await supabase.auth.getUser();
      console.log(user);
      const {data:userDetails, error} = await supabase.from("users")
      .select('*')
      .eq("user_id", user.data.user.id)
      .single();

      console.log("userDetails", userDetails);
      setReferralCode(userDetails.referral_code);

  };

  useEffect(() => {
      getReferralCode();
  }, []);

  function handleShare() {
  if (navigator.share) {
    navigator.share({
      title: "Join MyApp and earn rewards!",
      text: "Sign up using my referral link and get a bonus:",
      url: `${referralLink}${referralCode}`,
    })
    .then(() => console.log("Shared successfully!"))
    .catch((err) => console.error("Error sharing:", err));
  } else {
    alert("Sharing not supported on this browser. Please copy the link manually.");
  }
}

  return (
    <div>
      <h1 className="text-2xl font-bold">Referral Page</h1>
      {referralCode ? (
        <p className="mt-4">
          Share this link with your friends to earn rewards:{" "}
          <button
              onClick={handleShare}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Share Referral Link
            </button>
        </p>
      ) : (
        <p className="mt-4 text-gray-500">Loading referral code...</p>
      )}
    </div>
  );
};

export default Referral;
