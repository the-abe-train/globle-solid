import * as geometry from "spherical-geometry-js";

function pointToCoordinates(point: Array<number>) {
  // In the data, coordinates are [E/W (lng), N/S (lat)]
  // In the function, coordinates are [N/S (lat), E/W (lng)]
  // For both, West and South are negative
  const [lng, lat] = point;
  const coord = new geometry.LatLng(lat, lng);
  return coord;
}

function samplePoints(points: number[][]) {
  // If the polygon is too big, reduce the number of points used in calculation
  if (points.length > 500) {
    return points.filter((_, idx) => {
      return idx % 2 === 0;
    });
  }
  return points;
}

function polygonPoints(country: Country) {
  const { geometry } = country;
  switch (geometry.type) {
    case "Polygon":
      return samplePoints(geometry.coordinates[0]);
    case "MultiPolygon":
      let points: number[][] = [];
      for (const polygon of geometry.coordinates) {
        points = [...points, ...polygon[0]];
      }
      return samplePoints(points);
    default:
      throw new Error("Country data error");
  }
}

function calcProximity(points1: number[][], points2: number[][]) {
  // Find min distance between 2 sets of points
  const EARTH_CIRCUMFERENCE = 40_075_000;
  let distance = EARTH_CIRCUMFERENCE / 2;
  for (let i = 0; i < points1.length; i++) {
    const point1 = points1[i];
    const coord1 = pointToCoordinates(point1);
    for (let j = 0; j < points2.length; j++) {
      const point2 = points2[j];
      const coord2 = pointToCoordinates(point2);
      const pointDistance = geometry.computeDistanceBetween(coord1, coord2);
      distance = Math.min(distance, pointDistance);
    }
  }
  // console.log("Country 1 points:", points1.length);
  // console.log("Country 2 points:", points2.length);
  // console.log("Total paths measured:", points1.length * points2.length);
  // console.log("Proximity is:", distance);
  return distance;
}

export function polygonDistance(country1: Country, country2: Country) {
  const name1 = country1.properties.NAME;
  const name2 = country2.properties.NAME;

  const adjacentCountries: [string, string, number][] = [
    ["South Africa", "Lesotho", 0],
    ["Jordan", "Israel", 0],
    ["Lebanon", "Israel", 0],
    ["Egypt", "Israel", 0],
    ["Italy", "Vatican", 0],
    ["Italy", "Vatican City", 0],
    ["Italy", "San Marino", 0],
    ["Italy", "Monaco", 10_000],
    // ["Italy", "France", 10_000],
  ];

  for (const [m1, m2, distance] of adjacentCountries) {
    if ((name1 === m1 && name2 === m2) || (name1 === m2 && name2 === m1)) {
      return distance;
    }
  }

  const points1 = polygonPoints(country1);
  const points2 = polygonPoints(country2);
  return calcProximity(points1, points2);
}

// function testDistance(country1: string, country2: string) {
//   // find country objects by their names
//   const c1 = getCountry(country1);
//   const c2 = getCountry(country2);
//   if (!c1 || !c2) {
//     throw new Error("Country not found");
//   }
//   const distance = polygonDistance(c1, c2);
//   console.log(`Distance between ${country1} and ${country2} is ${distance}`);
// }

export function altitudeFunction(area: number) {
  // This function may seem arbitrary but I made it with a spreadsheet
  // and it made sense there.
  if (area >= 10) {
    return 1.5;
  }
  return 1 / (-2.55 * area + 26);
}

export function findCentre(country: Country) {
  const { bbox } = country;
  const [lng1, lat1, lng2, lat2] = bbox;
  const latitude = (lat1 + lat2) / 2;
  const longitude = (lng1 + lng2) / 2;
  const path = [
    new geometry.LatLng(lat1, lng1),
    new geometry.LatLng(lat1, lng2),
    new geometry.LatLng(lat2, lng2),
    new geometry.LatLng(lat2, lng1),
  ];
  const area = geometry.computeArea(path);
  const areaOoM = Math.log10(area);
  const altitude = altitudeFunction(areaOoM);
  return { lat: latitude, lng: longitude, altitude };
}
