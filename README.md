# GSoC Organizations Guide - Data-Driven Google Summer of Code Explorer

A comprehensive, open-source web platform that helps students and contributors explore Google Summer of Code organizations, analyze year-by-year trends, filter by tech stack and domain, and discover the best organizations to maximize their GSoC selection chances for GSoC 2026, GSoC 2027, and future years.

## 🔗 Project Links

**Website:** [https://www.gsocorganizationsguide.com](https://www.gsocorganizationsguide.com)

**X (Project):** [https://x.com/gsoc_orgs_guide](https://x.com/gsoc_orgs_guide)

**Made by:** [https://x.com/kauntiaketan](https://x.com/kauntiaketan)

**Official GSoC:** [https://summerofcode.withgoogle.com/](https://summerofcode.withgoogle.com/)

## 📋 Overview

The GSoC Organizations Guide is an open-source project designed to help students navigate the Google Summer of Code ecosystem. This data-driven platform provides comprehensive insights into GSoC organizations, their tech stacks, historical participation data, and trends to help aspiring contributors make informed decisions when selecting organizations for their GSoC applications.

Whether you're preparing for GSoC 2026, GSoC 2027, or exploring open source opportunities, this platform offers valuable analytics and filtering capabilities to identify organizations that align with your skills and interests.

## ✨ Key Features

- **Comprehensive GSoC Organizations List** - Browse 500+ Google Summer of Code organizations with detailed information
- **Tech Stack Based Filtering** - Filter organizations by programming languages, frameworks, and technologies
- **Year-Wise GSoC Data** - Explore historical data from GSoC 2016 through GSoC 2025
- **Trending Organizations** - Discover popular and emerging GSoC organizations
- **Visual Analytics** - Interactive charts and graphs showing organization trends, tech stack popularity, and selection statistics
- **Topic-Based Exploration** - Filter organizations by domain areas and project topics
- **Public REST API** - Access organization and project data programmatically via versioned API endpoints
- **Beginner-Friendly Insights** - Clear visualizations and analytics to help newcomers understand the GSoC landscape
- **Search and Filter** - Advanced search capabilities to find organizations matching specific criteria
- **Organization Profiles** - Detailed pages for each organization with projects, statistics, and participation history

## 📸 Screenshots

<!-- IMAGE: Homepage Preview - Show the main landing page with hero section, trending organizations, and FAQ -->
<!-- IMAGE: Organization Listing - Display the organizations page with filters and search functionality -->
<!-- IMAGE: Tech Stack Analytics - Show tech stack analytics page with charts and visualizations -->
<!-- IMAGE: Organization Details - Display a detailed organization profile page -->
<!-- IMAGE: Year-by-Year View - Show the year-specific organization listing page -->

## 🛠️ Tech Stack

### Tech-Stack
- **Next.js 16** - React framework with App Router for server-side rendering and static generation
- **React 19** - Modern React with latest features and performance optimizations
- **TypeScript** - Type-safe development for better code quality and maintainability
- **Tailwind CSS 4** - Utility-first CSS framework for rapid UI development
- **Radix UI** - Accessible, unstyled component primitives (Accordion, Slot)
- **Recharts** - Composable charting library for data visualizations
- **Framer Motion** - Animation library for smooth, performant UI transitions
- **Lucide React** - Modern icon library
- **Embla Carousel** - Lightweight carousel component
- **Prisma** - Next-generation ORM for database access
- **MongoDB** - NoSQL database storing organization, project, and statistics data
- **ESLint** - Code linting and quality checks
- **Husky** - Git hooks for pre-commit validation
- **Commitlint** - Conventional commit message validation
- **TypeScript** - Static type checking
- **Vercel** - Hosting platform with automatic deployments
- **Vercel Analytics** - Web analytics and performance monitoring
- **Cloudflare R2** - Object storage for organization logos and images

### Data Source
- Historical Google Summer of Code data (2016-current)
- Organization information, projects, and statistics from official GSoC archives
- GSoC Archives : https://summerofcode.withgoogle.com/archive 

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** package manager (install via `npm install -g pnpm`)
- **MongoDB** database (local or cloud instance like MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gsoc-orgs.git
   cd gsoc-orgs
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```
   This will automatically run `prisma generate` to set up the Prisma client.

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="your_mongodb_connection_string"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

   Replace `your_mongodb_connection_string` with your MongoDB connection string. For local development, you can use:
   ```
   DATABASE_URL="mongodb://localhost:27017/gsoc-orgs"
   ```

4. **Run database migrations** (if needed)
   ```bash
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `pnpm dev` - Start development server on http://localhost:3000
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server (requires `pnpm build` first)
- `pnpm lint` - Run ESLint to check code quality
- `pnpm type-check` - Run TypeScript type checking
- `pnpm validate` - Run lint, type-check, and build validation

## 🤝 Contributing

We welcome contributions from the open source community! This project is particularly valuable for students preparing for Google Summer of Code, as contributing here provides hands-on experience with modern web development, open source workflows, and real-world project collaboration.

### How to Contribute

#### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/yourusername/gsoc-orgs.git
cd gsoc-orgs
```

#### 2. Create a Branch

**Important:** This project uses branch protection. You cannot commit directly to the `main` branch. Always work on feature branches.

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/your-bug-fix
```

**Branch naming conventions:**
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

#### 3. Set Up Your Development Environment

```bash
# Install dependencies
pnpm install

# Set up environment variables (see Getting Started section)
# Create .env.local with DATABASE_URL

# Verify everything works
pnpm dev
```

#### 4. Make Your Changes

- Write clean, readable code following existing patterns
- Use TypeScript for type safety
- Follow the existing code style (enforced by ESLint)
- Add comments for complex logic
- Update documentation if needed

#### 5. Test Your Changes

```bash
# Run validation before committing
pnpm validate
```

This runs:
- Linting (`pnpm lint`)
- Type checking (`pnpm type-check`)
- Build check (`pnpm build`)

#### 6. Commit Your Changes

**Pre-commit Hooks:** This project uses Husky to automatically validate your code before every commit. The following checks run automatically:

- ✅ Branch protection (prevents commits to `main`)
- ✅ Linting (ESLint with auto-fix)
- ✅ Type checking (TypeScript)
- ✅ Build check (ensures code compiles)

**Commit Message Format:**

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages should follow this format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Examples:**
- `feat: add organization search functionality`
- `fix: resolve navigation double-click issue`
- `docs: update contributing guide`
- `refactor: optimize re-renders in organizations page`
- `style: format code with prettier`
- `test: add unit tests for API routes`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

```bash
# Stage your changes
git add .

# Commit (hooks will run automatically)
git commit -m "feat: add organization search functionality"
```

If the commit succeeds, your code has passed all validation checks and will pass CI/CD!

#### 7. Push and Create Pull Request

```bash
# Push your branch to GitHub
git push origin feature/your-feature-name
```

Then:
1. Go to the repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template (if available)
5. Describe your changes clearly
6. Link any related issues
7. Submit the PR

### Finding Issues to Work On

**For Beginners:**

1. **Look for "good first issue" labels** - These are specifically marked for newcomers
2. **Check the Issues tab** - Browse open issues and find something that interests you
3. **Start Small** - Fix typos, improve documentation, or add small features
4. **Ask Questions** - Don't hesitate to ask for clarification in issue comments

**Issue Types:**
- 🐛 Bug fixes
- ✨ Feature requests
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🔧 Refactoring opportunities
- 🧪 Test coverage improvements

### Code Style Guidelines

- **TypeScript** - Use TypeScript for all new code
- **ESLint** - Follow ESLint rules (auto-fixed on commit)
- **Component Structure** - Follow existing component patterns
- **Naming** - Use descriptive, camelCase variable names
- **Comments** - Add comments for complex logic
- **Formatting** - Code is auto-formatted by ESLint

### Pull Request Guidelines

- **One logical change per PR** - Keep PRs focused and reviewable
- **Descriptive title** - Use conventional commit format
- **Clear description** - Explain what and why, not just how
- **Link issues** - Reference related issues using `#issue-number`
- **Update documentation** - Update README or docs if needed
- **Test your changes** - Ensure everything works locally
- **Keep PRs small** - Easier to review and merge

### Getting Help

- **Check existing issues** - Your question might already be answered
- **Review the codebase** - Look for similar patterns
- **Ask in discussions** - Create a discussion thread
- **Create an issue** - For bugs or feature requests

### What Happens After You Contribute

1. **Review Process** - Maintainers will review your PR
2. **Feedback** - You may receive suggestions for improvements
3. **Iteration** - Make requested changes if needed
4. **Merge** - Once approved, your PR will be merged
5. **Recognition** - Your contribution will be visible in the project history

Contributing to open source projects like this is excellent preparation for Google Summer of Code, as it demonstrates:
- Ability to work with existing codebases
- Understanding of version control and collaboration
- Code quality and attention to detail
- Communication skills through PR discussions

## 🎓 Why This Project is Useful for GSoC Aspirants

### Learning Opportunities

**Modern Web Development:**
- Work with Next.js 16, React 19, and TypeScript - technologies highly valued in the industry
- Learn server-side rendering, API routes, and modern React patterns
- Gain experience with Tailwind CSS and component-based architecture

**Open Source Best Practices:**
- Understand Git workflows, branching strategies, and pull request processes
- Learn code review practices and collaborative development
- Experience real-world project structure and organization

**Data Handling & Analytics:**
- Work with MongoDB and Prisma ORM
- Build data visualizations with Recharts
- Understand API design and RESTful principles

### GSoC Preparation Benefits

**Portfolio Building:**
- Contribute to a real, production-ready project
- Build a portfolio that demonstrates your skills to GSoC mentors
- Show experience with the exact technologies many GSoC organizations use

**Understanding the GSoC Ecosystem:**
- Gain deep insights into GSoC organizations and their tech stacks
- Understand trends and patterns in GSoC participation
- Identify organizations that match your skills and interests

**Community Engagement:**
- Connect with other GSoC aspirants and contributors
- Build relationships that can help during GSoC applications
- Demonstrate active participation in open source communities

**Skill Development:**
- Improve your coding skills through real contributions
- Learn to read and understand large codebases
- Develop problem-solving and debugging abilities

### Why Contributing Here is Valuable

1. **Relevant Domain** - Working on a GSoC-related project shows genuine interest and understanding
2. **Modern Stack** - Technologies used here are common in many GSoC organizations
3. **Real Impact** - Your contributions help thousands of students prepare for GSoC
4. **Documentation** - Well-documented codebase makes it easier to learn and contribute
5. **Beginner Friendly** - Clear contribution guidelines and helpful community

Contributing to this project demonstrates to GSoC mentors that you:
- Can work independently and collaboratively
- Understand open source development workflows
- Are committed to learning and improving
- Have experience with modern web technologies
- Can contribute meaningfully to real projects

## 🔍 SEO & Keywords

This project is optimized for search engines and helps students discover valuable resources for Google Summer of Code preparation. The platform provides comprehensive data and insights related to:

- **Google Summer of Code** - Complete guide to GSoC organizations and opportunities
- **GSoC Organizations** - Extensive database of participating organizations
- **Open Source Contribution** - Resources for students entering open source
- **GSoC 2026 Organizations** - Up-to-date information for upcoming GSoC cycles
- **GSoC Tech Stack** - Technology analysis and filtering capabilities
- **GSoC Project List** - Comprehensive project database with search and filter
- **GSoC Year by Year** - Historical data and trends analysis
- **Trending GSoC Organizations** - Popular and emerging organization insights
- **GSoC Selection Chances** - Data-driven analytics to improve application success
- **Student Developer Programs** - Resources for aspiring student developers

The platform serves as a comprehensive resource for anyone interested in Google Summer of Code, open source contribution, and student developer programs.

## 📄 License & Open Source Statement

This project is open source and welcomes community contributions. The project uses a custom non-commercial license. Please review the [LICENSE](LICENSE) file for complete terms.

**Key Points:**
- ✅ Open source and free to use for non-commercial purposes
- ✅ Community contributions are welcome and encouraged
- ✅ Commercial use requires explicit permission from the copyright holder
- ✅ Contributors grant usage rights for their contributions

**Why Open Source:**

We believe that knowledge and tools for preparing for Google Summer of Code should be accessible to all students, regardless of their background or resources. By making this project open source, we:

- Enable students to learn from real-world codebases
- Provide a platform for collaborative learning and contribution
- Support the open source community that GSoC aims to strengthen
- Create opportunities for students to build their portfolios

**Contributing to Open Source:**

Contributing to this project is an excellent way to:
- Learn modern web development practices
- Build your open source portfolio
- Prepare for Google Summer of Code
- Help other students in their GSoC journey
- Gain experience with collaborative development

We encourage students, developers, and anyone interested in GSoC to contribute, learn, and grow with this project.

## 📚 Additional Resources

- **API Documentation** - See [API_COMPLETE_DOCS.md](./API_COMPLETE_DOCS.md) for complete API reference
- **Contributing Guide** - Detailed contribution guidelines in [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Security** - Report security issues following [SECURITY.md](./SECURITY.md)

## 🙏 Acknowledgments

This project is built to serve the Google Summer of Code community and help students navigate the open source ecosystem. Special thanks to all contributors and the GSoC community for their support and feedback.

---

**Ready to contribute?** Start by reading the [Contributing Guide](#-contributing) and finding an issue that interests you. Every contribution, no matter how small, makes a difference!

**Questions?** Open an issue or start a discussion. We're here to help!
