export enum GestureType {
  None = 'None',
  OpenPalm = 'Open Palm',
  ClosedFist = 'Closed Fist',
  OneFinger = 'One Finger',
}

export enum Theme {
  NightSky = 'Night Sky',
  Garden = 'Garden',
  Magic = 'Magic',
}

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  [key: string]: any; // Allow custom properties for specific effects
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}
