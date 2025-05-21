import React from 'react';

const RestaurantCard = ({ restaurant }) => {
  if (!restaurant) return null;
    console.log(restaurant);
  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 p-6 mt-6">
      <div className="flex items-start gap-6">
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          className="w-32 h-32 rounded-xl object-cover"
        />

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">{restaurant.name}</h2>
          <p className="text-gray-600">{restaurant.address}</p>
          <p className="text-sm text-gray-500">{restaurant.city}, {restaurant.country}</p>

          <div className="mt-2 flex gap-3 text-sm text-gray-700">
            <span>⭐ {restaurant.rating}</span>
            <span>₹{restaurant.average_price} avg price</span>
            <span>{restaurant.distance_km.toFixed(1)} km away</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {restaurant.cuisine_types && restaurant.cuisine_types.length > 0  && restaurant.cuisine_types.map((cuisine, idx) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium"
              >
                {cuisine}
              </span>
            ))}
            {restaurant.food_type && restaurant.food_type.length > 0 &&  restaurant.food_type.map((type, idx) => (
              <span
                key={idx}
                className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium"
              >
                {type}
              </span>
            ))}
          </div>

          {restaurant.is_open !== null && (
            <p className="mt-2 text-sm text-green-600 font-semibold">
              {restaurant.is_open ? 'Open Now' : 'Closed'}
            </p>
          )}

          {restaurant.phone && (
            <p className="text-sm text-gray-500 mt-2">📞 {restaurant.phone}</p>
          )}

          {restaurant.email && (
            <p className="text-sm text-gray-500">✉️ {restaurant.email}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
