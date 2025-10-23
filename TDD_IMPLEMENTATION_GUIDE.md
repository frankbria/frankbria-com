# TDD Implementation Guide - Parallel Execution

**Project:** frankbria.com - 6 Missing Features
**Approach:** Test-Driven Development with Parallel Teams
**Quality Metrics:** >85% Coverage, 100% Test Pass Rate

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd /home/frankbria/projects/frankbria-com
npm install

# 2. Verify testing setup
npm test -- --version

# 3. Run initial test suite (should have 0 tests initially)
npm test:coverage
```

---

## 📋 Implementation Status

### ✅ Completed:
- Testing infrastructure (Jest + React Testing Library)
- Package.json updated with test dependencies
- Jest configuration with 85% coverage thresholds
- Mock setup for Next.js components

### 🔄 Ready to Implement:
- All 5 teams can start implementing in parallel
- Each team follows TDD: Red → Green → Refactor

---

## 🎯 Team Implementation Order

Due to Claude Code's conversation limits, I recommend implementing features in phases rather than truly parallel. Here's the optimal sequence:

### Phase 1: Foundation Components (4-6 hours)
**Priority:** These are used by other features

1. **UI Components** (Team 2 subset)
   - Button component with tests
   - Input component with tests
   - Dialog component with tests
   - Sheet component with tests

### Phase 2: Independent Features (6-8 hours)
**Priority:** Can be implemented in parallel

2. **Cookie Consent** (Team 1)
   - Simple, independent feature
   - Legal requirement

3. **Email Sharing** (Team 5)
   - Simple, independent feature
   - Completes social sharing

4. **Related Posts** (Team 4)
   - Moderate complexity
   - Independent of other features

### Phase 3: Complex Features (8-10 hours)
**Priority:** Depend on Phase 1 components

5. **Search Functionality** (Team 2)
   - Uses Button, Input, Dialog components
   - Most complex feature

6. **Mobile Menu** (Team 3)
   - Uses Button, Sheet components
   - Responsive behavior testing

---

## 🧪 TDD Workflow for Each Feature

### Example: Cookie Consent (Team 1)

#### Step 1: Write Test (RED)

Create: `components/__tests__/CookieConsent.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CookieConsent } from '../CookieConsent';

describe('CookieConsent', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = '';
  });

  it('should render banner on first visit', () => {
    render(<CookieConsent />);
    expect(screen.getByText(/This website uses cookies/i)).toBeInTheDocument();
  });

  it('should have ACCEPT button', () => {
    render(<CookieConsent />);
    expect(screen.getByText('ACCEPT')).toBeInTheDocument();
  });

  it('should have Cookie settings button', () => {
    render(<CookieConsent />);
    expect(screen.getByText('Cookie settings')).toBeInTheDocument();
  });

  it('should hide banner when ACCEPT is clicked', () => {
    render(<CookieConsent />);
    const acceptButton = screen.getByText('ACCEPT');
    fireEvent.click(acceptButton);

    // Banner should be hidden (component unmounts)
    expect(screen.queryByText(/This website uses cookies/i)).not.toBeInTheDocument();
  });

  it('should set cookie when ACCEPT is clicked', () => {
    render(<CookieConsent />);
    const acceptButton = screen.getByText('ACCEPT');
    fireEvent.click(acceptButton);

    // Check if cookie is set
    expect(document.cookie).toContain('frankbria-cookie-consent=true');
  });
});
```

#### Step 2: Run Test (Should FAIL)

```bash
npm test -- CookieConsent.test.tsx
# Expected: All tests fail (component doesn't exist yet)
```

#### Step 3: Write Minimal Code (GREEN)

Create: `components/CookieConsent.tsx`

```typescript
'use client';

import CookieConsentLib from 'react-cookie-consent';

