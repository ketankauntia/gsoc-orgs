import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

async function main() {
  const now = new Date()

  // Idempotent seed for one example organization
  const organization = await prisma.organizations.upsert({
    where: { slug: 'example-org' },
    update: {
      description: 'Example organization for seeding.',
      last_updated: now.toISOString(),
      is_currently_active: true,
      total_projects: 1,
    },
    create: {
      active_years: [2023, 2024],
      category: 'Open Source',
      contact: {},
      created_at: now.toISOString(),
      description: 'Example organization for seeding.',
      first_year: 2023,
      id_: 'org-example',
      image_background_color: '#ffffff',
      image_slug: 'example-org',
      image_url: 'https://example.org/logo.png',
      img_r2_filename: 'example.png',
      img_r2_url: 'https://example.org/example.png',
      img_uploaded_at: now,
      is_currently_active: true,
      last_updated: now.toISOString(),
      last_year: 2024,
      name: 'Example Org',
      slug: 'example-org',
      social: {},
      stats: {
        avg_projects_per_appeared_year: 1.0,
        projects_by_year: {},
        students_by_year: {},
        total_students: 0,
      },
      technologies: ['TypeScript', 'Prisma'],
      topics: ['students', 'projects'],
      total_projects: 1,
      url: 'https://example.org',
      years: {},
    },
  })

  // Idempotent seed for one example project linked to the organization
  await prisma.projects.upsert({
    where: { project_id: 'example-2024-1' },
    update: {
      project_title: 'Seeded Project',
      project_abstract_short: 'Short abstract for seeded project.',
      project_code_url: 'https://github.com/example/repo',
      project_info_html: '<p>Project info</p>',
      lastUpdated: now,
    },
    create: {
      contributor: 'John Doe',
      created_at: now,
      date_created: now,
      lastUpdated: now,
      mentors: ['Jane Doe'],
      org_canonical_id: organization.id_,
      org_name: organization.name,
      org_slug: organization.slug,
      project_abstract_short: 'Short abstract for seeded project.',
      project_code_url: 'https://github.com/example/repo',
      project_id: 'example-2024-1',
      project_info_html: '<p>Project info</p>',
      project_title: 'Seeded Project',
      year: 2024,
    },
  })

  // Idempotent seed for waitlist entry
  await prisma.waitlist_entries.upsert({
    where: { email: 'seed@example.org' },
    update: {
      interests: ['tools', 'analytics'],
      source: 'seed-script',
    },
    create: {
      email: 'seed@example.org',
      interests: ['tools', 'analytics'],
      source: 'seed-script',
    },
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
