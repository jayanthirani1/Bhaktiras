import {
  timelineItems, events, gratitudeMessages, volunteerRoles, timeCapsuleMessages,
  type TimelineItem, type Event, type GratitudeMessage, type VolunteerRole, type TimeCapsuleMessage,
  type InsertGratitude, type InsertTimeCapsule
} from "@shared/schema";

export interface IStorage {
  getTimeline(): Promise<TimelineItem[]>;
  getEvents(): Promise<Event[]>;
  getGratitudeMessages(): Promise<GratitudeMessage[]>;
  createGratitudeMessage(message: InsertGratitude): Promise<GratitudeMessage>;
  getVolunteerRoles(): Promise<VolunteerRole[]>;
  signUpForRole(id: number): Promise<VolunteerRole | undefined>;
  createTimeCapsuleMessage(message: InsertTimeCapsule): Promise<TimeCapsuleMessage>;
  // Seed helpers
  seedData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private timeline: TimelineItem[] = [];
  private events: Event[] = [];
  private gratitude: GratitudeMessage[] = [];
  private volunteers: VolunteerRole[] = [];
  private timeCapsule: TimeCapsuleMessage[] = [];
  private idCounter = {
    timeline: 1,
    events: 1,
    gratitude: 1,
    volunteers: 1,
    timeCapsule: 1
  };

  constructor() {
    this.seedData();
  }

  async getTimeline(): Promise<TimelineItem[]> {
    return this.timeline;
  }

  async getEvents(): Promise<Event[]> {
    return this.events;
  }

  async getGratitudeMessages(): Promise<GratitudeMessage[]> {
    return this.gratitude;
  }

  async createGratitudeMessage(insertMsg: InsertGratitude): Promise<GratitudeMessage> {
    const msg: GratitudeMessage = {
      ...insertMsg,
      id: this.idCounter.gratitude++,
      createdAt: new Date()
    };
    this.gratitude.push(msg);
    return msg;
  }

  async getVolunteerRoles(): Promise<VolunteerRole[]> {
    return this.volunteers;
  }

  async signUpForRole(id: number): Promise<VolunteerRole | undefined> {
    const roleIndex = this.volunteers.findIndex(v => v.id === id);
    if (roleIndex === -1) return undefined;
    
    // In a real app we'd track WHO signed up, but here just toggle status or set filled
    const updatedRole = { ...this.volunteers[roleIndex], isFilled: true };
    this.volunteers[roleIndex] = updatedRole;
    return updatedRole;
  }

  async createTimeCapsuleMessage(insertMsg: InsertTimeCapsule): Promise<TimeCapsuleMessage> {
    const msg: TimeCapsuleMessage = {
      ...insertMsg,
      id: this.idCounter.timeCapsule++,
      submittedAt: new Date()
    };
    this.timeCapsule.push(msg);
    return msg;
  }

  async seedData() {
    if (this.timeline.length > 0) return;

    // Timeline
    const timelineData = [
      { year: "2016", title: "Foundation Stone", description: "The first stone was laid, marking the beginning of our spiritual home." },
      { year: "2018", title: "Grand Opening", description: "Pran Pratishtha ceremony attended by thousands of devotees." },
      { year: "2020", title: "Digital Satsang", description: "Transitioned to online community gatherings during global challenges." },
      { year: "2023", title: "Youth Wing Expansion", description: "Launched new programs for the next generation of leaders." },
      { year: "2026", title: "10th Anniversary", description: "Celebrating a decade of devotion, service, and community." }
    ];
    timelineData.forEach(item => {
        this.timeline.push({ ...item, id: this.idCounter.timeline++, imageUrl: null });
    });

    // Events
    const eventsData = [
      { time: "06:00 AM", title: "Morning Aarti", description: "Start the day with divine blessings.", isLive: false },
      { time: "10:00 AM", title: "Anniversary Maha Yagna", description: "Special fire ceremony for peace and prosperity.", isLive: true },
      { time: "05:00 PM", title: "Cultural Program", description: "Dance, music, and drama by community children.", isLive: false },
      { time: "07:30 PM", title: "Evening Aarti & Bhajans", description: "Devotional singing and evening prayers.", isLive: false }
    ];
    eventsData.forEach(item => {
        this.events.push({ ...item, id: this.idCounter.events++ });
    });

    // Gratitude
    const gratitudeData = [
      { name: "Priya Sharma", message: "This mandir has been my second home. Happy 10th anniversary!" },
      { name: "Rahul Patel", message: "Grateful for the peace and guidance I find here." },
      { name: "The Gupta Family", message: "A decade of blessings. Har Har Mahadev!" }
    ];
    gratitudeData.forEach(item => {
        this.gratitude.push({ ...item, id: this.idCounter.gratitude++, createdAt: new Date() });
    });

    // Volunteer Roles
    const volunteerData = [
      { role: "Prasad Distribution", timeSlot: "10:00 AM - 12:00 PM", isFilled: false },
      { role: "Shoe Stall Management", timeSlot: "09:00 AM - 11:00 AM", isFilled: true },
      { role: "Crowd Control", timeSlot: "05:00 PM - 08:00 PM", isFilled: false },
      { role: "Kitchen Helper", timeSlot: "04:00 PM - 07:00 PM", isFilled: false }
    ];
    volunteerData.forEach(item => {
        this.volunteers.push({ ...item, id: this.idCounter.volunteers++ });
    });
  }
}

export const storage = new MemStorage();
