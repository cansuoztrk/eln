// Registers InfoPlist.strings localizations (ATT prompt text, display name) in
// the Xcode project. Run after `npx cap add ios`: node scripts/ios-localize.cjs
const fs = require('fs');
const path = require('path');
const xcode = require('xcode');
const PbxFile = require('xcode/lib/pbxFile');

const projPath = path.join(__dirname, '../ios/App/App.xcodeproj/project.pbxproj');
const proj = xcode.project(projPath);
proj.parseSync();
const langs = ['en', 'tr', 'de', 'es'];

if (!proj.findPBXVariantGroupKey({ name: 'InfoPlist.strings' })) {
  const groupKey = proj.pbxCreateVariantGroup('InfoPlist.strings');
  proj.addToPbxGroup(groupKey, proj.findPBXGroupKey({ path: 'App' }));
  const buildFile = { uuid: proj.generateUuid(), fileRef: groupKey, basename: 'InfoPlist.strings' };
  proj.addToPbxBuildFileSection(buildFile);
  proj.addToPbxResourcesBuildPhase(buildFile);
  for (const l of langs) {
    const file = new PbxFile(`${l}.lproj/InfoPlist.strings`, {});
    file.fileRef = proj.generateUuid();
    file.basename = l;
    proj.addToPbxFileReferenceSection(file);
    proj.addToPbxVariantGroup(file, groupKey);
    proj.addKnownRegion(l);
  }
}
fs.writeFileSync(projPath, proj.writeSync().replace(/ explicitFileType = undefined;/g, '').replace(/in undefined \*\//g, 'in Resources */'));
console.log('localizations registered');
