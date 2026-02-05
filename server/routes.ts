import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Timeline
  app.get(api.timeline.list.path, async (_req, res) => {
    const items = await storage.getTimeline();
    res.json(items);
  });

  // Events
  app.get(api.events.list.path, async (_req, res) => {
    const items = await storage.getEvents();
    res.json(items);
  });

  // Gratitude
  app.get(api.gratitude.list.path, async (_req, res) => {
    const items = await storage.getGratitudeMessages();
    res.json(items);
  });

  app.post(api.gratitude.create.path, async (req, res) => {
    try {
      const input = api.gratitude.create.input.parse(req.body);
      const item = await storage.createGratitudeMessage(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Volunteer
  app.get(api.volunteer.list.path, async (_req, res) => {
    const items = await storage.getVolunteerRoles();
    res.json(items);
  });

  app.post(api.volunteer.signUp.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const item = await storage.signUpForRole(id);
    if (!item) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json(item);
  });

  // Time Capsule
  app.post(api.timeCapsule.create.path, async (req, res) => {
    try {
        const input = api.timeCapsule.create.input.parse(req.body);
        const item = await storage.createTimeCapsuleMessage(input);
        res.status(201).json(item);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
              message: err.errors[0].message,
              field: err.errors[0].path.join('.'),
            });
        }
        throw err;
    }
  });

  return httpServer;
}
