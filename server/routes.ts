import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { sendOTPEmail, generateOTP } from "./services/email";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtp({
        email: email.toLowerCase(),
        code: otp,
        expiresAt,
      });

      const sent = await sendOTPEmail(email, otp);

      if (!sent) {
        return res.status(500).json({ error: "Failed to send OTP email" });
      }

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }

      const validOtp = await storage.getValidOtp(email, code);

      if (!validOtp) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      await storage.markOtpUsed(validOtp.id);

      let user = await storage.getUserByEmail(email);

      if (!user) {
        user = await storage.createUser({ email: email.toLowerCase() });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          photos: user.photos,
          coffeePreferences: user.coffeePreferences,
          interests: user.interests,
          availability: user.availability,
          role: user.role,
          location: user.locationLatitude && user.locationLongitude
            ? { latitude: parseFloat(user.locationLatitude), longitude: parseFloat(user.locationLongitude) }
            : null,
          verified: user.verified,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
        },
        isNewUser: !user.onboardingCompleted,
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.location) {
        updates.locationLatitude = updates.location.latitude?.toString();
        updates.locationLongitude = updates.location.longitude?.toString();
        delete updates.location;
      }

      const user = await storage.updateUser(id, updates);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          photos: user.photos,
          coffeePreferences: user.coffeePreferences,
          interests: user.interests,
          availability: user.availability,
          role: user.role,
          location: user.locationLatitude && user.locationLongitude
            ? { latitude: parseFloat(user.locationLatitude), longitude: parseFloat(user.locationLongitude) }
            : null,
          verified: user.verified,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          photos: user.photos,
          coffeePreferences: user.coffeePreferences,
          interests: user.interests,
          availability: user.availability,
          role: user.role,
          location: user.locationLatitude && user.locationLongitude
            ? { latitude: parseFloat(user.locationLatitude), longitude: parseFloat(user.locationLongitude) }
            : null,
          verified: user.verified,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
