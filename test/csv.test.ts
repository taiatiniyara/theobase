import { describe, it, expect } from "vitest";
import { parseCsv, validateCsvHeaders } from "../worker/lib/csv";

describe("csv parser", () => {
  it("parses simple CSV", () => {
    const result = parseCsv("name,type,district\nCentral,organized,Central District");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(["name", "type", "district"]);
    expect(result[1]).toEqual(["Central", "organized", "Central District"]);
  });

  it("parses CSV with quoted fields", () => {
    const result = parseCsv('name,type,"district,name"\nCentral,"org,anized",Central');
    expect(result[0]![2]).toBe("district,name");
    expect(result[1]![1]).toBe("org,anized");
  });

  it("handles empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("handles trailing newlines", () => {
    const result = parseCsv("a,b\n1,2\n");
    expect(result).toHaveLength(2);
  });

  it("validates headers", () => {
    expect(validateCsvHeaders(["name", "type", "district"], ["name", "type"])).toBeNull();
    expect(validateCsvHeaders(["name"], ["name", "type"])).toBe("Missing required columns: type");
  });
});
