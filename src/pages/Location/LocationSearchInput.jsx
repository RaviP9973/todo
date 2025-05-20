import { useEffect, useRef, useState } from "react";
import { FaLocationDot } from "react-icons/fa6";

const LocationSearchInput = () => {
  const inputRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  // Load Google Maps + Places script
  const loadGoogleMapsScript = () => {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }&libraries=places`;
      script.async = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });
  };

  // Reverse Geocode: get formatted address from lat/lng using Google Maps Geocoding API
  const getAddressFromLatLng = async (lat, lng) => {
    // try {
    //   const response = await fetch(
    //     `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    //   );
    //   const data = await response.json();
    //   if (data.status === "OK" && data.results.length > 0) {
    //     return data.results[0].formatted_address;
    //   } else {
    //     return "Unknown location";
    //   }
    // } catch (error) {
    //   console.error("Reverse geocoding failed:", error);
    //   return "Unknown location";
    // }

    try {
      const response = await fetch(
        `https://todo-13m8.onrender.com/reverse-geocode?lat=${lat}&lng=${lng}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        return "Unknown location";
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["geocode"],
          componentRestrictions: { country: "in" },
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          alert("No geometry info for selected place.");
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setLocation({
          name: place.formatted_address || place.name,
          lat,
          lng,
          accuracy: "From search",
        });
        setError("");
      });
    });
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (accuracy > 10) {
          setError("Location accuracy is too low (>10 meters).");
          setLocation(null);
          //   return;
        }

        const address = await getAddressFromLatLng(latitude, longitude);
        console.log(address);
        setLocation({
          name: address,
          lat: latitude,
          lng: longitude,
          accuracy,
        });

        // setError("");
      },
      (err) => {
        setError(`Error getting location: ${err.message}`);
        setLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md ring-1 ring-gray-200">
      <div className="relative flex items-center">
        <input
          type="text"
          ref={inputRef}
          placeholder="Search for a location"
          className="flex-grow border border-gray-300 rounded-l-md px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <button
          onClick={getCurrentLocation}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-white rounded-r-md px-4 py-3 transition"
          aria-label="Get current location"
          title="Get current location"
        >
          <FaLocationDot className="text-xl text-red-400" />
          <span className="font-medium">Get current location</span>
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600 select-none">
          {error}
        </p>
      )}

      {location && (
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-inner">
          <p className="text-lg font-semibold text-blue-900">{location.name}</p>
          <p className="text-sm text-blue-800">Latitude: {location.lat}</p>
          <p className="text-sm text-blue-800">Longitude: {location.lng}</p>
          {location.accuracy && (
            <p className="text-xs text-blue-600 mt-1">
              Accuracy: {location.accuracy} meters
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;
