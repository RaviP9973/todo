import { useEffect, useRef, useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";
const LocationSearchInput = ({setLocation,location}) => {
  const inputRef = useRef(null);
  // const [location, setLocation] = useState(null);
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
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/reverse-geocode?lat=${lat}&lng=${lng}`
      );
      const data = await response.json();
      // console.log(data);
      if (data.status === "OK" && data.results.length > 0) {
        const areaName = data.results[0].address_components.find(
          (component) =>
            component.types.includes("sublocality") ||
            component.types.includes("sublocality_level_1")
        )?.long_name;
        // setAreaName(areaName);
        // console.log(areaName);
        // return data.results[0].formatted_address;
        return data;
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
        console.log("place", place);
         const areaName = place.address_components.find(
          (component) =>
            component.types.includes("sublocality") ||
            component.types.includes("sublocality_level_1")
        )?.long_name;
        setLocation({
          name: place.formatted_address || place.name,
          lat,
          lng,
          accuracy: "From search",
          areaName: areaName
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

        const data = await getAddressFromLatLng(latitude, longitude);
        const address = data.results[0].formatted_address;
        const areaName = data.results[0].address_components.find(
          (component) =>
            component.types.includes("sublocality") ||
            component.types.includes("sublocality_level_1")
        )?.long_name;
        // console.log(address);
        setLocation({
          name: address,
          lat: latitude,
          lng: longitude,
          accuracy,
          areaName: areaName
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
    <div className=" bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Find Your Location
          </h1>
          <p className="text-gray-600">
            Search for a place or use your current location
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 backdrop-blur-lg bg-opacity-90">
          <div className="relative flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                ref={inputRef}
                placeholder="Search for a location..."
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl 
                text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 
                transition-all duration-300 hover:border-gray-300"
              />
            </div>
            <button
              onClick={getCurrentLocation}
              className="flex items-center justify-center gap-2 bg-gradient-to-r 
              from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 
              text-white rounded-xl px-6 py-4 transition-all duration-300 
              transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              <FaLocationDot className="text-xl" />
              <span className="font-medium">Current Location</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {location && (
            <div className="mt-6 animate-fadeIn">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 
                border border-blue-100 rounded-xl p-6 shadow-inner">
                <div className="space-y-4">
                  <div className="border-b border-blue-100 pb-4">
                    <h2 className="text-sm font-medium text-blue-500 mb-2">
                      LOCATION DETAILS
                    </h2>
                    <p className="text-xl font-semibold text-gray-800">
                      {location.name}
                    </p>
                    {location.areaName && (
                      <p className="text-sm text-gray-600 mt-1">
                        Area: <span className="text-emerald-600 font-medium">{location.areaName}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Latitude</p>
                      <p className="font-mono text-gray-800">{location.lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Longitude</p>
                      <p className="font-mono text-gray-800">{location.lng.toFixed(6)}</p>
                    </div>
                  </div>

                  {location.accuracy && (
                    <div className="pt-4 border-t border-blue-100">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Accuracy: {Math.round(location.accuracy)} meters
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSearchInput;
