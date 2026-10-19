// Single place for clinic details and photos. Swap the image URLs for your own files
// (e.g. put them in /public/images and use '/images/hero.jpg').
export const CLINIC = {
  name: 'Bright Smile Dental',
  phone: '(212) 555-0199',
  email: 'hello@brightsmiledental.demo',
  address: ['123 Demo Avenue', 'Midtown Manhattan, NY 10001'],
  hours: [
    ['Monday – Thursday', '9:00 AM – 6:00 PM'],
    ['Saturday', '10:00 AM – 2:00 PM'],
  ],
};

const U = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}`;

export const IMAGES = {
  hero: U('photo-1598257006475-d4561f5bb808', 1000),
  aboutHero: U('photo-1629909613654-28e377c37b09', 1200),
  story: U('photo-1588776814546-1ffcf47267a5'),
  whyUs: U('photo-1559839734-2b71ea197ec2'),
  contactHero: U('photo-1594824813572-c2e0b5711204', 1000),
  cleaning: U('photo-1606811841689-23dfddce3e95', 500),
  whitening: U('photo-1609840114035-3c981b782dfe', 500),
  fillings: U('photo-1588776814546-1ffcf47267a5', 500),
  crowns: U('photo-1629909613654-28e377c37b09', 500),
};