import { SeededRandom, createSeededRandom } from "./random";

export interface AIEnhancedData {
  recommendations: string;
  costOptimization: string;
  materials: string;
  timeline: string;
  aiPrompts: string[];
}

export interface HousePlan {
  id: string;
  budget: number;
  houseType: string;
  style: string;
  size: number;
  plotSize: number;
  bedrooms: number;
  roofing: string;
  interiorFinish: string;
  costBreakdown: {
    land: number;
    foundation: number;
    walls: number;
    roofing: number;
    windows: number;
    interior: number;
    plumbing: number;
    electrical: number;
    labour: number;
    permits: number;
    furniture: number;
    landscaping: number;
  };
  timeline: string;
  notes: string[];
  aiPrompts: string[];
  aiEnhanced?: AIEnhancedData;
}

const ARCHITECTURAL_STYLES = [
  "Modern", "Swahili-inspired", "Colonial", "Minimalist", 
  "Contemporary Kenyan", "Rustic", "Mediterranean"
];

const ROOFING_TYPES = [
  "Clay tile", "Mabati (iron sheets)", "Flat concrete", 
  "Stone-coated steel", "Makuti thatch"
];

const INTERIOR_FINISHES = [
  "Ceramic tiles", "Hardwood floors", "Laminate flooring",
  "Polished concrete", "Natural stone", "Vinyl planks"
];

const LANDSCAPE_IDEAS = [
  "tropical garden with palm trees",
  "drought-resistant indigenous plants",
  "vegetable garden with tomatoes and sukuma wiki",
  "flowering bougainvillea hedge",
  "jacaranda tree shade",
  "gravel paths with native grasses"
];

export const generateHousePlan = (budget: number): HousePlan => {
  const rng = createSeededRandom(budget);
  
  // Determine house scale based on budget
  let bedrooms: number;
  let baseSize: number;
  let houseCategory: string;
  
  if (budget < 1000000) { // Under 1M
    bedrooms = rng.choice([1, 2]);
    baseSize = rng.range(30, 60);
    houseCategory = "Starter";
  } else if (budget < 3000000) { // 1M-3M
    bedrooms = rng.choice([2, 3]);
    baseSize = rng.range(60, 120);
    houseCategory = "Family";
  } else if (budget < 8000000) { // 3M-8M
    bedrooms = rng.choice([3, 4]);
    baseSize = rng.range(120, 200);
    houseCategory = "Executive";
  } else { // 8M+
    bedrooms = rng.choice([4, 5, 6]);
    baseSize = rng.range(200, 350);
    houseCategory = "Luxury";
  }

  const style = rng.choice(ARCHITECTURAL_STYLES);
  const roofing = rng.choice(ROOFING_TYPES);
  const interiorFinish = rng.choice(INTERIOR_FINISHES);
  
  const houseType = `${bedrooms}-Bedroom ${style} ${houseCategory === "Starter" ? "Bungalow" : houseCategory === "Family" ? "House" : houseCategory === "Executive" ? "Villa" : "Mansion"}`;
  
  const size = baseSize + rng.range(-10, 20);
  const plotSize = Math.max(size * 4, rng.range(400, 2000));

  // Cost calculations (realistic 2024-2025 Kenyan prices)
  const costBreakdown = calculateCosts(budget, size, bedrooms, rng);
  
  const timeline = generateTimeline(size, rng);
  const notes = generateNotes(budget, costBreakdown, rng);
  const aiPrompts = generateAIPrompts(houseType, style, roofing, interiorFinish, rng);

  return {
    id: `plan-${budget}-${Date.now()}`,
    budget,
    houseType,
    style,
    size,
    plotSize,
    bedrooms,
    roofing,
    interiorFinish,
    costBreakdown,
    timeline,
    notes,
    aiPrompts
  };
};

