/**
 * Test/fixture kaynaklarından gelen verinin herkese açık sayfalarda gösterilip gösterilmeyeceği.
 * Üretimde varsayılan: GÖSTERİLMEZ. Geliştirmede varsayılan: gösterilir (her zaman "Test verisi"
 * etiketiyle). SHOW_TEST_DATA=true|false ile açıkça belirlenebilir.
 */
export function includeTestData(): boolean {
  const v = process.env.SHOW_TEST_DATA;
  if (v === "true") return true;
  if (v === "false") return false;
  return process.env.NODE_ENV !== "production";
}
