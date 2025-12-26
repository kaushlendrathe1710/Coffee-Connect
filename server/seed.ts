import { db } from "./db";
import { users } from "@shared/schema";

const DEMO_PROFILES = [
  {
    email: "sarah@demo.com",
    name: "Sarah",
    age: "28",
    gender: "female",
    bio: "Coffee addict and book lover. Always looking for the perfect latte spot. I enjoy deep conversations and exploring new cafes.",
    photos: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"],
    coffeePreferences: ["Latte", "Cappuccino", "Flat White"],
    interests: ["Reading", "Travel", "Yoga", "Photography"],
    role: "host" as const,
    onboardingCompleted: true,
    verified: true,
    locationLatitude: "37.7749",
    locationLongitude: "-122.4194",
  },
  {
    email: "michael@demo.com",
    name: "Michael",
    age: "32",
    gender: "male",
    bio: "Entrepreneur by day, coffee enthusiast by all hours. Let's chat over espresso and share startup stories!",
    photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"],
    coffeePreferences: ["Espresso", "Cold Brew", "Americano"],
    interests: ["Tech", "Fitness", "Music", "Investing"],
    role: "host" as const,
    onboardingCompleted: true,
    verified: true,
    locationLatitude: "37.7849",
    locationLongitude: "-122.4094",
  },
  {
    email: "emma@demo.com",
    name: "Emma",
    age: "26",
    gender: "female",
    bio: "Photographer and matcha lover. Always seeking new perspectives and great company over a warm cup.",
    photos: ["https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"],
    coffeePreferences: ["Matcha", "Iced Coffee", "Oat Milk Latte"],
    interests: ["Photography", "Art", "Hiking", "Film"],
    role: "host" as const,
    onboardingCompleted: true,
    verified: true,
    locationLatitude: "37.7649",
    locationLongitude: "-122.4294",
  },
  {
    email: "james@demo.com",
    name: "James",
    age: "30",
    gender: "male",
    bio: "Software engineer who believes the best code is written with great coffee. Looking for meaningful connections.",
    photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"],
    coffeePreferences: ["Pour Over", "Cortado", "Nitro Cold Brew"],
    interests: ["Coding", "Gaming", "Cooking", "Travel"],
    role: "host" as const,
    onboardingCompleted: true,
    verified: true,
    locationLatitude: "37.7549",
    locationLongitude: "-122.4394",
  },
  {
    email: "olivia@demo.com",
    name: "Olivia",
    age: "27",
    gender: "female",
    bio: "Marketing professional by day, coffee connoisseur always. I appreciate good design and even better conversation.",
    photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"],
    coffeePreferences: ["Vanilla Latte", "Mocha", "Iced Caramel Macchiato"],
    interests: ["Design", "Marketing", "Podcasts", "Running"],
    role: "host" as const,
    onboardingCompleted: true,
    verified: true,
    locationLatitude: "37.7449",
    locationLongitude: "-122.4494",
  },
  {
    email: "david@demo.com",
    name: "David",
    age: "35",
    gender: "male",
    bio: "Doctor with a passion for specialty coffee. After saving lives, I like to unwind with a good cup and great company.",
    photos: ["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"],
    coffeePreferences: ["Single Origin", "Espresso", "Affogato"],
    interests: ["Medicine", "Wine", "Jazz", "Cooking"],
    role: "host" as const,
    onboardingCompleted: true,
    verified: true,
    locationLatitude: "37.7349",
    locationLongitude: "-122.4594",
  },
  {
    email: "guest1@demo.com",
    name: "Alex",
    age: "29",
    gender: "male",
    bio: "New to the city and looking to meet interesting people over coffee. Open to any cafe recommendations!",
    photos: ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400"],
    coffeePreferences: ["Latte", "Cappuccino"],
    interests: ["Music", "Sports", "Travel"],
    role: "guest" as const,
    onboardingCompleted: true,
    verified: true,
    locationLatitude: "37.7749",
    locationLongitude: "-122.4194",
  },
  {
    email: "guest2@demo.com",
    name: "Sophie",
    age: "25",
    gender: "female",
    bio: "Graduate student looking for study buddies and coffee companions. Always up for an iced coffee date!",
    photos: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400"],
    coffeePreferences: ["Iced Coffee", "Matcha"],
    interests: ["Reading", "Yoga", "Cooking"],
    role: "guest" as const,
    onboardingCompleted: true,
    verified: true,
    locationLatitude: "37.7849",
    locationLongitude: "-122.4094",
  },
];

async function seed() {
  console.log("Starting seed...");

  for (const profile of DEMO_PROFILES) {
    try {
      // Check if user already exists
      const { eq } = await import("drizzle-orm");
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values(profile);
        console.log(`Created user: ${profile.name} (${profile.email})`);
      } else {
        console.log(`User already exists: ${profile.email}`);
      }
    } catch (error) {
      console.error(`Error creating ${profile.email}:`, error);
    }
  }

  console.log("Seed completed!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
