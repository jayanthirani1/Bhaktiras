export interface SevaTeam {
  id: string
  name: string
  /** Optional scope line under the team name */
  summary?: string
  description: string
}

export const SEVA_TEAMS: SevaTeam[] = [
  {
    id: 'ceremonies',
    name: 'Ceremonies Team',
    description: 'This team is responsible for forming the spiritual backbone of the Patotsav, ensuring that all rituals, sacred setups, and main assembly timelines run with absolute reverence and precision.'
  },
  {
    id: 'cultural',
    name: 'Cultural Events Team',
    summary: 'Leadup, Spiritual, Community Service and Cultural Events',
    description: 'This team is responsible for bringing the 10th anniversary to life by curating an engaging, inclusive, and deeply spiritual 9-day program.'
  },
  {
    id: 'marketing',
    name: 'Marketing Team',
    description: 'This team is responsible for being the promotional engine of the Patotsav, tasked with driving massive outreach, community engagement, and digital presence.'
  },
  {
    id: 'souvenirs',
    name: 'Souvenirs Team',
    description: 'This team is responsible for designing, sourcing, and managing memorabilia that marks this historic 10-year milestone.'
  },
  {
    id: 'decoration',
    name: 'Decoration Team',
    description: 'This team is responsible for aesthetically transforming the entire Mandir grounds to match the grand scale of a 10th Patotsav.'
  },
  {
    id: 'kitchen',
    name: 'Kitchen Team',
    description: 'This will involve helping to sudhaar (cut) food, washing dishes, cleaning kitchen area, having prasad ready for all haribhaktas and much more.'
  },
  {
    id: 'serving',
    name: 'Serving Team',
    description: 'This team will arrange jamvanu seating, serving food to all haribhaktas, food disposal and creating a smooth jamvanu process for everyone.'
  },
  {
    id: 'transport',
    name: 'Transport and Parking Team',
    description: 'This team is responsible for ensuring the management of the logistical flow of vehicles and attendees arriving at the venue.'
  },
  {
    id: 'kidszone',
    name: 'KidsZone Team',
    description: 'This team is responsible for creating a fun, educational, and secure environment tailored to young children during the Patotsav.'
  },
  {
    id: 'facilities',
    name: 'DIY/Facilities Team',
    description: 'This team is responsible for the execution and infrastructure backbone of the festival, responsible for building, installing, and supporting the physical needs of every other team.'
  },
  {
    id: 'general',
    name: 'General Seva Team',
    description: 'This team is responsible for providing their help with seva as and when needed across the mahotsav.'
  }
]
