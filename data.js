/**
 * Sereni-Tea — Data Layer
 *
 * Single source of truth for tea products and AI response templates.
 * Separated from logic so catalogue changes never touch application code.
 */

"use strict";

/* ──────────────────────────────────────────────
   Tea Catalogue
   ────────────────────────────────────────────── */

const TEAS = Object.freeze([
  {
    id: 1, name: "Ceremonial Matcha", category: "green",
    emoji: "🍵", price: 24.99, badge: "Bestseller",
    desc: "Stone-ground Japanese matcha from Uji, Kyoto. Vibrant green, smooth umami flavor.",
    origin: "Japan", caffeine: "High", brew: "175°F / 2 min",
    bg: "linear-gradient(135deg, #a8e6cf, #dcedc1)",
  },
  {
    id: 2, name: "Dragon Well", category: "green",
    emoji: "🌿", price: 18.99, badge: null,
    desc: "Pan-roasted Chinese green tea with a sweet, mellow chestnut flavor and flat leaves.",
    origin: "China", caffeine: "Medium", brew: "175°F / 3 min",
    bg: "linear-gradient(135deg, #c3e88d, #e8f5c8)",
  },
  {
    id: 3, name: "Jasmine Dragon Pearl", category: "green",
    emoji: "🌸", price: 22.99, badge: "Popular",
    desc: "Hand-rolled pearls scented with fresh jasmine blossoms. Unfurls beautifully in water.",
    origin: "China", caffeine: "Medium", brew: "180°F / 3 min",
    bg: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
  },
  {
    id: 4, name: "Earl Grey Supreme", category: "black",
    emoji: "☕", price: 14.99, badge: null,
    desc: "Classic bergamot-infused black tea with blue cornflower petals. Bold and aromatic.",
    origin: "India", caffeine: "High", brew: "212°F / 4 min",
    bg: "linear-gradient(135deg, #d1c4e9, #b39ddb)",
  },
  {
    id: 5, name: "Golden Assam", category: "black",
    emoji: "🫖", price: 12.99, badge: null,
    desc: "Full-bodied, malty Assam black tea with golden tips. Perfect breakfast tea.",
    origin: "India", caffeine: "High", brew: "212°F / 4 min",
    bg: "linear-gradient(135deg, #ffe0b2, #ffcc80)",
  },
  {
    id: 6, name: "Darjeeling First Flush", category: "black",
    emoji: "🏔️", price: 28.99, badge: "Premium",
    desc: "The 'champagne of teas'. Light, floral with muscatel notes from the Himalayan foothills.",
    origin: "India", caffeine: "Medium", brew: "200°F / 3 min",
    bg: "linear-gradient(135deg, #fff9c4, #fff176)",
  },
  {
    id: 7, name: "Chamomile Dreams", category: "herbal",
    emoji: "🌼", price: 11.99, badge: null,
    desc: "Pure Egyptian chamomile flowers. Naturally caffeine-free, perfect for bedtime.",
    origin: "Egypt", caffeine: "None", brew: "212°F / 5 min",
    bg: "linear-gradient(135deg, #fff9c4, #ffecb3)",
  },
  {
    id: 8, name: "Peppermint Bliss", category: "herbal",
    emoji: "🌱", price: 10.99, badge: null,
    desc: "Refreshing peppermint leaves for a cooling, invigorating herbal infusion.",
    origin: "USA", caffeine: "None", brew: "212°F / 5 min",
    bg: "linear-gradient(135deg, #c8e6c9, #a5d6a7)",
  },
  {
    id: 9, name: "Lavender Honey", category: "herbal",
    emoji: "💜", price: 13.99, badge: "New",
    desc: "French lavender buds with a hint of natural honey flavor. Deeply calming.",
    origin: "France", caffeine: "None", brew: "200°F / 5 min",
    bg: "linear-gradient(135deg, #e1bee7, #ce93d8)",
  },
  {
    id: 10, name: "Tie Guan Yin", category: "oolong",
    emoji: "🍃", price: 26.99, badge: "Award Winner",
    desc: "Iron Goddess of Mercy. Lightly oxidized with orchid fragrance and creamy body.",
    origin: "China", caffeine: "Medium", brew: "195°F / 4 min",
    bg: "linear-gradient(135deg, #b2dfdb, #80cbc4)",
  },
  {
    id: 11, name: "Da Hong Pao", category: "oolong",
    emoji: "🔥", price: 34.99, badge: "Rare",
    desc: "Big Red Robe — deeply roasted Wuyi rock oolong with mineral and caramel notes.",
    origin: "China", caffeine: "Medium", brew: "200°F / 4 min",
    bg: "linear-gradient(135deg, #ffccbc, #ff8a65)",
  },
  {
    id: 12, name: "Milk Oolong", category: "oolong",
    emoji: "🥛", price: 21.99, badge: null,
    desc: "Naturally creamy and buttery oolong from Taiwan's high mountains. Silky smooth.",
    origin: "Taiwan", caffeine: "Medium", brew: "195°F / 3 min",
    bg: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
  },
  {
    id: 13, name: "Masala Chai", category: "specialty",
    emoji: "🫚", price: 13.99, badge: "Bestseller",
    desc: "Robust Assam black tea with cinnamon, cardamom, ginger, cloves and black pepper.",
    origin: "India", caffeine: "High", brew: "212°F / 5 min",
    bg: "linear-gradient(135deg, #d7ccc8, #bcaaa4)",
  },
  {
    id: 14, name: "Butterfly Pea Flower", category: "specialty",
    emoji: "🦋", price: 16.99, badge: "Trending",
    desc: "Stunning blue herbal tea that changes to purple with lemon. Rich in antioxidants.",
    origin: "Thailand", caffeine: "None", brew: "200°F / 4 min",
    bg: "linear-gradient(135deg, #bbdefb, #90caf9)",
  },
  {
    id: 15, name: "Turmeric Golden Milk", category: "specialty",
    emoji: "✨", price: 15.99, badge: null,
    desc: "Anti-inflammatory blend of turmeric, cinnamon, ginger, and black pepper with coconut.",
    origin: "India", caffeine: "None", brew: "200°F / 5 min",
    bg: "linear-gradient(135deg, #fff176, #ffd54f)",
  },
  {
    id: 16, name: "Sencha Supreme", category: "green",
    emoji: "🎌", price: 19.99, badge: null,
    desc: "Premium Japanese steamed green tea with grassy, marine notes and umami sweetness.",
    origin: "Japan", caffeine: "Medium", brew: "170°F / 2 min",
    bg: "linear-gradient(135deg, #c5e1a5, #aed581)",
  },
]);

