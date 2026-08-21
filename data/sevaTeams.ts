import type { SevaTeamContent } from '~/types'

export const DEFAULT_SEVA_HEADING = 'Bhaktiras Volunteer Teams'
export const DEFAULT_SEVA_INTRO = 'Once you’re in WhatsApp, pick a team that fits. Ask the seva desk if you’re unsure.'

export const DEFAULT_SEVA_TEAMS: SevaTeamContent[] = [
  {
    id: 'ceremonies',
    name: 'Ceremonies Team',
    summary: 'Rituals, sacred setups and main assembly',
    description: 'This team is responsible for forming the spiritual backbone of the Patotsav, ensuring that all rituals, sacred setups, and main assembly timelines run with absolute reverence and precision.',
    order: 1,
    active: true
  },
  {
    id: 'cultural',
    name: 'Cultural Events Team',
    summary: 'Lead up, Spiritual, Community Service and Cultural Events',
    description: 'This team is responsible for bringing the 10th anniversary to life by curating an engaging, inclusive, and deeply spiritual 9-day program.',
    order: 2,
    active: true
  },
  {
    id: 'marketing',
    name: 'Marketing Team',
    summary: 'Outreach, community engagement and digital presence',
    description: 'This team is responsible for being the promotional engine of the Patotsav, tasked with driving massive outreach, community engagement, and digital presence.',
    order: 3,
    active: true
  },
  {
    id: 'souvenirs',
    name: 'Souvenirs Team',
    summary: 'Design, sourcing and 10-year memorabilia',
    description: 'This team is responsible for designing, sourcing, and managing memorabilia that marks this historic 10-year milestone.',
    order: 4,
    active: true
  },
  {
    id: 'decoration',
    name: 'Decoration Team',
    summary: 'Mandir grounds and festival décor',
    description: 'This team is responsible for aesthetically transforming the entire Mandir grounds to match the grand scale of a 10th Patotsav.',
    order: 5,
    active: true
  },
  {
    id: 'kitchen',
    name: 'Kitchen Team',
    summary: 'Sudhaar, dishes, kitchen and prasad',
    description: 'This will involve helping to sudhaar (cut) food, washing dishes, cleaning kitchen area, having prasad ready for all haribhaktas and much more.',
    order: 6,
    active: true
  },
  {
    id: 'serving',
    name: 'Serving Team',
    summary: 'Jamvanu seating, serving and food disposal',
    description: 'This team will arrange jamvanu seating, serving food to all haribhaktas, food disposal and creating a smooth jamvanu process for everyone.',
    order: 7,
    active: true
  },
  {
    id: 'transport',
    name: 'Transport and Parking Team',
    summary: 'Vehicles, parking and attendee flow',
    description: 'This team is responsible for ensuring the management of the logistical flow of vehicles and attendees arriving at the venue.',
    order: 8,
    active: true
  },
  {
    id: 'kidszone',
    name: 'KidsZone Team',
    summary: 'Fun, educational and secure children’s space',
    description: 'This team is responsible for creating a fun, educational, and secure environment tailored to young children during the Patotsav.',
    order: 9,
    active: true
  },
  {
    id: 'facilities',
    name: 'DIY/Facilities Team',
    summary: 'Building, installing and festival infrastructure',
    description: 'This team is responsible for the execution and infrastructure backbone of the festival, responsible for building, installing, and supporting the physical needs of every other team.',
    order: 10,
    active: true
  },
  {
    id: 'general',
    name: 'General Seva Team',
    summary: 'Flexible help across the mahotsav',
    description: 'This team is responsible for providing their help with seva as and when needed across the mahotsav.',
    order: 11,
    active: true
  }
]