export function CookieConsent() {
  return (
    <CookieConsentLib
      location="bottom"
      buttonText="ACCEPT"
      declineButtonText="Cookie settings"
      enableDeclineButton
      cookieName="frankbria-cookie-consent"
      style={{
        background: '#1f2937',
        padding: '20px',
        alignItems: 'center',
      }}
      buttonStyle={{
        background: '#3b82f6',
        color: '#ffffff',
        fontSize: '14px',
        padding: '10px 20px',
        borderRadius: '6px',
        fontWeight: '500',
      }}
      declineButtonStyle={{
        background: 'transparent',
        color: '#9ca3af',
        fontSize: '14px',
        padding: '10px 20px',
        borderRadius: '6px',
      }}
      expires={365}
    >
      This website uses cookies to improve your experience. We'll assume you're
      ok with this, but you can opt-out if you wish.
    </CookieConsentLib>
  );
}
```

#### Step 4: Run Test (Should PASS)

```bash
npm test -- CookieConsent.test.tsx
# Expected: All tests pass
```

#### Step 5: Refactor (Keep Tests GREEN)

- Add TypeScript types
- Improve accessibility
- Extract configuration
- Add comments

#### Step 6: Run Coverage

```bash
npm test:coverage -- CookieConsent
# Expected: >90% coverage
```

---

## 📊 Coverage Targets Per Feature

| Feature | Lines | Branches | Functions | Statements |
|---------|-------|----------|-----------|------------|
| Cookie Consent | >90% | >85% | >90% | >90% |
| Button (UI) | >95% | >90% | >95% | >95% |
| Input (UI) | >95% | >90% | >95% | >95% |
| Dialog (UI) | >90% | >85% | >90% | >90% |
| Sheet (UI) | >90% | >85% | >90% | >90% |
| SearchDialog | >85% | >80% | >85% | >85% |
| SearchResults | >85% | >80% | >85% | >85% |
| MobileMenu | >85% | >80% | >85% | >85% |
| RelatedPosts | >85% | >80% | >85% | >85% |
| Email Sharing | >90% | >85% | >90% | >90% |

---

## 🧩 Recommended Implementation Sequence

Due to the conversational nature of Claude Code, I'll implement features one at a time with full TDD coverage. Here's the recommended approach:

### Option A: Incremental (Recommended for conversation limits)

Ask me to implement each feature sequentially:

1. "Implement Cookie Consent with full TDD coverage"
2. "Implement UI components (Button, Input, Dialog, Sheet) with full TDD coverage"
3. "Implement Search functionality with full TDD coverage"
4. "Implement Mobile Menu with full TDD coverage"
5. "Implement Related Posts with full TDD coverage"
6. "Implement Email Sharing with full TDD coverage"
7. "Run full test suite and generate coverage report"

### Option B: Full Automation (May hit conversation limits)

Ask me to: "Implement all 6 features with full TDD coverage in sequence"

I'll implement each feature completely with tests, then move to the next.

---

## 🔍 Test Categories Per Feature

### Unit Tests
- Individual component behavior
- Props handling
- State management
- Event handlers

### Integration Tests
- Component interactions
- API integration
- Router navigation
- Context usage

### Accessibility Tests
- ARIA labels
- Keyboard navigation
- Screen reader compatibility
- Focus management

### Responsive Tests
- Mobile breakpoints
- Desktop layout
- Touch interactions
- Hover states

---

## ✅ Quality Checklist

Before marking any feature complete:

**Code Quality**
- [ ] All TypeScript types defined
- [ ] No `any` types used
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting applied
- [ ] Comments for complex logic

**Testing**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage >85% for feature
- [ ] Edge cases covered
- [ ] Error states tested

**Accessibility**
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Focus management correct
- [ ] Color contrast sufficient

**Performance**
- [ ] No unnecessary re-renders
- [ ] Debouncing for expensive operations
- [ ] Lazy loading where appropriate
- [ ] Bundle size acceptable

---

## 🎯 Next Step

**Choose your approach:**

### Quick Start (Recommended):
Say: **"Implement Cookie Consent with full TDD coverage"**

I'll create the component and complete test suite following Red-Green-Refactor.

### Or Full Implementation:
Say: **"Implement all features with TDD"**

I'll implement all 6 features sequentially with complete test coverage.

---

## 📈 Progress Tracking

Track implementation progress in `IMPLEMENTATION_STATUS.md`

```bash
# Check current status
cat IMPLEMENTATION_STATUS.md

# Run tests
npm test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

---

## 🚨 Important Notes

1. **TDD is Non-Negotiable**: Always write tests first (RED → GREEN → REFACTOR)
2. **Coverage Threshold**: Jest will fail if coverage drops below 85%
3. **Test Pass Rate**: All tests must pass (100% pass rate)
4. **No Skipped Tests**: Don't use `.skip()` or `.only()` in final code
5. **Real Tests Only**: No dummy tests to inflate coverage

---

**Ready to start?** Choose your approach above and let's begin! 🚀
