import { expect, test } from "@playwright/test";

const publicRoutes = [
  {
    path: "/",
    heading: /Find the open-source community worth knowing deeply/i,
  },
  { path: "/organizations", heading: /Find an organization worth researching/i },
  { path: "/projects", heading: /project/i },
  { path: "/yearly", heading: /year/i },
  { path: "/tech-stack", heading: /technolog/i },
  { path: "/topics", heading: /topic/i },
  { path: "/blog", heading: /guide|blog|GSoC/i },
] as const;

test.describe("public Atlas journeys", () => {
  for (const route of publicRoutes) {
    test(`${route.path} renders its primary content`, async ({ page }) => {
      const response = await page.goto(route.path);

      expect(response?.ok(), `${route.path} should return a successful response`).toBeTruthy();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(route.heading);
      await expect(page.locator("body")).not.toContainText(/application error/i);
    });
  }

  test("homepage primary action opens the organization explorer", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Explore organizations" })
      .first()
      .click();

    await expect(page).toHaveURL(/\/organizations$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Find an organization worth researching/i,
      }),
    ).toBeVisible();
  });

  test("a real archived project replaces the old mock application page", async ({ page }) => {
    const response = await page.goto(
      "/organizations/unikraft/projects/Q1hFzB7p",
    );

    expect(response?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Update Newlib and Pthread-embedded Libraries",
      }),
    ).toBeVisible();
    await expect(page.getByText("Archive record", { exact: true })).toBeVisible();
    await expect(page.getByText(/completed-project archive/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /apply/i })).toHaveCount(0);
  });

  test("mobile navigation opens, receives focus, and closes with Escape", async ({
    page,
  }) => {
    test.skip(
      page.viewportSize()!.width >= 1024,
      "The mobile menu is only present below the desktop breakpoint.",
    );

    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "Organizations" }).last()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });

  test("the public pages do not introduce horizontal overflow", async ({ page }) => {
    for (const path of ["/", "/organizations", "/projects", "/blog"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} has ${overflow}px of horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });
});
