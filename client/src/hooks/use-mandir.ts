import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type InsertGratitude, 
  type InsertTimeCapsule, 
  type VolunteerRole 
} from "@shared/schema";

// Timeline Hooks
export function useTimeline() {
  return useQuery({
    queryKey: [api.timeline.list.path],
    queryFn: async () => {
      const res = await fetch(api.timeline.list.path);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return api.timeline.list.responses[200].parse(await res.json());
    },
  });
}

// Events Hooks
export function useEvents() {
  return useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path);
      if (!res.ok) throw new Error("Failed to fetch events");
      return api.events.list.responses[200].parse(await res.json());
    },
  });
}

// Gratitude Hooks
export function useGratitudeMessages() {
  return useQuery({
    queryKey: [api.gratitude.list.path],
    queryFn: async () => {
      const res = await fetch(api.gratitude.list.path);
      if (!res.ok) throw new Error("Failed to fetch gratitude messages");
      return api.gratitude.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGratitudeMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertGratitude) => {
      const res = await fetch(api.gratitude.create.path, {
        method: api.gratitude.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.gratitude.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to post message");
      }
      return api.gratitude.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.gratitude.list.path] });
    },
  });
}

// Volunteer Hooks
export function useVolunteerRoles() {
  return useQuery({
    queryKey: [api.volunteer.list.path],
    queryFn: async () => {
      const res = await fetch(api.volunteer.list.path);
      if (!res.ok) throw new Error("Failed to fetch volunteer roles");
      return api.volunteer.list.responses[200].parse(await res.json());
    },
  });
}

export function useVolunteerSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.volunteer.signUp.path, { id });
      const res = await fetch(url, { method: api.volunteer.signUp.method });
      if (!res.ok) throw new Error("Failed to sign up");
      return api.volunteer.signUp.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.volunteer.list.path] });
    },
  });
}

// Time Capsule Hooks
export function useCreateTimeCapsuleMessage() {
  return useMutation({
    mutationFn: async (data: InsertTimeCapsule) => {
      const res = await fetch(api.timeCapsule.create.path, {
        method: api.timeCapsule.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit to time capsule");
      return api.timeCapsule.create.responses[201].parse(await res.json());
    },
  });
}
