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

    // Timeline – Shree KS Swaminarayan Temple Woolwich (sksswoolwich.org)
    const timelineData = [
      { year: "1988", title: "Foundation", description: "Shree KS Swaminarayan Temple Woolwich was established, laying the foundation for decades of devotion and community in Woolwich." },
      { year: "1990s", title: "Growing Community", description: "The temple became a spiritual home for devotees across London and the South East, with regular sabhas, festivals, and youth activities." },
      { year: "2017", title: "Bal Swaroop Ghanshyam Maharaj", description: "The sacred murti of Bal Swaroop Ghanshyam Maharaj was consecrated, bringing the divine child form of Bhagwan Swaminarayan to the mandir." },
      { year: "2020", title: "Digital Darshan", description: "During global challenges, the temple embraced online sabhas and live darshan so devotees could stay connected from home." },
      { year: "2024", title: "36 Years of Grace", description: "Patotsav 2024 celebrated 36 years of Woolwich Temple and the 7th annual Patotsav of Bal Swaroop Ghanshyam Maharaj—Rakshabandhan, abhishek, and festivities with the community." }
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
