import { afterEach, describe, expect, it } from "vitest";
import { appBaseUrlForHost, authHubUrlForHost, portfolioContactUrl } from "@/lib/auth-public";

describe("auth urls", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_AUTH_URL;
    delete process.env.VERCEL_ENV;
  });

  it("keeps the local app on this port and the hub on the public auth host", () => {
    expect(appBaseUrlForHost("localhost")).toBe("http://localhost:3300");
    expect(authHubUrlForHost("localhost")).toBe("https://auth.daviandrade.dev");
    expect(appBaseUrlForHost("riteflow.daviandrade.dev")).toBe(
      "https://riteflow.daviandrade.dev",
    );
  });

  it("ignores a localhost hub url when the request host is public", () => {
    process.env.NEXT_PUBLIC_AUTH_URL = "http://localhost:3100";
    expect(authHubUrlForHost("riteflow.daviandrade.dev")).toBe(
      "https://auth.daviandrade.dev",
    );
    expect(authHubUrlForHost("localhost")).toBe("http://localhost:3100");
  });

  it("builds the public portfolio contact url with the selected language", () => {
    expect(portfolioContactUrl("pt")).toBe("https://daviandrade.dev/contact?lang=pt");
    expect(portfolioContactUrl("en")).toBe("https://daviandrade.dev/contact?lang=en");
  });
});
