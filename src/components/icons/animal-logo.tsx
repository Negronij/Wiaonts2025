
import { SVGProps } from 'react';

// Simplified animal SVGs. Using `currentColor` to allow color styling.
const Bear = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 13V9a4 4 0 0 0-4-4H9.5A3.5 3.5 0 0 0 6 8.5V10" />
    <path d="M12 13h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2" />
    <path d="M9 13v-1" /><path d="M15 13v-1" /><circle cx="9.5" cy="8.5" r=".5" fill="currentColor" />
    <circle cx="14.5" cy="8.5" r=".5" fill="currentColor" />
  </svg>
);
const Cat = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" />
    <path d="M15.5 8.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0z" /><path d="M8.5 8.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0z" />
    <path d="M12 16c-2 0-3-1-3-1s1-1 3-1 3 1 3 1-1 1-3 1z" />
    <path d="M6 4s-2 2-2 4" /><path d="M18 4s2 2 2 4" />
  </svg>
);
const Dog = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 5H6a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h4" />
    <path d="M14 5h4a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-4" />
    <path d="M12 16v-4" /><path d="M12 8c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" />
    <path d="M12 8c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2 2z" />
  </svg>
);
const Dolphin = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 12c-4 0-8 2-8 6s4 6 8 6 8-2 8-6-4-6-8-6z" />
    <path d="M17.5 7.5c0-3.3-2.7-6-6-6s-6 2.7-6 6c0 1.5.5 2.8 1.4 3.8" />
    <path d="M12 22V12" />
  </svg>
);
const Eagle = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 21h18" /><path d="M9.5 10.5c-2.8 1.4-5 4.3-5 7.5h15c0-3.2-2.2-6.1-5-7.5" />
    <path d="M12 2c-3 0-5.5 2-5.5 5.5S9 13 12 13s5.5-2 5.5-5.5S15 2 12 2z" />
    <path d="M9.5 8C8.1 8 7 6.9 7 5.5S8.1 3 9.5 3c.4 0 .8.1 1.1.3" />
  </svg>
);
const Elephant = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 10h12v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9z" />
    <path d="M12 10V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
    <path d="M12 10V4a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2" />
    <path d="M3 13c0-3 3-4 3-4" /><path d="M21 13c0-3-3-4-3-4" />
    <path d="M12 15a3 3 0 0 0-3 3" />
  </svg>
);
const Fox = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6.2c0-1.8 1.4-3.2 3.2-3.2h11.6c1.8 0 3.2 1.4 3.2 3.2" />
    <path d="M12 16L6 21v-5h12v5l-6-5z" /><path d="M10 6.2s-1.4 1.8-1.4 3.3c0 1.5 1.4 2.5 1.4 2.5" />
    <path d="M14 6.2s1.4 1.8 1.4 3.3c0 1.5-1.4 2.5-1.4 2.5" />
  </svg>
);
const Lion = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.5 14.5c2.4-1.2 4.6-1.2 7 0" />
    <path d="M14 19c-2.8 0-5-2.2-5-5s2.2-5 5-5" />
    <path d="M22 12c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8" />
    <path d="M3 10c0-1 .5-2 1-2.5" /><path d="M4 5c1.5-1.5 3.5-2.5 5.5-2.5" />
    <path d="M14.5 2c1.5 0 3 .5 4.5 1.5" /><path d="M20 5.5c.5.5 1 1.5 1 2.5" />
  </svg>
);
const Panda = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15.5 15.5c-2.3 2.3-6.7 2.3-9 0" />
    <ellipse cx="15.5" cy="9.5" rx="2.5" ry="3.5" fill="currentColor"/>
    <ellipse cx="8.5" cy="9.5" rx="2.5" ry="3.5" fill="currentColor"/>
  </svg>
);
const Rabbit = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 12a5 5 0 0 1-5-5h10a5 5 0 0 1-5 5z" />
    <path d="M12 12v9" /><path d="M9 21h6" /><path d="M7 7V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
    <path d="M17 7V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2" />
  </svg>
);
const Snake = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7.5 16.5c2.3-1.3 4.7-1.3 7 0" />
    <path d="M4.5 12.5c2.3-1.3 4.7-1.3 7 0" />
    <path d="M7.5 8.5c2.3-1.3 4.7-1.3 7 0" />
    <path d="M4 19a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" />
    <path d="M4 5a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" />
  </svg>
);
const Tiger = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 8.5C4 7 5 6 6.5 6h11C19 6 20 7 20 8.5" />
    <path d="M4 15.5C4 17 5 18 6.5 18h11c1.5 0 2.5-1 2.5-2.5" />
    <path d="M7 12h10" /><path d="M7 9v6" /><path d="M17 9v6" />
    <path d="M12 6V4" /><path d="M12 20v-2" />
  </svg>
);
const Wolf = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 4l8 8-8 8-8-8z"/>
        <path d="M12 14a2 2 0 100-4 2 2 0 000 4z"/>
        <path d="M4 12H2"/><path d="M22 12h-2"/>
        <path d="M12 4V2"/><path d="M12 22v-2"/>
    </svg>
);
const Horse = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3.5 10.5c1.5-3 4-5.5 7.5-5.5s6 2.5 7.5 5.5" />
        <path d="M11 14v6" /><path d="M8 14v6" /><path d="M16 14v6" />
        <path d="M5 10s-1.5 1-1.5 3.5v.5h17v-.5c0-2.5-1.5-3.5-1.5-3.5" />
        <path d="M6 5.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5" />
    </svg>
);
const Monkey = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 15c-4.4 0-8-2.7-8-6s3.6-6 8-6 8 2.7 8 6-3.6 6-8 6z" />
        <path d="M12 15v6" />
        <path d="M8 19h8" />
        <path d="M15.5 8.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0z" />
        <path d="M8.5 8.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0z" />
        <path d="M14.5 3.5c0-1.4-1.1-2.5-2.5-2.5S9.5 2.1 9.5 3.5" />
    </svg>
);
const Owl = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
        <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M16 16c-2.2 0-4-1.8-4-4s1.8-4 4-4" />
        <path d="M8 16c2.2 0 4-1.8 4-4s-1.8-4-4-4" />
        <path d="M12 19c-1.7 0-3-1.3-3-3" />
    </svg>
);
const Turtle = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
        <path d="M6 7l-3 3" /><path d="M18 7l3 3" />
        <path d="M6 17l-3-3" /><path d="M18 17l3-3" />
        <path d="M9 12h6" />
    </svg>
);
const Whale = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2.5 13.5c0-4.5 4-8.5 9.5-8.5s9.5 4 9.5 8.5-4 8.5-9.5 8.5-9.5-4-9.5-8.5z" />
        <path d="M12 2c0-1.1.9-2 2-2s2 .9 2 2" />
        <path d="M21.5 13.5H23" /><path d="M1 13.5H2.5" />
    </svg>
);


