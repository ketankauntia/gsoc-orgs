import { expect, test } from "@playwright/test";

const seedPages = [
  "/",
  "/organizations",
  "/projects",
  "/yearly",
  "/tech-stack",
  "/topics",
  "/blog",
  "/about",
  "/contact",
] as const;

function isCheckableInternalLink(href: string, origin: string) {
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }

  const url = new URL(href, origin);
  return (
    url.origin === origin &&
    !url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/dashboard/")
  );
}

test("primary public surfaces contain no dead internal links", async ({
  page,
  request,
  baseURL,
}) => {
  test.setTimeout(180_000);
  const origin = new URL(baseURL!).origin;
  const discovered = new Map<string, Set<string>>();

  for (const seed of seedPages) {
    const response = await page.goto(seed);
    expect(response?.ok(), `Seed page ${seed} should load`).toBeTruthy();

    const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors
        .map((anchor) => anchor.getAttribute("href"))
        .filter((href): href is string => Boolean(href)),
    );

    for (const href of hrefs) {
      if (!isCheckableInternalLink(href, origin)) continue;

      const url = new URL(href, origin);
      url.hash = "";
      const normalized = url.toString();
      const sources = discovered.get(normalized) ?? new Set<string>();
      sources.add(seed);
      discovered.set(normalized, sources);
    }
  }

  const failures: string[] = [];
  for (const [url, sources] of discovered) {
    const response = await request.get(url, {
      failOnStatusCode: false,
      maxRedirects: 8,
      timeout: 15_000,
    });

    if (response.status() >= 400) {
      failures.push(
        `${response.status()} ${url} (linked from ${[...sources].join(", ")})`,
      );
    }
  }

  expect(failures, failures.join("\n")).toEqual([]);
});
