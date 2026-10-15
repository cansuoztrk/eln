// Applies Bookcat's native settings after `npx cap add android|ios`.
// Idempotent: safe to run again. node scripts/native-config.cjs
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);
const exists = (p) => fs.existsSync(path.join(root, p));
const VERSION = require('../package.json').version;
const BUILD = 1;

// ───────────── Android ─────────────
if (exists('android')) {
  const mf = 'android/app/src/main/AndroidManifest.xml';
  let m = read(mf);
  if (!m.includes('xmlns:tools')) m = m.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android">', '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools">');
  if (!m.includes('android:screenOrientation')) m = m.replace('android:launchMode="singleTask"', 'android:launchMode="singleTask"\n            android:screenOrientation="portrait"');
  if (!m.includes('com.google.android.gms.ads.APPLICATION_ID'))
    m = m.replace(
      '        <provider',
      `        <!-- TEST AdMob app id. Replace with your AdMob Android App ID before release. -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3940256099942544~3347511713"
        />

        <provider`,
    );
  if (!m.includes('POST_NOTIFICATIONS'))
    m = m.replace(
      '    <uses-permission android:name="android.permission.INTERNET" />',
      `    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="com.google.android.gms.permission.AD_ID" />
    <!-- Reminders are scheduled as inexact alarms, so the exact-alarm permission the
         notifications plugin declares is not needed (and avoids a Play policy review). -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove" />`,
    );
  write(mf, m);

  const gradle = 'android/app/build.gradle';
  write(gradle, read(gradle).replace(/versionCode \d+/, `versionCode ${BUILD}`).replace(/versionName "[^"]*"/, `versionName "${VERSION}"`));

  // Store name per language: "Kitap Kedisi" in Turkish, "Bookcat" elsewhere.
  const trDir = 'android/app/src/main/res/values-tr';
  fs.mkdirSync(path.join(root, trDir), { recursive: true });
  write(`${trDir}/strings.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Kitap Kedisi</string>
    <string name="title_activity_main">Kitap Kedisi</string>
</resources>
`);

  // Monochrome notification icon (an open book) — Android tints it with iconColor.
  const icon = 'android/app/src/main/res/drawable/ic_stat_bookcat.xml';
  write(
    icon,
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:pathData="M2,5.5C4.8,4.2 8.2,4.2 11,6v13c-2.8,-1.6 -6.2,-1.6 -9,-0.3zM22,5.5C19.2,4.2 15.8,4.2 13,6v13c2.8,-1.6 6.2,-1.6 9,-0.3z"/>
</vector>
`,
  );
}

// ───────────── iOS ─────────────
if (exists('ios')) {
  const pl = 'ios/App/App/Info.plist';
  let p = read(pl);
  p = p.replace(/<key>UIRequiredDeviceCapabilities<\/key>\s*<array>\s*<string>armv7<\/string>\s*<\/array>/, '<key>UIRequiredDeviceCapabilities</key>\n\t<array>\n\t\t<string>arm64</string>\n\t</array>');
  p = p.replace(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/, '<key>UISupportedInterfaceOrientations</key>\n\t<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>');
  p = p.replace(/<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/, '<key>UISupportedInterfaceOrientations~ipad</key>\n\t<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t\t<string>UIInterfaceOrientationPortraitUpsideDown</string>\n\t</array>');
  if (!p.includes('GADApplicationIdentifier')) {
    const skad = fs.readFileSync(path.join(__dirname, 'skadnetwork.plist.txt'), 'utf8').trim();
    p = p.replace(
      '\t<key>UIViewControllerBasedStatusBarAppearance</key>',
      `\t<key>UIRequiresFullScreen</key>
\t<true/>
\t<key>ITSAppUsesNonExemptEncryption</key>
\t<false/>
\t<key>CFBundleLocalizations</key>
\t<array>
\t\t<string>en</string>
\t\t<string>tr</string>
\t\t<string>de</string>
\t\t<string>es</string>
\t\t<string>fr</string>
\t\t<string>pt</string>
\t</array>
\t<key>NSUserTrackingUsageDescription</key>
\t<string>Your data will be used to show you more relevant ads and keep Bookcat free to play.</string>
\t<key>GADApplicationIdentifier</key>
\t<!-- TEST app id. Replace with your AdMob iOS App ID before release. -->
\t<string>ca-app-pub-3940256099942544~1458002511</string>
\t${skad}
\t<key>UIViewControllerBasedStatusBarAppearance</key>`,
    );
  }
  write(pl, p);

  const strings = {
    en: ['Your data will be used to show you more relevant ads and keep Bookcat free to play.', 'Bookcat'],
    tr: ['Verilerin sana daha ilgili reklamlar göstermek ve Kitap Kedisi’ni ücretsiz tutmak için kullanılacak.', 'Kitap Kedisi'],
    de: ['Deine Daten werden genutzt, um dir passendere Werbung zu zeigen und Bookcat kostenlos zu halten.', 'Bookcat'],
    es: ['Tus datos se usarán para mostrarte anuncios más relevantes y mantener Bookcat gratis.', 'Bookcat'],
  };
  for (const [l, [att, name]] of Object.entries(strings)) {
    const dir = path.join(root, `ios/App/App/${l}.lproj`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'InfoPlist.strings'), `"NSUserTrackingUsageDescription" = "${att}";\n"CFBundleDisplayName" = "${name}";\n`);
  }

  const pbx = 'ios/App/App.xcodeproj/project.pbxproj';
  write(pbx, read(pbx).replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${VERSION};`).replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${BUILD};`));
}
console.log('native config applied');