const calculateCosts = (budget: number, size: number, bedrooms: number, rng: SeededRandom) => {
  // Realistic Kenyan construction costs per sq meter (2024-2025)
  const constructionCostPerSqm = rng.range(25000, 45000); // KES 25k-45k per sqm
  const totalConstruction = size * constructionCostPerSqm;
  
  // Land costs (varies greatly by location)
  const landCostPerSqm = rng.range(500, 15000); // KES 500-15k per sqm depending on location
  const landBudget = Math.min(budget * 0.3, 2000000); // Max 30% of budget or 2M
  const plotSize = Math.floor(landBudget / landCostPerSqm);
  const landCost = plotSize * landCostPerSqm;
  
  const remainingBudget = budget - landCost;
  
  // Distribute remaining budget across construction elements
  const foundation = Math.floor(remainingBudget * rng.range(12, 18) / 100);
  const walls = Math.floor(remainingBudget * rng.range(25, 35) / 100);
  const roofingCost = Math.floor(remainingBudget * rng.range(15, 25) / 100);
  const windows = Math.floor(remainingBudget * rng.range(8, 12) / 100);
  const interior = Math.floor(remainingBudget * rng.range(15, 25) / 100);
  const plumbing = Math.floor(remainingBudget * rng.range(8, 15) / 100);
  const electrical = Math.floor(remainingBudget * rng.range(6, 12) / 100);
  const labour = Math.floor(remainingBudget * rng.range(20, 30) / 100);
  const permits = Math.floor(remainingBudget * rng.range(2, 5) / 100);
  
  const spent = foundation + walls + roofingCost + windows + interior + plumbing + electrical + labour + permits;
  const remaining = remainingBudget - spent;
  
  const furniture = Math.floor(remaining * rng.range(60, 80) / 100);
  const landscaping = remaining - furniture;

  return {
    land: landCost,
    foundation,
    walls,
    roofing: roofingCost,
    windows,
    interior,
    plumbing,
    electrical,
    labour,
    permits,
    furniture: Math.max(furniture, 0),
    landscaping: Math.max(landscaping, 0)
  };
};

const generateTimeline = (size: number, rng: SeededRandom): string => {
  const baseMonths = Math.max(3, Math.floor(size / 30));
  const variation = rng.range(-1, 3);
  const totalMonths = baseMonths + variation;
  
  const minMonths = Math.max(totalMonths - 2, 3);
  const maxMonths = totalMonths + 3;
  
  return `${minMonths}–${maxMonths} months`;
};

const generateNotes = (budget: number, costs: { [key: string]: number }, rng: SeededRandom): string[] => {
  const notes = [];
  
  const totalSpent = Object.values(costs).reduce((sum: number, cost: number) => sum + cost, 0);
  const remaining = budget - totalSpent;
  
  if (remaining > budget * 0.1) {
    notes.push(`💡 You have KES ${remaining.toLocaleString()} remaining - consider upgrading finishes or adding a solar system.`);
  }
  
  if (budget < 2000000) {
    const tip = rng.choice([
      "💰 Consider starting with a simple design and upgrading later.",
      "🏗️ Self-construction can save 20-30% on labour costs.",
      "📍 Choose a location further from the city center to reduce land costs."
    ]);
    notes.push(tip);
  }
  
  const generalTip = rng.choice([
    "📋 Always get 3+ quotes from different contractors.",
    "🔍 Ensure all contractors are licensed with the National Construction Authority (NCA).",
    "🏛️ Budget an extra 10-15% for unexpected costs.",
    "⏰ Construction costs increase 5-10% annually - start soon!",
    "🌧️ Plan construction to avoid heavy rain seasons (March-May, Oct-Dec)."
  ]);
  notes.push(generalTip);
  
  return notes;
};

const generateAIPrompts = (houseType: string, style: string, roofing: string, interior: string, rng: SeededRandom): string[] => {
  const landscape = rng.choice(LANDSCAPE_IDEAS);
  const timeOfDay = rng.choice(["golden hour sunlight", "bright daylight", "soft morning light"]);
  const viewAngle = rng.choice(["front elevation view", "3/4 angle view", "perspective view"]);
  const extra = rng.choice([
    "with large windows", "with covered patio", "with modern entrance",
    "with circular driveway", "with garden pathway", "with outdoor seating area"
  ]);

  const basePrompt = `Ultra-realistic ${houseType.toLowerCase()}, ${style.toLowerCase()} architecture, ${roofing.toLowerCase()} roof, ${interior} floors, ${extra}, ${landscape}, ${viewAngle}, ${timeOfDay}, Kenyan residential setting, professional architectural photography, 8K high resolution`;
  
  const variations = [
    basePrompt,
    basePrompt.replace("ultra-realistic", "photorealistic drone shot of").replace(viewAngle, "aerial view"),
    basePrompt.replace("8K high resolution", "wide angle lens, detailed textures, natural lighting")
  ];
  
  return variations.slice(0, rng.range(1, 3));
};