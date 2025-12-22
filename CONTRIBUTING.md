# Contributing Guide

## Pre-commit Hooks

This project uses **Husky** to run pre-commit hooks that **automatically validate** your code before every commit. This ensures CI/CD never fails due to code issues.

### What Runs Automatically on Commit

When you commit, the following checks run **automatically**:

1. **Branch Protection** 🛡️
   - Prevents direct commits to `main` branch
   - Forces you to work on feature branches
   - Protects the main branch from accidental commits

2. **Linting** (`lint-staged`)
   - Runs ESLint on staged files
   - Auto-fixes fixable issues
   - Prevents lint errors from reaching CI/CD

3. **Type Checking** (`tsc --noEmit`)
   - Validates TypeScript types
   - Catches type errors that would break the build
   - Fast check that prevents most build failures

4. **Build Check** (`pnpm build`)
   - Ensures code compiles successfully
   - Catches build errors before they reach CI/CD
   - **Same check that runs in CI/CD**

**Result:** If your commit succeeds, it will pass CI/CD! ✅

### Manual Validation (Optional)

You can also run validation manually before committing:

```bash
pnpm validate
```

This runs the same checks:
- ✅ Linting (`pnpm lint`)
- ✅ Type checking (`pnpm type-check`)
- ✅ Build check (`pnpm build`)

### Troubleshooting

#### Pre-commit hooks not running?

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
   This runs `husky` setup automatically via the `prepare` script.

2. **Verify hooks are installed:**
   ```bash
   git config --get core.hooksPath
   # Should output: .husky/_
   ```

3. **Manually install Husky (if needed):**
   ```bash
   pnpm exec husky install
   ```

#### Can't commit to main branch?

The hook prevents direct commits to `main`. Create a feature branch first:

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: your changes"
```

#### Commit fails with type errors?

Fix the TypeScript errors shown in the output. The hook will prevent the commit until all type errors are resolved.

#### Commit fails with lint errors?

Most lint errors are auto-fixed. If some remain, fix them manually and commit again.

#### Commit fails with build errors?

Fix the build errors shown in the output. Common issues:
- TypeScript type errors
- Missing imports
- Syntax errors
- Missing dependencies

The hook will prevent the commit until the build succeeds.

#### Want to skip hooks (not recommended)?

```bash
git commit --no-verify -m "your message"
```

⚠️ **Warning:** This bypasses all checks and may cause CI/CD to fail.

### Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

Examples:
- `feat: add new organization filter`
- `fix: resolve navigation double-click issue`
- `docs: update contributing guide`
- `refactor: optimize re-renders in organizations page`

The commit-msg hook validates your commit message format automatically.

---

## Development Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```
   
   The pre-commit hook will automatically:
   - ✅ Check you're not on main branch
   - ✅ Lint your code
   - ✅ Check TypeScript types
   - ✅ Build your code
   
   If all checks pass, your commit succeeds! 🎉

3. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. ✅ Linting (`pnpm lint`)
2. ✅ Build (`pnpm build`)

**Good news:** These are the same checks that run in your pre-commit hook! If your commit succeeds locally, CI/CD will pass. ✅

---

## Need Help?

- Check existing issues on GitHub
- Review the codebase for similar patterns
- Ask in discussions or create an issue
