import { formatPKR } from "@/lib/pricing";
import type { CafeContext } from "./context";
import type { Product } from "@/lib/db/types";
import { hoursText, isOpenNow } from "@/lib/hours";

/**
 * Built-in café assistant — works with no API key.
 * Intent matching (English + Roman Urdu keywords) over live menu/settings data, plus a small coffee/tea knowledge base.
 */
export type AgentReply = { reply: string; suggestions: string[] };

const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Word-start matching, so "fee" doesn't fire inside "coffee" or "late" inside "chocolate". */
const has = (q: string, ...words: (string | RegExp)[]) => words.some((w) => (typeof w === "string" ? new RegExp(`\\b${esc(w)}`).test(q) : w.test(q)));
const PRICE_WORDS = ["price", "kitne", "kitna", "kitnay", "rate", "how much", "cost", "qeemat", "kya hai price"];
const list = (ps: Product[], n = 6) => ps.slice(0, n).map((p) => `• ${p.name} — ${formatPKR(p.price)}`).join("\n");

const KNOWLEDGE: { keys: (string | RegExp)[]; answer: string }[] = [
  { keys: [/latte.*cappuccino|cappuccino.*latte/], answer: "Both are espresso + milk. A **cappuccino** has more foam (roughly ⅓ espresso, ⅓ milk, ⅓ foam) so it tastes stronger; a **latte** has much more steamed milk and a thin foam layer, so it's smoother and milkier." },
  { keys: ["spanish latte"], answer: "A **Spanish latte** is a latte sweetened with condensed milk — creamy, a little caramel-like and very popular in Pakistan. Ours is our bestseller!" },
  { keys: ["macchiato"], answer: "A traditional **macchiato** is espresso 'marked' with a spoon of foam. Our **Caramel Macchiato** is the café version: vanilla milk, espresso poured on top and caramel drizzle." },
  { keys: ["cold brew", /iced coffee/], answer: "**Cold brew** is steeped in cold water for 18 hours — smoother, less acidic and naturally sweeter. **Iced coffee/iced latte** is hot espresso poured over ice, so it's brighter and more roasty." },
  { keys: ["espresso"], answer: "**Espresso** is coffee brewed by forcing hot water through finely ground beans under pressure in ~25–30 seconds. It's the base of lattes, cappuccinos and Americanos." },
  { keys: ["americano"], answer: "An **Americano** is espresso topped up with hot water — similar strength to filter coffee, with espresso's flavour." },
  { keys: ["arabica", "robusta", /beans?/, "roast"], answer: "**Arabica** beans are sweeter and more aromatic; **Robusta** is stronger, more bitter and has almost double the caffeine. Our house blend is mostly Arabica with a little Robusta for crema, roasted medium-dark." },
  { keys: [/caffeine/, "neend", "sleep"], answer: "Rough caffeine guide: espresso shot ~65 mg, cappuccino/latte ~65–130 mg, cold brew ~150 mg+, doodh patti ~40–60 mg, green tea ~25–35 mg. For zero caffeine try our shakes, lassi, mint margarita or ice cream." },
  { keys: ["kashmiri", "pink chai", "gulabi"], answer: "**Kashmiri (noon) chai** is pink because green tea leaves are boiled with a pinch of baking soda, then milk is added — the reaction turns it rosy. It's lightly salty-sweet and topped with pistachio & almonds." },
  { keys: ["doodh patti", "karak"], answer: "**Doodh patti** is tea leaves boiled directly in milk (no water) — rich and strong. **Karak** is boiled even longer with cardamom for an extra-strong, thick cup." },
  { keys: ["matka"], answer: "**Matka chai** is served in a baked clay pot. The clay adds an earthy, slightly smoky aroma — a Lahori favourite on winter evenings." },
  { keys: ["kulfi"], answer: "**Kulfi** is made by slowly reducing milk until thick, then freezing it without churning — denser and creamier than ice cream, and it melts slower. Ours comes in malai, pista and mango." },
  { keys: ["falooda"], answer: "**Falooda** layers rose syrup, vermicelli, basil (tukh malanga) seeds, milk and a scoop of kulfi or ice cream, finished with nuts." },
  { keys: [/home|ghar.*(bana|brew)|brew.*home/], answer: "Quick home brew: use 1 g coffee per 15–16 ml water, water just off the boil (~93 °C), and grind fresh. For chai: boil water with tea leaves 1–2 min, add milk, then bring to a rolling boil 2–3 times for that doodh-patti body." },
  { keys: [/store|fresh.*beans/], answer: "Keep coffee beans in an airtight, opaque container at room temperature, away from heat and sunlight. Don't refrigerate — moisture ruins them. Best used within 2–4 weeks of roasting." },
];

