# Portfolio Site

A modern portfolio site built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and framer-motion.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Next.js 16+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **framer-motion** - Animation library
- **Lenis** - Smooth scrolling
- **next-themes** - Theme management

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata and providers
│   ├── page.tsx           # Home page
│   ├── error.tsx          # Error boundary
│   └── sitemap.ts         # Dynamic sitemap generation
├── components/             # React components
│   ├── draggable-carousel.tsx  # Image carousel with drag support
│   ├── image-lightbox.tsx      # Full-screen image lightbox
│   ├── intro-section.tsx       # Hero section with animations
│   ├── smooth-scroll.tsx      # Lenis smooth scroll provider
│   ├── theme-provider.tsx      # Theme management
│   └── work-group.tsx          # Work portfolio item
├── lib/                    # Utility functions and constants
│   ├── constants.ts       # Animation timing and breakpoint constants
│   ├── hooks.ts           # Custom React hooks
│   ├── image-utils.ts     # Image path normalization
│   ├── image-lightbox-utils.ts  # Lightbox utility functions
│   ├── site-config.ts     # Site configuration and metadata
│   └── work-groups.ts     # Portfolio work data
├── public/                 # Static assets
│   ├── icons/             # Social media icons
│   ├── images/            # Portfolio images
│   ├── logos/             # Company logos
│   ├── profile/           # Profile images
│   ├── robots.txt         # SEO crawler directives
│   └── manifest.json      # PWA manifest
└── scripts/                # Build scripts
    ├── generate-blur-placeholders.js  # Generate image blur data
    └── get-last-commit-date.js        # Get last commit date for bio
```

## Animation Timing System

The site uses a carefully orchestrated animation system with precise timing:

### Intro Section Animations
- **Letter-by-letter**: Name and date animate letter-by-letter with 8ms stagger
- **Word-by-word**: Bio paragraphs animate word-by-word with 11ms stagger
- **Social links**: Stagger with 100ms delay between each link

### Work Groups
- **Stagger delay**: 120ms between each work group
- **Duration**: 300ms per work group animation
- **Dividers**: Animate 100ms after each work group completes

### Constants
All animation timing values are centralized in `lib/constants.ts` for easy adjustment:
- `ANIMATION.WORD_STAGGER` - Delay between words (0.011s)
- `ANIMATION.WORK_GROUP_STAGGER` - Delay between work groups (0.12s)
- `ANIMATION.WORK_GROUP_DURATION` - Work group animation duration (0.3s)

## Image Optimization Workflow

### Blur Placeholders
Blur placeholders are automatically generated for all portfolio images:

1. **Pre-build**: The `prebuild` script runs `generate-blur-placeholders.js`
2. **Generation**: Uses `plaiceholder` to create base64 blur data
3. **Storage**: Blur data is stored in `lib/image-blur-data.json`
4. **Usage**: Images use blur placeholders while loading

### Image Paths
All image paths are normalized using `normalizeImagePath()` from `lib/image-utils.ts`:
- Ensures consistent path handling
- Supports both absolute (`/path/to/image.jpg`) and relative (`image.jpg`) paths

### Optimization
- Next.js Image component with automatic optimization
- AVIF and WebP format support
- Responsive image sizes for different devices
- Lazy loading for below-the-fold images

## Development Guidelines

### Code Organization
- **Constants**: All magic numbers should be in `lib/constants.ts`
- **Utilities**: Reusable functions in `lib/` with JSDoc comments
- **Hooks**: Custom hooks in `lib/hooks.ts` or `lib/hooks/` directory
- **Components**: Keep components focused and under 300 lines when possible

### TypeScript
- Strict mode enabled
- All functions should have proper type annotations
- Use branded types for IDs when beneficial

### Accessibility
- All interactive elements have visible focus indicators
- Keyboard navigation supported throughout
- Skip-to-content link for keyboard users
- Respects `prefers-reduced-motion`

### Performance
- Memoize expensive computations with `useMemo`
- Use `useCallback` for event handlers passed to children
- Lazy load images below the fold
- Preload critical images

## Deployment

### Vercel
This project is configured for deployment on Vercel:

1. Connect your repository to Vercel
2. Vercel will automatically detect Next.js
3. Build will run `prebuild` scripts automatically
4. Environment variables can be set in Vercel dashboard

### Environment Variables
- `NEXT_PUBLIC_SITE_URL` - Your site's URL (for SEO metadata)

### Pre-build Scripts
Before building, the following scripts run automatically:
- `generate-blur-placeholders.js` - Creates blur data for images
- `get-last-commit-date.js` - Updates bio "last updated" date

## Troubleshooting

### Images Not Loading
- Check that images exist in `public/images/` directory
- Verify image paths in `lib/work-groups.ts`
- Run `npm run prebuild` to regenerate blur placeholders

### Animation Issues
- Check `prefers-reduced-motion` settings in browser
- Verify constants in `lib/constants.ts` are correct
- Ensure Framer Motion is properly installed

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

## Design Workflow

The design is created in Figma and can be fine-tuned using Figma MCP for implementation.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lenis Smooth Scroll](https://github.com/studio-freight/lenis)















