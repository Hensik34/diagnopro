/**
 * Calculates distance between two (latitude, longitude) coordinates in meters using the Haversine formula
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

  const R = 6371000; // Radius of Earth in meters
  const radLat1 = (parseFloat(lat1) * Math.PI) / 180;
  const radLat2 = (parseFloat(lat2) * Math.PI) / 180;
  const dLat = radLat2 - radLat1;
  const dLon = ((parseFloat(lon2) - parseFloat(lon1)) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Verifies if user GPS location is within allowed branch radius
 */
function verifyBranchLocation(branch, userLat, userLng) {
  if (!branch || branch.latitude == null || branch.longitude == null) {
    return {
      verified: true,
      bypass: true,
      distanceMeters: 0,
      message: "Branch GPS coordinates not set. Verification bypassed.",
    };
  }

  if (userLat == null || userLng == null) {
    return {
      verified: false,
      bypass: false,
      distanceMeters: null,
      message: "GPS location is required to perform check-in/check-out at the lab branch.",
    };
  }

  const branchLat = parseFloat(branch.latitude);
  const branchLng = parseFloat(branch.longitude);
  const radius = parseInt(branch.geofence_radius_meters || 150, 10);
  const distance = calculateDistanceMeters(userLat, userLng, branchLat, branchLng);

  if (distance <= radius) {
    return {
      verified: true,
      bypass: false,
      distanceMeters: distance,
      radius,
      message: `Verified at ${branch.name} (${distance}m away)`,
    };
  }

  return {
    verified: false,
    bypass: false,
    distanceMeters: distance,
    radius,
    message: `You are ${distance}m away from ${branch.name}. Must be within ${radius}m to clock in/out.`,
  };
}

module.exports = {
  calculateDistanceMeters,
  verifyBranchLocation,
};
