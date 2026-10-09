import { ContactView } from "@/components/cobalt/views/community";
import { ContactForm } from "@/components/cobalt/views/community-client";

export default function ContactPage() {
  return <ContactView form={<ContactForm />} />;
}