/** Lookup a tea by id — O(1) via pre-built map. */
const TEA_MAP = Object.freeze(
  TEAS.reduce((m, t) => { m[t.id] = t; return m; }, {})
);

/* ──────────────────────────────────────────────
   AI Response Templates

   Each key maps a detected intent to either:
     – { text, teaIds }   → prose + clickable product cards
     – string             → plain prose response
   ────────────────────────────────────────────── */

const AI_TEMPLATES = Object.freeze({
  calming:   { text: "For relaxation and calm, I recommend these soothing options:", teaIds: [7, 9, 8] },
  energy:    { text: "Need an energy boost? These teas have great caffeine and invigorating properties:", teaIds: [1, 4, 5] },
  popular:   { text: "Here are our most loved teas that our customers keep coming back for:", teaIds: [1, 13, 3] },
  sampler:   { text: "Great idea! Here's a curated sampler I'd recommend — one from each category:", teaIds: [1, 6, 7, 10, 14] },
  green:     { text: "Excellent choice! Here are our finest green teas, each with a unique character:", teaIds: [1, 2, 3, 16] },
  black:     { text: "Bold and robust! Our black tea selection offers something for every palate:", teaIds: [4, 5, 6] },
  herbal:    { text: "Caffeine-free and naturally soothing — perfect any time of day:", teaIds: [7, 8, 9] },
  oolong:    { text: "Ah, the art of oolong! These partially oxidized teas are truly special:", teaIds: [10, 11, 12] },
  specialty: { text: "Looking for something unique? Our specialty blends push the boundaries:", teaIds: [13, 14, 15] },
  health:    { text: "Tea is wonderful for health! Here are some particularly beneficial options:", teaIds: [1, 7, 15, 8] },

  brewing:
    "Great question about brewing! Here are some key tips:\n\n" +
    "🌡️ <strong>Temperature matters</strong> — Green teas need cooler water (170-180°F), black teas love boiling (212°F)\n" +
    "⏱️ <strong>Timing is key</strong> — Over-steeping makes tea bitter. Follow recommended times!\n" +
    "💧 <strong>Water quality</strong> — Use filtered water for the best taste\n" +
    "🍃 <strong>Quantity</strong> — Use about 1 tsp per 8 oz cup\n" +
    "🔄 <strong>Multiple infusions</strong> — Oolong and green teas can be re-steeped 3-5 times!\n\n" +
    "Want brewing tips for a specific tea?",

  price:
    "Our teas range from <strong>$10.99</strong> (Peppermint Bliss) to <strong>$34.99</strong> (Da Hong Pao). " +
    "Most of our collection falls in the $12-$25 range. All prices are per 50 g.\n\n" +
    "Looking for something in a particular price range? I can help narrow it down! 💰",

  order:
    "I can help you place an order! Just add teas to your cart using the menu or tell me what you'd like, " +
    "and I'll add them for you. When you're ready, click the cart icon to checkout. 🍵",
});

