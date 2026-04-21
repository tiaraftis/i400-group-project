import fs from 'fs';

const data = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));
const def = data.components?.schemas || data.definitions;

if (def && def.class_enrollments) {
  console.log("class_enrollments schema:", def.class_enrollments.properties);
} else {
  console.log("Could not find class_enrollments in definitions. Keys:", def ? Object.keys(def) : "No defs object", "\nRoot keys:", Object.keys(data));
}

if (def && def.community_classes) console.log("community_classes exists:", def.community_classes.properties !== undefined);
if (def && def.skating_classes) console.log("skating_classes exists:", def.skating_classes.properties !== undefined);

