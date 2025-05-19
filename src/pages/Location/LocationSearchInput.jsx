import { useEffect, useRef, useState } from "react";

const LocationSearchInput = () => {
  const inputRef = useRef(null);
  const [location, setLocation] = useState(null);

  const loadGoogleMapsScript = () => {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode"], // or use 'establishment' for places like restaurants
        componentRestrictions: { country: "in" }, // optional
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          alert("No geometry info for selected place.");
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setLocation({
          name: place.formatted_address,
          lat,
          lng,
        });
      });
    });
  }, []);

  return (
    <div className="p-4">
      <input
        type="text"
        ref={inputRef}
        placeholder="Search for a location"
        className="border border-gray-300 rounded px-3 py-2 w-full"
      />
      {location && (
        <div className="mt-4">
          <p><strong>{location.name}</strong></p>
          <p> Latitude: {location.lat}</p>
          <p> Longitude: {location.lng}</p>
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;
