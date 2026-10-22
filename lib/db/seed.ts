import type { Category, Feature, OptionGroup, Product, ProductTag, ArtKind, Settings } from "./types";

/**
 * Seed data — a mid-premium Lahore café (prices in PKR, 2026 market range).
 * Everything here is editable from the admin panel; this only runs when the database is empty.
 */

// ---------- reusable option groups ----------
const g = (id: string, name: string, multi: boolean, required: boolean, choices: [string, number][]): OptionGroup => ({
  id,
  name,
  multi,
  required,
  choices: choices.map(([label, priceDelta], i) => ({ id: `${id}-${i}`, label, priceDelta })),
});
const coffeeSize = () => g("size", "Size", false, true, [["Regular", 0], ["Large", 150]]);
const milk = () => g("milk", "Milk", false, true, [["Full cream", 0], ["Oat milk", 180], ["Almond milk", 180]]);
const sugar = () => g("sugar", "Sugar", false, true, [["Normal", 0], ["Less sugar", 0], ["No sugar", 0], ["Extra sweet", 0]]);
const chaiSize = () => g("serve", "Serving", false, true, [["Cup", 0], ["Dhaba kettle (2 cups)", 260]]);
const scoops = () => g("scoops", "Scoops", false, true, [["Single", 0], ["Double", 250], ["Triple", 450]]);
const flavours = () => g("flavour", "Flavour", false, true, [["Vanilla bean", 0], ["Belgian chocolate", 0], ["Sindhri mango", 0], ["Pista", 0], ["Strawberry", 0], ["Caramel biscuit", 50]]);
const toppings = () => g("toppings", "Toppings", true, false, [["Sprinkles", 50], ["Chocolate sauce", 80], ["Roasted nuts", 120], ["Brownie bits", 150]]);
const spice = () => g("spice", "Spice level", false, true, [["Mild", 0], ["Medium", 0], ["Lahori spicy", 0]]);
const shakeSize = () => g("size", "Size", false, true, [["Regular", 0], ["Large", 200]]);
const ice = () => g("ice", "Ice", false, true, [["Normal ice", 0], ["Less ice", 0]]);
const extras = () => g("extras", "Add-ons", true, false, [["Extra cheese", 120], ["Side of fries", 250], ["Garlic mayo dip", 60]]);

const now = new Date("2026-10-18T09:00:00+05:00").toISOString();

type P = [name: string, desc: string, price: number, art: ArtKind, tint: string, tags?: ProductTag[], options?: OptionGroup[], featured?: boolean];
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function build(categoryId: string, rows: P[]): Product[] {
  return rows.map(([name, description, price, art, tint, tags = [], options = [], featured = false], i) => ({
    id: `${categoryId}-${slug(name)}`,
    slug: slug(name),
    name,
    description,
    categoryId,
    price,
    image: null,
    art,
    tint,
    tags,
    options,
    available: true,
    featured,
    sortOrder: i,
    createdAt: now,
    updatedAt: now,
  }));
}

export const SEED_CATEGORIES: Category[] = [
  { id: "coffee", slug: "coffee", name: "Coffee", tagline: "Pulled to order on our house blend", color: "cocoa", art: "cup", sortOrder: 0 },
  { id: "chai", slug: "chai", name: "Chai & Tea", tagline: "Doodh patti to Kashmiri — the Lahori way", color: "chai", art: "chai-glass", sortOrder: 1 },
  { id: "ice-cream", slug: "ice-cream", name: "Ice Cream", tagline: "Small-batch scoops, kulfi & sundaes", color: "berry", art: "cone", sortOrder: 2 },
  { id: "cold-drinks", slug: "cold-drinks", name: "Cold Drinks", tagline: "Margaritas, lassi & iced teas", color: "lagoon", art: "mojito", sortOrder: 3 },
  { id: "shakes", slug: "shakes", name: "Shakes", tagline: "Thick, cold and properly loaded", color: "pista", art: "shake", sortOrder: 4 },
  { id: "snacks", slug: "snacks", name: "Snacks", tagline: "Sandwiches, fries & chai-time bites", color: "mango", art: "sandwich", sortOrder: 5 },
  { id: "desserts", slug: "desserts", name: "Desserts", tagline: "Lava cakes, kunafa & mithai", color: "ube", art: "cake", sortOrder: 6 },
];

