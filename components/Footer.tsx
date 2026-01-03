import Link from "next/link";
import { Section, Heading, Text } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";
import { FOOTER_NAVIGATION_ITEMS, FOOTER_COPYRIGHT } from "@/components/footer-common";

export const Footer = () => {

  return (
    <Section className="bg-foreground text-background">
      <div className="grid lg:grid-cols-2 gap-18 items-center">
        <div className="flex gap-8 flex-col items-start">
          <div className="flex gap-2 flex-col">
            <Heading>GSoC Organizations Guide</Heading>
            <Text className="max-w-lg text-background/75">
              Your comprehensive platform to discover, explore, and prepare for Google Summer of Code opportunities.
            </Text>
          </div>
          <div className="flex gap-20 flex-row">
            <div className="flex flex-col text-sm max-w-lg leading-relaxed tracking-tight text-background/75 text-left">
              <p>{FOOTER_COPYRIGHT.text}.</p>
              <p className="mt-1">© {FOOTER_COPYRIGHT.year} <Link href={FOOTER_COPYRIGHT.organizationUrl} className="hover:underline">{FOOTER_COPYRIGHT.organization}</Link></p>
            </div>
          </div>
          {/* Social Links */}
          <SocialLinks
            showLabels={false}
            className="flex items-center gap-4 text-black"
            textColor="white"
          />
        </div>
        <div className="grid lg:grid-cols-3 gap-10 items-start">
          {FOOTER_NAVIGATION_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex text-base gap-1 flex-col items-start"
            >
              <div className="flex flex-col gap-2">
                <p className="text-xl">{item.title}</p>
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