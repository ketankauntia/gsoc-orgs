import Link from 'next/link'
import { Header } from '@/components/header'
import { FooterSmall } from '@/components/footer-small'
import { Button, Container, Heading, Text } from '@/components/ui'

export default function NotFound() {
  return (
    <div data-not-found className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center pt-20 lg:pt-24">
        <Container size="small" className="py-16 text-center">
          <Text className="mb-3 font-mono text-sm font-semibold text-primary">404</Text>
          <Heading as="h1" variant="section">Page not found</Heading>
          <Text className="mx-auto mt-4 max-w-xl text-muted-foreground">
            The page may have moved, or the organization, project, technology, or topic may no longer use this URL.
          </Text>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">Return home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/organizations">Browse organizations</Link>
            </Button>
          </div>
        </Container>
      </main>
      <FooterSmall />
    </div>
  )
}