/** Keyword → intent mapping for the AI router. Order matters: first match wins. */
const AI_INTENT_KEYWORDS = Object.freeze([
  { intent: "calming",   words: ["calm", "relax", "sleep", "stress", "anxiety", "peaceful", "sooth", "bedtime", "wind down"] },
  { intent: "energy",    words: ["energy", "boost", "wake", "morning", "alert", "focus", "caffeine", "strong"] },
  { intent: "popular",   words: ["popular", "best sell", "bestsell", "recommend", "favorite", "top", "most loved", "best"] },
  { intent: "sampler",   words: ["sampler", "sample", "variety", "try", "gift", "assortment", "selection"] },
  { intent: "green",     words: ["green tea", "matcha", "sencha", "japanese green"] },
  { intent: "black",     words: ["black tea", "earl grey", "assam", "darjeeling", "english breakfast"] },
  { intent: "herbal",    words: ["herbal", "chamomile", "peppermint", "lavender", "caffeine free", "no caffeine"] },
  { intent: "oolong",    words: ["oolong", "wu long", "tie guan", "da hong"] },
  { intent: "specialty", words: ["special", "unique", "different", "chai", "masala", "turmeric", "butterfly", "golden milk"] },
  { intent: "health",    words: ["health", "benefit", "antioxidant", "immune", "digest", "wellness", "good for"] },
  { intent: "brewing",   words: ["brew", "steep", "temperature", "how to make", "prepare", "instructions", "how long"] },
  { intent: "price",     words: ["price", "cost", "how much", "expensive", "cheap", "affordable"] },
  { intent: "order",     words: ["order", "checkout", "buy", "purchase", "pay"] },
]);

const AI_GREETINGS = Object.freeze([
  "Hello! Welcome to Sereni-Tea! 🍵 What kind of tea experience are you looking for today?",
  "Hi there, tea lover! I'm your AI sommelier. Tell me about your mood and I'll find the perfect cup!",
  "Welcome! 🌿 Ready to explore our tea collection? I'd love to help you discover something special.",
]);

const AI_FALLBACKS = Object.freeze([
  "That's a great question! What flavor profile appeals to you — sweet, earthy, floral, or bold?",
  "I'd love to help! Are you looking for something to energize, relax, or just enjoy?",
  "Interesting! Tell me more — I can recommend teas based on mood, flavor, caffeine level, or origin.",
]);
