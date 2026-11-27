import { describe, expect, it } from "vitest";
import { translations } from "@/lib/translations";
import { translate, type CopyKey } from "@/lib/copy";

function collectLeafPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...collectLeafPaths(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

function collectLeafStrings(obj: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      values.push(...collectLeafStrings(value as Record<string, unknown>));
    } else if (typeof value === "string") {
      values.push(value);
    }
  }
  return values;
}

describe("translations parity and copy hygiene", () => {
  it("keeps 100% key parity between pt and en translations", () => {
    const ptKeys = collectLeafPaths(translations.pt);
    const enKeys = collectLeafPaths(translations.en);
    expect(ptKeys).toEqual(enKeys);
  });

  it("contains no em-dashes in pt or en translations", () => {
    for (const value of [
      ...collectLeafStrings(translations.pt),
      ...collectLeafStrings(translations.en),
    ]) {
      expect(value).not.toContain("—");
    }
  });

  it("keeps shell copy bilingual without em-dashes", () => {
    const sampleKeys: CopyKey[] = [
      "footerCredit",
      "visitorBannerText",
      "quickJump",
      "commandPlaceholder",
      "openMenu",
    ];
    for (const key of sampleKeys) {
      const ptValue = translate("pt", key);
      const enValue = translate("en", key);
      expect(ptValue.length).toBeGreaterThan(0);
      expect(enValue.length).toBeGreaterThan(0);
      expect(ptValue).not.toContain("—");
      expect(enValue).not.toContain("—");
    }
  });
});
