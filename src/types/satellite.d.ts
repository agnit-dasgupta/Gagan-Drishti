declare module 'satellite.js' {
  export interface SatRec {
    satnum: string;
    epochyr: number;
    epochdays: number;
    ndot: number;
    nddot: number;
    bstar: number;
    inclo: number;
    nodeo: number;
    ecco: number;
    argpo: number;
    mo: number;
    no_osh: number;
    [key: string]: any;
  }

  export interface EciVec3<T> {
    x: T;
    y: T;
    z: T;
  }

  export interface Geodetic {
    longitude: number;
    latitude: number;
    height: number;
  }

  export interface LookAngles {
    azimuth: number;
    elevation: number;
    rangeSat: number;
  }

  export function twoline2satrec(line1: string, line2: string): SatRec;
  export function propagate(satrec: SatRec, date: Date): { position: EciVec3<number> | boolean; velocity: EciVec3<number> | boolean };
  export function gstime(date: Date): number;
  export function eciToGeodetic(position: EciVec3<number>, gmst: number): Geodetic;
  export function eciToEcf(position: EciVec3<number>, gmst: number): EciVec3<number>;
  export function ecfToLookAngles(observer: Geodetic, positionEcf: EciVec3<number>): LookAngles;
  export function degreesLong(radians: number): number;
  export function degreesLat(radians: number): number;
  export function radiansToDegrees(radians: number): number;
  export function degreesToRadians(degreesGD: number): number;
}
