import { useState } from "react";
import { FaStar, FaUtensils } from "react-icons/fa";
import { BiRupee } from "react-icons/bi";
// import { TbRadius } from "react-icons/tb";
import { RiMapPinRangeFill } from "react-icons/ri";
import LocationSearchInput from "../Location/LocationSearchInput";


const cuisines = ["Indian", "Chinese", "Italian", "Mexican", "Thai"];
const foodTypes = ["veg", "non-veg", "vegan"];

const RestaurantFilterForm = ({ onFilter ,setLocation, location}) => {
  const [minRating, setMinRating] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState([]);
  const [radius, setRadius] = useState(5);

  const handleCheckboxChange = (value, selected, setter) => {
    if (selected.includes(value)) {
      setter(selected.filter((v) => v !== value));
    } else {
      setter([...selected, value]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({
      minRating,
      minPrice,
      maxPrice,
      cuisineTypes: selectedCuisines.length > 0 ? selectedCuisines : null,
      foodType: selectedFoodTypes.length > 0 ? selectedFoodTypes : null,
      radius_m: radius * 1000, // convert km to meters
    });
  };

  return (
<form 
      onSubmit={handleSubmit} 
      className="space-y-6 p-6 rounded-2xl shadow-lg max-w-screen mx-auto bg-white border border-gray-100
        transform transition-all duration-300 hover:shadow-xl"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Filter Restaurants
        </h2>
        <p className="text-gray-500 text-sm mt-1">Customize your dining preferences</p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-gray-700 font-medium">
          <FaStar className="text-yellow-400" />
          Rating
        </label>
        <select
          value={minRating ?? ""}
          onChange={(e) => setMinRating(Number(e.target.value) || null)}
          className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 
            focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
        >
          <option value="">Any Rating</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>{r} ★ & above</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-gray-700 font-medium">
          <BiRupee className="text-green-500" />
          Price Range
        </label>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={minPrice ?? ""}
              onChange={(e) => setMinPrice(Number(e.target.value) || null)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 
                focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              placeholder="Min Price"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              value={maxPrice ?? ""}
              onChange={(e) => setMaxPrice(Number(e.target.value) || null)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 
                focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              placeholder="Max Price"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-gray-700 font-medium">
          <FaUtensils className="text-orange-500" />
          Cuisine Types
        </label>
        <div className="flex flex-wrap gap-2">
          {cuisines.map((cuisine) => (
            <label
              key={cuisine}
              className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-all duration-200
                transform hover:scale-105 active:scale-95
                ${selectedCuisines.includes(cuisine)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={selectedCuisines.includes(cuisine)}
                onChange={() => handleCheckboxChange(cuisine, selectedCuisines, setSelectedCuisines)}
              />
              {cuisine}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-gray-700 font-medium">
          Food Type
        </label>
        <div className="flex flex-wrap gap-2">
          {foodTypes.map((type) => (
            <label
              key={type}
              className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-all duration-200
                transform hover:scale-105 active:scale-95
                ${selectedFoodTypes.includes(type)
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={selectedFoodTypes.includes(type)}
                onChange={() => handleCheckboxChange(type, selectedFoodTypes, setSelectedFoodTypes)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-gray-700 font-medium">
          {/* <TbRadius className="text-purple-500" /> */}
          <RiMapPinRangeFill className="text-purple-500" />
          Search Radius
        </label>
        <div className="relative">
          <input
            type="range"
            min="1"
            max="2000"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
              accent-blue-500 transition-all duration-200"
          />
          <div className="text-center mt-2 text-gray-600 font-medium">
            {radius} km
          </div>
        </div>
      </div>

      <LocationSearchInput setLocation={setLocation} location={location}/>
      <button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 
          text-white rounded-xl font-medium shadow-md hover:shadow-lg 
          transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Apply Filters
      </button>
    </form>
  );
};

export default RestaurantFilterForm;
