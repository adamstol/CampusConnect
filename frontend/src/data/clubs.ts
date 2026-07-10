export interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  location: string;
}

export const clubs: Club[] = [
  {
    id: 1,
    name: 'CS Hub',
    description: 'A community for computer science students to collaborate, learn new technologies, and build projects together.',
    category: 'Technology',
    location: 'Lassonde Building',
  },
  {
    id: 2,
    name: 'York Debate Society',
    description: 'Sharpen your public speaking and critical thinking skills through weekly debates and tournaments.',
    category: 'Academic',
    location: 'Vari Hall',
  },
  {
    id: 3,
    name: 'YU Basketball Club',
    description: 'Casual and competitive basketball games, open to players of all skill levels every week.',
    category: 'Sports',
    location: 'Athletics Centre',
  },
  {
    id: 4,
    name: 'Cultural Fusion',
    description: 'Celebrating diversity on campus through cultural showcases, food events, and international nights.',
    category: 'Cultural',
    location: 'Student Centre',
  },
  {
    id: 5,
    name: 'Business Network Club',
    description: 'Connect with peers and industry professionals through networking events and case competitions.',
    category: 'Business',
    location: 'Schulich School of Business',
  },
  {
    id: 6,
    name: 'York Filmmakers Guild',
    description: 'Write, shoot, and edit short films together, with screenings held at the end of each semester.',
    category: 'Arts',
    location: 'Accolade Building',
  },
  {
    id: 7,
    name: 'Game Dev Collective',
    description: 'Design and build games in game jams, workshops, and collaborative projects with fellow students.',
    category: 'Technology',
    location: 'Bergeron Centre',
  },
  {
    id: 8,
    name: 'Campus Volunteers Network',
    description: 'Organize and take part in community service projects both on campus and around Toronto.',
    category: 'Volunteering',
    location: 'Student Centre',
  },
];
