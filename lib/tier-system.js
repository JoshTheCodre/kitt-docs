
export const TIER_CONFIGS = {
  1: {
    name: "Starter",
    uploadLimit: 10,
    priceRange: { min: 100, max: 200 },
    suggestedPrices: [100, 150, 200]
  },
  2: {
    name: "Creator", 
    uploadLimit: 20,
    priceRange: { min: 200, max: 500 },
    suggestedPrices: [200, 300, 400, 500]
  },
  3: {
    name: "Pro",
    uploadLimit: 30, 
    priceRange: { min: 1000, max: 5000 },
    suggestedPrices: [1000, 2000, 3000, 5000]
  }
}

export const getUserTier = (uploadCount) => {
  if (uploadCount >= 30) return 3
  if (uploadCount >= 20) return 2
  return 1
}

export const getTierInfo = (tier) => {
  return TIER_CONFIGS[tier] || TIER_CONFIGS[1]
}

export const canUserUpload = (uploadCount, tier) => {
  const tierInfo = getTierInfo(tier)
  return uploadCount < tierInfo.uploadLimit
}

export const getPriceSuggestions = (tier) => {
  const tierInfo = getTierInfo(tier)
  return tierInfo.suggestedPrices
}