export const animals = [
  'Oso', 'Gato', 'Perro', 'Delfín', 'Águila', 'Elefante', 
  'Zorro', 'León', 'Panda', 'Conejo', 'Serpiente', 'Tigre', 'Lobo',
  'Caballo', 'Mono', 'Búho', 'Tortuga', 'Ballena'
] as const;

export type Animal = typeof animals[number];

const animalComponents: Record<Animal, React.FC<SVGProps<SVGSVGElement>>> = {
  'Oso': Bear, 
  'Gato': Cat, 
  'Perro': Dog, 
  'Delfín': Dolphin, 
  'Águila': Eagle, 
  'Elefante': Elephant, 
  'Zorro': Fox, 
  'León': Lion, 
  'Panda': Panda, 
  'Conejo': Rabbit, 
  'Serpiente': Snake, 
  'Tigre': Tiger, 
  'Lobo': Wolf,
  'Caballo': Horse,
  'Mono': Monkey,
  'Búho': Owl,
  'Tortuga': Turtle,
  'Ballena': Whale,
};

export const AnimalLogo = ({ animal, ...props }: { animal: Animal } & SVGProps<SVGSVGElement>) => {
  const AnimalComponent = animalComponents[animal];
  if (!AnimalComponent) return null; // Or return a default icon
  return <AnimalComponent {...props} />;
};
