# Contributing to En Pensent

Thank you for your interest in contributing to En Pensent! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and professional
- Focus on constructive feedback
- Prioritize code quality and security
- Respect intellectual property (this is proprietary software)

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Installation
```bash
git clone https://github.com/aarthurshelton/enpensent.git
cd enpensent
npm install
```

### Environment Setup
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Running Locally
```bash
npm run dev
# Server starts on http://localhost:8080
```

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Write clean, commented code
- Follow existing code style
- Add tests for new features
- Update documentation

### 3. Test Your Changes
```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run tests
npm test

# Build for production
npm run build
```

### 4. Commit Changes
```bash
git add .
git commit -m "type: description"
```

Commit types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

## Code Standards

### TypeScript
- Enable strict mode
- No `any` types
- Explicit return types on functions
- JSDoc for public APIs

### React
- Functional components with hooks
- Props interface defined
- Error boundaries for error handling
- Accessible (ARIA labels, keyboard navigation)

### Testing
- Unit tests with Vitest
- E2E tests with Playwright
- Minimum 80% coverage for new code

### Security
- No secrets in code
- Input validation on all APIs
- Rate limiting for sensitive operations
- Audit logging for security events

## Architecture Guidelines

### Folder Structure
```
src/
  components/     # React components
  hooks/          # Custom React hooks
  lib/            # Business logic
  pages/          # Page components
  integrations/   # Third-party integrations
  types/          # TypeScript types
```

### Chess Engine
- Use `chess.js` for game logic
- Stockfish WASM for analysis
- Maintain 4,920 games/day capacity
- Real game IDs from Lichess/Chess.com only

### Trading Module
- IB Gateway integration
- Rate limiting: 10/min trading, 5/min orders
- Environment validation required
- Comprehensive error handling

## Review Process

1. All code must be reviewed by maintainers
2. CI checks must pass
3. Security review for sensitive changes
4. Performance impact assessment

## Questions?

- Technical: support@enpensent.com
- Enterprise: enterprise@enpensent.com

## License

Proprietary and Confidential - En Pensent LLC

© 2026 En Pensent LLC. All Rights Reserved.