export const SEED_PRODUCTS: Product[] = [
  ...build("coffee", [
    ["Espresso", "Double shot of our medium-dark house blend.", 450, "cup", "#4A2412", [], [sugar()]],
    ["Americano", "Espresso lengthened with hot water — clean and bold.", 550, "cup", "#3B1C0D", [], [coffeeSize(), sugar()]],
    ["Cappuccino", "Equal parts espresso, steamed milk and velvety foam.", 690, "cup", "#B9814F", [], [coffeeSize(), milk(), sugar()]],
    ["Café Latte", "Smooth espresso with plenty of silky steamed milk.", 720, "cup", "#C9965F", [], [coffeeSize(), milk(), sugar()]],
    ["Spanish Latte", "Our bestseller — espresso, milk and condensed-milk sweetness.", 850, "cup", "#D1A06A", ["bestseller"], [coffeeSize(), milk()], true],
    ["Caramel Macchiato", "Vanilla milk marked with espresso and caramel drizzle.", 890, "cup", "#C68A45", [], [coffeeSize(), milk()]],
    ["Iced Spanish Latte", "The summer favourite, poured over ice.", 920, "iced", "#C9965F", ["bestseller"], [coffeeSize(), milk(), ice()], true],
    ["Cold Brew", "Steeped 18 hours for a smooth, low-acid kick.", 750, "iced", "#3B1C0D", [], [ice(), sugar()]],
  ]),
  ...build("chai", [
    ["Doodh Patti", "Strong tea leaves boiled in full-cream milk. Proper Lahori.", 280, "chai-glass", "#C58A55", ["bestseller", "veg"], [chaiSize(), sugar()], true],
    ["Karak Chai", "Extra-strong, cardamom-laced and slow-boiled.", 320, "chai-glass", "#A86A35", ["veg"], [chaiSize(), sugar()]],
    ["Kashmiri Chai", "Pink noon chai with pistachio and almond flakes.", 450, "chai-glass", "#E7A9B4", ["bestseller", "veg"], [chaiSize(), sugar()], true],
    ["Matka Chai", "Doodh patti served in a clay matka for that smoky aroma.", 380, "matka", "#C58A55", ["veg"], [sugar()]],
    ["Masala Chai", "Ginger, cinnamon, clove and black pepper.", 340, "chai-glass", "#B5793F", ["veg"], [chaiSize(), sugar()]],
    ["Green Tea", "Light, calming and caffeine-gentle. Honey on the side.", 250, "chai-glass", "#B9C77A", ["veg", "low-caffeine"], [sugar()]],
    ["Lemon Honey Ginger", "Soothing hot brew — perfect for Lahore's smog season.", 300, "chai-glass", "#E7C35A", ["veg", "low-caffeine"]],
  ]),
  ...build("ice-cream", [
    ["Scoop Cone", "Waffle cone with your choice of small-batch flavour.", 350, "cone", "#F7C9D4", ["veg"], [flavours(), scoops(), toppings()]],
    ["Kulfi on a Stick", "Slow-reduced milk kulfi — malai, pista or mango.", 280, "kulfi", "#F3E3B8", ["veg"], [g("kulfi", "Flavour", false, true, [["Malai", 0], ["Pista", 0], ["Mango", 30]])]],
    ["Brownie Sundae", "Warm fudge brownie, two scoops, hot chocolate sauce.", 790, "sundae", "#6B3A22", ["bestseller", "veg"], [toppings()], true],
    ["Mango Sundae", "Sindhri mango scoops, fresh mango and cream.", 650, "sundae", "#FFC53D", ["seasonal", "veg"], [toppings()]],
    ["Falooda", "Rose syrup, vermicelli, basil seeds, kulfi and nuts.", 590, "sundae", "#F28AA5", ["veg"]],
    ["Banana Split", "Three scoops, banana, cream and all the sauces.", 850, "sundae", "#FFE08A", ["veg"]],
    ["Affogato", "Vanilla scoop drowned in a hot espresso shot.", 690, "sundae", "#F6E7CF", ["veg"]],
  ]),
  ...build("cold-drinks", [
    ["Mint Margarita", "Fresh mint, lemon and a slushy crunch.", 450, "mojito", "#9ED89A", ["bestseller", "veg"], [ice()], true],
    ["Blue Lagoon Mojito", "Blue curaçao syrup, lime, mint and soda.", 520, "mojito", "#4FC3E8", ["veg"], [ice()]],
    ["Peach Iced Tea", "House-brewed black tea with peach.", 420, "iced", "#F2A65A", ["veg"], [ice(), sugar()]],
    ["Mango Lassi", "Thick yoghurt blended with Sindhri mango.", 480, "iced", "#FFC53D", ["veg", "seasonal"]],
    ["Sweet Lassi", "Classic chilled yoghurt lassi with malai on top.", 380, "iced", "#F8F1E3", ["veg"]],
    ["Fresh Lime Soda", "Sweet, salty or mixed — your call.", 320, "mojito", "#D8F08A", ["veg"], [g("style", "Style", false, true, [["Sweet", 0], ["Salty", 0], ["Mixed", 0]])]],
    ["Fresh Orange Juice", "Squeezed to order. Seasonal kinnow when available.", 550, "iced", "#FF9F1C", ["veg", "seasonal"]],
    ["Soft Drink (Can)", "Chilled 330 ml can.", 180, "can", "#E8476A", ["veg"], [g("flavour", "Choose", false, true, [["Cola", 0], ["Lemon-lime", 0], ["Orange", 0], ["Diet cola", 0]])]],
  ]),
  ...build("shakes", [
    ["Cookies & Cream Shake", "Vanilla ice cream blended with chocolate cookies.", 790, "shake", "#E9E2DA", ["bestseller", "veg"], [shakeSize()], true],
    ["Chocolate Hazelnut Shake", "Rich hazelnut spread, chocolate ice cream, whipped cream.", 890, "shake", "#7A4A35", ["veg"], [shakeSize()]],
    ["Mango Shake", "Sindhri mangoes and milk — Pakistan in a glass.", 590, "shake", "#FFC53D", ["veg", "seasonal"], [shakeSize()]],
    ["Strawberry Shake", "Fresh strawberries with strawberry ice cream.", 650, "shake", "#F59AB0", ["veg"], [shakeSize()]],
    ["Peanut Butter Banana", "Protein-packed with banana, PB and honey.", 820, "shake", "#D9A86C", ["veg", "new"], [shakeSize()]],
    ["Cold Coffee Shake", "Espresso, vanilla ice cream and milk.", 720, "shake", "#B9814F", ["veg"], [shakeSize()]],
  ]),
  ...build("snacks", [
    ["Club Sandwich", "Triple-decker with chicken, egg, cheese and fries.", 950, "sandwich", "#F2C14E", ["bestseller"], [extras()], true],
    ["Chicken Tikka Panini", "Tikka chicken, mint mayo and cheese on pressed bread.", 890, "sandwich", "#E07A3F", ["spicy"], [spice(), extras()]],
    ["Loaded Fries", "Fries with chicken, cheese sauce, jalapeños and sauces.", 750, "fries", "#FFC53D", ["spicy"], [spice()]],
    ["Masala Fries", "Crispy fries tossed in house chaat masala.", 450, "fries", "#FFB627", ["veg"], [spice()]],
    ["Chicken Shawarma Wrap", "Garlic sauce, pickles and grilled chicken in a wrap.", 650, "wrap", "#E9C38A", [], [spice(), extras()]],
    ["Zinger Burger", "Crispy fried fillet, lettuce and spicy mayo.", 890, "burger", "#E4A04A", ["spicy"], [spice(), extras()]],
    ["Bun Kebab", "Lahori street classic with chutney and egg.", 450, "burger", "#B5652E", ["spicy"], [spice()]],
    ["Samosa Platter", "Four potato samosas with imli and green chutney.", 380, "samosa", "#E8A24A", ["veg"]],
    ["Chicken Nuggets", "Eight golden nuggets with honey mustard.", 650, "nuggets", "#E8A24A"],
  ]),
  ...build("desserts", [
    ["Molten Lava Cake", "Warm chocolate cake with a gooey centre and a scoop.", 790, "cake", "#5A2D18", ["bestseller", "veg"], [], true],
    ["Kunafa", "Crispy kataifi, molten cheese, sugar syrup and pistachio.", 950, "bowl", "#F0A93B", ["veg"]],
    ["Fudge Brownie", "Dense, chewy and best with chai.", 450, "brownie", "#4A2412", ["veg"]],
    ["Blueberry Cheesecake", "Baked New York style with blueberry compote.", 850, "cake", "#A98BE0", ["veg"]],
    ["Gulab Jamun (2)", "Warm, syrupy and finished with pistachio.", 300, "bowl", "#9B4A22", ["veg"]],
    ["Waffle & Scoop", "Belgian waffle, chocolate sauce and vanilla scoop.", 890, "waffle", "#E3A857", ["veg"], [toppings()]],
  ]),
];