function findProducts(q: string, ctx: CafeContext) {
  // generic words ("coffee", "shake", "tea"…) shouldn't pick a single product on their own
  const GENERIC = new Set(["coffee", "tea", "chai", "shake", "shakes", "ice", "cream", "drink", "drinks", "cold", "hot", "fresh", "chicken", "the", "and", "menu", "price"]);
  const allWords = [...new Set(q.split(/[^a-z0-9]+/).filter((w) => w.length > 2))];
  const words = allWords.filter((w) => !GENERIC.has(w));
  return ctx.products
    .map((p) => {
      const name = p.name.toLowerCase();
      let score = name.length > 3 && q.includes(name) ? 10 : 0;
      const nameWords = name.split(/[^a-z0-9]+/);
      for (const w of words) if (nameWords.includes(w)) score += 2;
      // two or more shared words (even generic ones, e.g. "cold coffee") also count
      const overlap = allWords.filter((w) => nameWords.includes(w)).length;
      if (overlap >= 2) score += overlap * 2;
      return { p, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

const CATEGORY_WORDS: Record<string, (string | RegExp)[]> = {
  coffee: ["coffee", "kafi", "latte", "cappuccino"],
  chai: ["chai", "tea", "chaye", "chaey"],
  "ice-cream": ["ice cream", "icecream", "scoop", "sundae", "kulfi"],
  "cold-drinks": ["cold drink", "drinks", "margarita", "mojito", "lassi", "juice", "soda", "thanda"],
  shakes: ["shake", "milkshake"],
  snacks: ["snack", "sandwich", "fries", "burger", "food", "khana", "wrap", "samosa"],
  desserts: ["dessert", "sweet", "meetha", "cake", "brownie", "kunafa"],
};

function openNow(ctx: CafeContext) {
  return { open: isOpenNow(ctx.settings.hours), label: hoursText(ctx.settings.hours) };
}

function productReply(found: Product[]): AgentReply {
  const p = found[0];
  const opts = p.options.map((g) => `${g.name}: ${g.choices.map((c) => c.label + (c.priceDelta ? ` (+${c.priceDelta})` : "")).join(", ")}`).join("\n");
  return {
    reply: `**${p.name}** — ${formatPKR(p.price)}\n${p.description}${opts ? `\n${opts}` : ""}${found.length > 1 ? `\n\nAlso: ${found.slice(1, 4).map((x) => `${x.name} (${formatPKR(x.price)})`).join(", ")}` : ""}`,
    suggestions: ["How do I order?", "Something similar but cheaper?"],
  };
}

export function localAgent(question: string, ctx: CafeContext): AgentReply {
  const q = question.toLowerCase().trim();
  // categories are matched by slug (e.g. "cold-drinks"), never by database id
  const slugById = new Map(ctx.categories.map((c) => [c.id, c.slug]));
  const inCat = (p: Product, ...slugs: string[]) => slugs.includes(slugById.get(p.categoryId) ?? "");
  const s = ctx.settings;
  const best = ctx.products.filter((p) => p.tags.includes("bestseller"));
  const defaultChips = s.aiStarters?.length ? s.aiStarters.slice(0, 4) : ["What's popular?", "Delivery charges?", "Timings?", "Something cold under Rs 500"];

  if (!q) return { reply: s.aiGreeting, suggestions: defaultChips };

  if (has(q, /^(hi|hello|hey|salam|aoa|assalam|asalam)/)) return { reply: s.aiGreeting, suggestions: defaultChips };

  if (has(q, "thank", "shukria", "shukriya", "jazakallah")) return { reply: "Anytime! Enjoy your treat 💛", suggestions: ["Show me desserts", "How do I order?"] };

  if (has(q, "track", "status", "where is my order", "kahan hai", "mera order", /\bss-?\d{3,}/)) return { reply: `You can check your order live on the **Track order** page (link in the footer) — enter your order number (e.g. SS-1001) and the mobile number you used. Or WhatsApp us at ${s.whatsapp}.`, suggestions: ["Delivery charges?", "Timings?"] };

  // budget: "under 500", "500 se kam"
  const budget = q.match(/(?:under|below|less than|within|budget|tak|se kam|rs\.?)\s*(\d{2,5})|(\d{2,5})\s*(?:se kam|tak|ke andar)/);
  if (budget) {
    const max = Number(budget[1] ?? budget[2]);
    let pool = ctx.products.filter((p) => p.price <= max);
    for (const [cat, words] of Object.entries(CATEGORY_WORDS)) if (has(q, ...words)) pool = pool.filter((p) => inCat(p, cat));
    if (has(q, "cold", "thanda", "chilled")) pool = pool.filter((p) => inCat(p, "cold-drinks", "shakes", "ice-cream") || p.art === "iced");
    pool.sort((a, b) => Number(b.tags.includes("bestseller")) - Number(a.tags.includes("bestseller")) || b.price - a.price);
    return pool.length
      ? { reply: `Here's what you can get for ${formatPKR(max)} or less:\n${list(pool, 8)}`, suggestions: ["Add a dessert?", "Delivery charges?"] }
      : { reply: `Nothing on the menu is under ${formatPKR(max)} in that category, sorry! Our most affordable items start at ${formatPKR(Math.min(...ctx.products.map((p) => p.price)))}.`, suggestions: ["Show cheapest items"] };
  }

  // "how much is the kashmiri chai?" → straight to the product
  const priced = has(q, ...PRICE_WORDS) ? findProducts(q, ctx) : [];
  if (priced.length) return productReply(priced);

  if (has(q, "time", "timing", "hours", "open", "close", /\bkab\b/, "khul", /\bband\b/, /\blate\b/)) {
    const o = openNow(ctx);
    const status = o.open === null ? "Here are our timings" : o.open ? "We're **open right now** ✅" : "We're **closed right now** — see you soon";
    return { reply: `${status}.\n${o.label}`, suggestions: ["Where are you?", "Do you deliver?"] };
  }

  if (has(q, "deliver", "delivery", "rider", "ghar", "area", "charges", "fee", "shipping")) {
    const area = s.deliveryAreas.find((a) => q.includes(a.toLowerCase()));
    const mentionsArea = /\b(dha|bahria|wapda|iqbal|cantt|johar|gulberg|model|garden|faisal|township|valencia|askari)\b/.test(q);
    const areaLine = area ? `Yes, we deliver to **${area}** 🎉` : mentionsArea ? `That area isn't on our regular list yet — WhatsApp us at ${s.whatsapp} and we'll try!` : `We deliver to: ${s.deliveryAreas.join(", ")}.`;
    return { reply: `${areaLine}\nDelivery fee is ${formatPKR(s.deliveryFee)} (free on orders over ${formatPKR(s.freeDeliveryOver)}), usually in ${s.deliveryTime}. Pickup is free.`, suggestions: ["How do I order?", "Payment methods?"] };
  }

  if (has(q, "pay", "jazzcash", "easypaisa", /\bcards?\b/, "cash", /\bcod\b/)) return { reply: "You can pay with **cash on delivery**, **debit/credit card**, **JazzCash** or **Easypaisa** — choose at checkout.", suggestions: ["Delivery charges?"] };

  if (has(q, "where", "address", "location", "kahan", "kidhar", "map", "direction", "parking")) {
    const park = s.aiKnowledge.split("\n").find((l) => /parking|valet/i.test(l));
    return { reply: `📍 ${s.address}, ${s.city}.${park ? `\n${park}` : ""}\nTap **Contact** in the menu for the map and directions.`, suggestions: ["Timings?", "Phone number?"] };
  }

  if (has(q, "phone", "number", "whatsapp", "contact", /\bcall\b/, "email")) return { reply: `📞 ${s.phone}\n💬 WhatsApp: ${s.whatsapp}\n✉️ ${s.email}`, suggestions: ["Timings?"] };

  if (has(q, "order", "kaise", "how to buy", "checkout")) return { reply: "Ordering is easy: open the **Menu**, tap a item, pick size / sugar / toppings and **Add to cart**. Then open the cart → **Checkout**, choose delivery or pickup and your payment method. You can also WhatsApp us at " + s.whatsapp + ".", suggestions: ["What's popular?", "Delivery charges?"] };

  if (has(q, "wifi", "wi-fi", "internet", "laptop", "work", "study", "parhai")) return { reply: "Yes! Fast Wi-Fi and plug points at every table — students and remote workers are always welcome. ☕💻", suggestions: ["Student discount?", "Timings?"] };
  if (has(q, "halal")) return { reply: "Yes — our kitchen is 100% halal, with halal-certified meat and ingredients only.", suggestions: ["Show snacks"] };
  if (has(q, "veg", "vegetarian", "no meat")) {
    const v = ctx.products.filter((p) => p.tags.includes("veg") && inCat(p, "snacks", "desserts"));
    return { reply: `All our drinks, ice creams and desserts are vegetarian. Veg snacks:\n${list(v)}`, suggestions: ["Something spicy?"] };
  }
  if (has(q, "spicy", "teekha", "mirch")) return { reply: `For spice lovers 🌶️ (ask for "Lahori spicy"):\n${list(ctx.products.filter((p) => p.tags.includes("spicy")))}`, suggestions: ["Something cold to go with it?"] };

  // owner-supplied facts (offers, policies, events)
  if (has(q, "deal", "offer", "discount", "promo", "student", "birthday", "cake", "event", "kids", "wheelchair", "family")) {
    const lines = s.aiKnowledge.split("\n").filter((l) => l.trim());
    const words = q.split(/\W+/).filter((w) => w.length > 3);
    const hits = lines.filter((l) => words.some((w) => l.toLowerCase().includes(w)));
    return { reply: (hits.length ? hits : lines).join("\n"), suggestions: ["What's popular?"] };
  }

  for (const k of KNOWLEDGE) if (has(q, ...k.keys)) return { reply: k.answer, suggestions: ["What's popular?", "Show the coffee menu"] };

  // specific products
  const found = findProducts(q, ctx);
  if (found.length) return productReply(found);

  // moods / weather
  if (has(q, "hot weather", "garmi", "summer", "refresh", "thanda", "cold")) return { reply: `Beat the Lahore heat 🧊\n${list(ctx.products.filter((p) => inCat(p, "cold-drinks", "shakes", "ice-cream") && p.tags.includes("bestseller")).concat(ctx.products.filter((p) => inCat(p, "cold-drinks"))).filter((p, i, a) => a.indexOf(p) === i))}`, suggestions: ["Under Rs 500?"] };
  if (has(q, "sardi", "winter", "smog", "warm", "garam")) return { reply: `Something warm for a Lahori winter ☕\n${list(ctx.products.filter((p) => inCat(p, "chai") || p.art === "cup"))}`, suggestions: ["Add a snack?"] };

  // categories
  const catWords: [string, (string | RegExp)[]][] = [
    ...Object.entries(CATEGORY_WORDS),
    // any category created in the admin is matched by its own name
    ...ctx.categories.filter((c) => !CATEGORY_WORDS[c.slug]).map((c) => [c.slug, [c.name.toLowerCase()]] as [string, string[]]),
  ];
  for (const [cat, words] of catWords) {
    if (has(q, ...words)) {
      const c = ctx.categories.find((x) => x.slug === cat);
      const items = c ? ctx.products.filter((p) => p.categoryId === c.id) : [];
      if (c && items.length) return { reply: `**${c.name}** — ${c.tagline}\n${list(items, 9)}`, suggestions: ["What's popular?", "How do I order?"] };
    }
  }

  if (has(q, "popular", "best", "recommend", "suggest", "famous", "kya lun", "kya order", "special", "signature", /\btry\b/)) return { reply: `Our crowd favourites ⭐\n${list(best, 8)}`, suggestions: ["Something cold under Rs 500", "Show desserts"] };
  if (has(q, "cheap", "sasta", "affordable", "lowest")) return { reply: `Easy on the wallet:\n${list([...ctx.products].sort((a, b) => a.price - b.price), 8)}`, suggestions: ["What's popular?"] };
  if (has(q, "menu", "items", "kya hai", "what do you have")) return { reply: `We serve ${ctx.categories.map((c) => c.name).join(", ")}. What are you in the mood for?`, suggestions: ctx.categories.slice(0, 4).map((c) => `Show ${c.name.toLowerCase()}`) };

  return {
    reply: `I'm best at questions about ${s.cafeName} — our menu, prices, timings, delivery — and anything coffee, chai or ice cream. Could you rephrase, or try one of these?`,
    suggestions: defaultChips,
  };
}
