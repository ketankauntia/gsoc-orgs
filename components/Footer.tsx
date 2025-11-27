import Link from "next/link";
import { Section, Heading, Text } from "@/components/ui";

export const Footer = () => {
  const navigationItems = [
    {
      title: "Quick Links",
      description: "Discover GSoC opportunities",
      items: [
        {
          title: "Organizations",
          href: "/organizations",
        },
        {
          title: "Projects",
          href: "/projects",
        },
        {
          title: "Resources",
          href: "/resources",
        },
      ],
    },
    {
      title: "Resources",
      description: "Learn and prepare for GSoC",
      items: [
        {
          title: "Getting Started",
          href: "/getting-started",
        },
        {
          title: "Proposal Guide",
          href: "/proposal-guide",
        },
        {
          title: "Tips & Tricks",
          href: "/tips",
        },
        {
          title: "FAQs",
          href: "/faq",
        },
      ],
    },
    {
      title: "Community",
      description: "Connect with GSoC community",
      items: [
        {
          title: "About Us",
          href: "/about",
        },
        {
          title: "Blog",
          href: "/blog",
        },
        {
          title: "Success Stories",
          href: "/stories",
        },
        {
          title: "Contact Us",
          href: "/contact",
        },
      ],
    },
  ];

  return (
    <Section className="bg-foreground text-background">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="flex gap-8 flex-col items-start">
          <div className="flex gap-2 flex-col">
            <Heading>GSoC Guide</Heading>
            <Text className="max-w-lg text-background/75">
              Your comprehensive platform to discover, explore, and prepare for Google Summer of Code opportunities.
            </Text>
          </div>
          <div className="flex gap-20 flex-row">
            <div className="flex flex-col text-sm max-w-lg leading-relaxed tracking-tight text-background/75 text-left">
              <p>Built with ❤️ for the</p>
              <p>open source community</p>
              <p className="mt-2">© 2025 GSoC Guide</p>
            </div>
            <div className="flex flex-col text-sm max-w-lg leading-relaxed tracking-tight text-background/75 text-left">
              <Link href="/terms" className="hover:text-background transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-background transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-10 items-start">
          {navigationItems.map((item) => (
            <div
              key={item.title}
              className="flex text-base gap-1 flex-col items-start"
            >
              <div className="flex flex-col gap-2">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex justify-between items-center"
                  >
                    <span className="text-xl">{item.title}</span>
                  </Link>
                ) : (
                  <p className="text-xl">{item.title}</p>
                )}
                {item.items &&
                  item.items.map((subItem) => (
                    <Link
                      key={subItem.title}
                      href={subItem.href}
                      className="flex justify-between items-center"
                    >
                      <span className="text-background/75">
                        {subItem.title}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};