export const SEED_FEATURES: Feature[] = [
  { id: "f-wifi", title: "Fast Wi-Fi & plug points", description: "Work, study or stream — every table has a socket.", icon: "wifi", active: true, sortOrder: 0 },
  { id: "f-late", title: "Open till 2 AM", description: "Late-night chai and scoops on weekends.", icon: "moon", active: true, sortOrder: 1 },
  { id: "f-family", title: "Family seating", description: "Separate family hall and a little kids' corner.", icon: "family", active: true, sortOrder: 2 },
  { id: "f-delivery", title: "Delivery across Lahore", description: "Hot stays hot, cold stays cold — in 30–45 minutes.", icon: "truck", active: true, sortOrder: 3 },
  { id: "f-halal", title: "100% halal kitchen", description: "Halal-certified meat and ingredients only.", icon: "halal", active: true, sortOrder: 4 },
  { id: "f-pay", title: "Cash, card or wallet", description: "Pay with cash, card, JazzCash or Easypaisa.", icon: "wallet", active: true, sortOrder: 5 },
];

export const SEED_SETTINGS: Settings = {
  cafeName: "Sip & Scoop",
  announcement: "Today's deal · any chai + samosa platter Rs 550 · 4–7 PM · Free delivery over Rs 2,500",
  tagline: "Single-origin coffee, Lahori chai, hand-churned ice cream and honest snacks — made slowly, served warmly.",
  phone: "+92 42 3500 0000",
  whatsapp: "+92 300 0000000",
  email: "hello@sipandscoop.pk",
  address: "Plot 21, MM Alam Road, Gulberg III",
  city: "Lahore",
  mapsQuery: "MM Alam Road, Gulberg III, Lahore",
  hours: [
    { days: "Mon – Thu", time: "9:00 AM – 1:00 AM" },
    { days: "Fri – Sun", time: "9:00 AM – 2:00 AM" },
  ],
  deliveryFee: 150,
  freeDeliveryOver: 2500,
  deliveryAreas: ["Gulberg", "DHA", "Model Town", "Garden Town", "Johar Town", "Cantt", "Faisal Town", "Township"],
  deliveryTime: "30–45 minutes",
  socials: { instagram: "https://instagram.com/", facebook: "https://facebook.com/", tiktok: "https://tiktok.com/" },
  aiName: "Sippy",
  aiGreeting: "Assalam-o-alaikum! I'm Sippy ☕🍦 Ask me about our menu, prices, delivery, timings — or anything coffee, chai or ice cream.",
  // SAMPLE knowledge base — replace with the client's real policies in Admin → Settings & AI before launch.
  aiKnowledge: [
    "Weekday deal: any chai + Samosa Platter for Rs 550 (Mon–Thu, 4–7 PM).",
    "Students get 10% off with a valid student card before 6 PM (dine-in and pickup only).",
    "Birthday cakes need 24 hours' notice — 1 kg from Rs 3,200, 2 kg from Rs 5,800. Order on WhatsApp or ask the assistant to take a request.",
    "Catering & events: we cater birthdays, office events and dholkis for 20–150 guests. Share date, guest count and budget and the team calls back within one working day.",
    "Table bookings: we hold tables for groups of 6 or more for up to 15 minutes past the booking time. Smaller groups are walk-in.",
    "Refunds & cancellations: an order can be cancelled free of charge until it is marked 'Preparing'. If an item arrives wrong or damaged, send a photo on WhatsApp within 2 hours for a free replacement or refund.",
    "Allergens: our kitchen handles nuts, dairy, gluten and eggs. Oat and almond milk are available for coffee. We cannot guarantee any item is allergen-free.",
    "All drinks, ice creams and desserts are vegetarian. Meat is halal-certified.",
    "We have high chairs, a family hall and wheelchair access at the front entrance.",
    "Parking: valet available on MM Alam Road after 7 PM.",
    "Wi-Fi is free for customers; ask the counter for the password.",
  ].join("\n"),
  aiStarters: ["What's popular?", "Delivery charges?", "Timings?", "Something cold under Rs 500", "Track my order"],
};

/** Default owner account — created by `npm run db:seed` from ADMIN_EMAIL / ADMIN_PASSWORD. */
export const SEED_OWNER = { id: "admin-owner", name: "Café Owner", role: "owner" as const };
