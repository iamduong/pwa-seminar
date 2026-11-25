// ! Feature
// useEffect(() => {
//   if (!poiMarkers) return;

//   let count = 0;

//   let result: { from: PublicPoi | null, to: PublicPoi | null, distance: number | null} = {
//     from: null,
//     to: null,
//     distance: null
//   }

//   let max = 6_123_123;

//   for (let i = 0; i < poiMarkers.length; i++) {
//     const from = point([
//       poiMarkers[i].location.coordinates[0],
//       poiMarkers[i].location.coordinates[1],
//     ]);
//     for (let j = i + 1; j < poiMarkers.length; j++) {
//       const to = point([
//         poiMarkers[j].location.coordinates[0],
//         poiMarkers[j].location.coordinates[1],
//       ]);

//       console.log(distance(from, to, { units: "meters" }))

//       var compare = Math.min(max, distance(from, to, { units: "meters" }));
//       if (compare != max) {
//         result = {
//           from: poiMarkers[i],
//           to: poiMarkers[j],
//           distance: compare
//         }

//         max = compare
//       }

//       count ++;
//     }
//   }

//   console.log(count )
//   console.log(result)
// }, [poiMarkers]);

// ! Feature
//     const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);

//   useEffect(() => {
//     if (!selectedLocation || !selectedLocation.location) return;

//     var count = 0;

//     for (let i = 0; i < poiMarkers.length; i++) {
//       const from = point([poiMarkers[i].location.coordinates[0], poiMarkers[i].location.coordinates[1]]);
//       const to = point(selectedLocation.location);

//       if (distance(from, to, { units: "meters" }) < 1000) {
//         count ++;
//       }
//     }

//     console.log(count)

//   }, [selectedLocation]);
