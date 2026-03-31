import Link from "next/link";
import { SocialLinks } from "@/components/social-links";
import { FOOTER_NAVIGATION_ITEMS, FOOTER_COPYRIGHT } from "@/components/footer-common";
import { Heading, Text } from "@/components/ui";

export const Footer = () => {
  return (
    <footer className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Mission Section */}
          <div className="flex flex-col items-start gap-6 lg:col-span-4">
            <div className="space-y-4">
              <Heading as="h3" className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                GSoC Organizations Guide
              </Heading>
              <Text className="text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
                Your comprehensive platform to discover, explore, and prepare for Google Summer of Code opportunities. Maximize your selection chances with data-driven insights.
              </Text>
            </div>
            
            <SocialLinks
              showLabels={false}
              className="flex items-center gap-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            />
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-8 lg:justify-items-end w-full">
            {FOOTER_NAVIGATION_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-start lg:items-end text-left lg:text-right w-full"
              >
                <div className="flex flex-col gap-4">
                  <h4 className="text-zinc-900 dark:text-zinc-100 font-semibold">
                    {item.title}
                  </h4>
                  <ul className="flex flex-col gap-3">
                    {item.items &&
                      item.items.map((subItem) => (
                        <li key={subItem.title}>
                          <Link
                            href={subItem.href}
                            className="text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            © {FOOTER_COPYRIGHT.year} <Link href={FOOTER_COPYRIGHT.organizationUrl} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">{FOOTER_COPYRIGHT.organization}</Link>. All rights reserved.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium text-center md:text-right">
            {FOOTER_COPYRIGHT.text}
          </p>
        </div>
      </div>
    </footer>
  );
};