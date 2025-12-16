# Loading Animation Timeline Documentation

## Overview
This document provides a detailed breakdown of the page loading animation sequence, including precise timing, easing functions, and visual representations of each animation phase.

**Total Animation Duration:** ~3.06 seconds

---

## Timeline Summary

```
0s ────────────────────────────────────────────────────────────────────────────── 3.06s
│
├─ 0.00s: IntroSection wrapper fade-in (0.3s)
│  ├─ 0.10s: First bio paragraph word-by-word animation starts
│  │  └─ 0.91s: First paragraph completes
│  └─ 0.40s: Second bio paragraph word-by-word animation starts
│     └─ 1.87s: Second paragraph completes
│
├─ 2.00s: Social links & Work groups animation phase begins
│  ├─ Social Links (stagger 0.1s, duration 0.4s each)
│  │  ├─ Link 1: 2.00s ── 2.40s
│  │  ├─ Link 2: 2.10s ── 2.50s
│  │  └─ Link 3: 2.20s ── 2.60s
│  │
│  └─ Work Groups (stagger 0.12s, duration 0.3s each)
│     ├─ Group 1: 2.00s ── 2.30s
│     ├─ Group 2: 2.12s ── 2.42s
│     ├─ Group 3: 2.24s ── 2.54s
│     └─ Group 4: 2.36s ── 2.66s
│
├─ 2.40s: Dividers animation phase begins (after work groups + 0.1s gap)
│  ├─ Divider 1: 2.40s ── 2.70s
│  ├─ Divider 2: 2.52s ── 2.82s
│  ├─ Divider 3: 2.64s ── 2.94s
│  └─ Divider 4: 2.76s ── 3.06s
│
└─ 2.60s: Back to top button fade-in (0.3s) ── 2.90s
```

---

## Phase 1: Initial Load & Intro Section (0.00s - 0.30s)

### 1.1 IntroSection Wrapper
**Timing:** `0.00s - 0.30s`  
**Duration:** `0.3s`  
**Easing:** `cubic-bezier(0.645, 0.045, 0.355, 1)` (ease-in-out-cubic)  
**Properties:**
- `opacity`: 0 → 1
- `y`: 8px → 0px

**Visualization:**
```
Time:  0.00s    0.10s    0.20s    0.30s
      ──────   ──────   ──────   ──────
Opacity:  0%     33%      67%     100%
Y:      +8px    +5px     +3px      0px
State:  [Hidden] [Fade]  [Fade]  [Visible]
```

**Code Reference:**
```110:118:app/page.tsx
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.645, 0.045, 0.355, 1],
            delay: 0
          }}
        >
          <IntroSection />
        </motion.div>
```

---

## Phase 2: Bio Text Animation (0.10s - 1.87s)

### 2.1 First Bio Paragraph
**Timing:** `0.10s - 0.91s`  
**Word Count:** ~18 words  
**Word Stagger:** `0.03s` per word  
**Word Duration:** `0.3s` per word  
**Easing:** `cubic-bezier(0.215, 0.61, 0.355, 1)` (ease-out-cubic)

**Calculation:**
- First word starts: `0.10s`
- Last word starts: `0.10s + (17 × 0.03s) = 0.61s`
- Last word finishes: `0.61s + 0.3s = 0.91s`

**Visualization:**
```
Time:  0.10s ──────────────────────────────────────────────── 0.91s
       │
       ├─ Word 1:  [0.10s ── 0.40s] ████████
       ├─ Word 2:  [0.13s ── 0.43s]   ████████
       ├─ Word 3:  [0.16s ── 0.46s]     ████████
       ├─ Word 4:  [0.19s ── 0.49s]       ████████
       ├─ Word 5:  [0.22s ── 0.52s]         ████████
       ├─ Word 6:  [0.25s ── 0.55s]           ████████
       ├─ Word 7:  [0.28s ── 0.58s]             ████████
       ├─ Word 8:  [0.31s ── 0.61s]               ████████
       ├─ Word 9:  [0.34s ── 0.64s]                 ████████
       ├─ Word 10: [0.37s ── 0.67s]                   ████████
       ├─ Word 11: [0.40s ── 0.70s]                     ████████
       ├─ Word 12: [0.43s ── 0.73s]                       ████████
       ├─ Word 13: [0.46s ── 0.76s]                         ████████
       ├─ Word 14: [0.49s ── 0.79s]                           ████████
       ├─ Word 15: [0.52s ── 0.82s]                             ████████
       ├─ Word 16: [0.55s ── 0.85s]                               ████████
       ├─ Word 17: [0.58s ── 0.88s]                                 ████████
       └─ Word 18: [0.61s ── 0.91s]                                   ████████

Text State:
0.10s: "Senior"
0.13s: "Senior product"
0.16s: "Senior product designer"
...
0.91s: "Senior product designer with an engineer's eye. Making things that work the way people expect them to."
```

**Code Reference:**
```24:52:components/intro-section.tsx
// Component for word-by-word animation
function AnimatedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const shouldReduceMotion = useReducedMotion()
  const words = text.split(" ")

  if (shouldReduceMotion) {
    return <span>{text}</span>
  }

  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay + index * 0.03,
            ease: [0.215, 0.61, 0.355, 1], // ease-out-cubic
          }}
          style={{ display: "inline-block" }}
        >
          {word}
          {index < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </>
  )
}
```

### 2.2 Second Bio Paragraph
**Timing:** `0.40s - 1.87s`  
**Word Count:** ~40 words  
**Word Stagger:** `0.03s` per word  
**Word Duration:** `0.3s` per word  
**Easing:** `cubic-bezier(0.215, 0.61, 0.355, 1)` (ease-out-cubic)

**Calculation:**
- First word starts: `0.40s`
- Last word starts: `0.40s + (39 × 0.03s) = 1.57s`
- Last word finishes: `1.57s + 0.3s = 1.87s`

**Visualization:**
```
Time:  0.40s ──────────────────────────────────────────────────────────────── 1.87s
       │
       ├─ Word 1:  [0.40s ── 0.70s] ████████
       ├─ Word 2:  [0.43s ── 0.73s]   ████████
       ├─ Word 3:  [0.46s ── 0.76s]     ████████
       ...
       ├─ Word 38: [1.54s ── 1.84s]                                    ████████
       ├─ Word 39: [1.57s ── 1.87s]                                      ████████
       └─ Word 40: [1.60s ── 1.90s]                                        ████████

Note: Second paragraph overlaps with first paragraph animation
```

**Overlap Visualization:**
```
Timeline:  0.0s    0.5s    1.0s    1.5s    2.0s
           │       │       │       │       │
Paragraph 1: ████████████████████
Paragraph 2:     ████████████████████████████████████████████████████
```

---

## Phase 3: Social Links & Work Groups (2.00s - 3.05s)

### 3.1 Social Links Animation
**Start Time:** `2.00s`  
**Stagger:** `0.1s` between each link  
**Duration:** `0.4s` per link  
**Easing:** `cubic-bezier(0.215, 0.61, 0.355, 1)` (ease-out-cubic)  
**Properties:**
- `opacity`: 0 → 1
- `y`: 8px → 0px

**Timing Breakdown:**
- **Link 1 (Twitter):** `2.00s - 2.40s`
- **Link 2 (Telegram):** `2.10s - 2.50s`
- **Link 3 (LinkedIn):** `2.20s - 2.60s`

**Visualization:**
```
Time:  2.00s ──────────────────────────────────────────────── 2.60s
       │
       [Twitter]  ████████████████
       [Telegram]      ████████████████
       [LinkedIn]          ████████████████

State:
2.00s: [Hidden] [Hidden] [Hidden]
2.10s: [Visible] [Hidden] [Hidden]
2.20s: [Visible] [Visible] [Hidden]
2.60s: [Visible] [Visible] [Visible]
```

**Code Reference:**
```126:134:components/intro-section.tsx
          <motion.div
            key={social.name}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              opacity: { duration: 0.4, delay: socialLinksStartDelay + index * 0.1, ease: [0.215, 0.61, 0.355, 1] },
              y: { duration: 0.4, delay: socialLinksStartDelay + index * 0.1, ease: [0.215, 0.61, 0.355, 1] },
              scale: { type: "spring", stiffness: 400, damping: 17 },
            }}
          >
```

### 3.2 Work Groups Animation
**Start Time:** `2.00s`  
**Stagger:** `0.12s` between each group  
**Duration:** `0.3s` per group  
**Easing:** `cubic-bezier(0.645, 0.045, 0.355, 1)` (ease-in-out-cubic)  
**Properties:**
- `opacity`: 0 → 1
- `y`: 8px → 0px

**Work Groups:**
1. Neutron Rebrand
2. Neutron Web & App
3. Structured
4. Highlight AI

**Timing Breakdown:**
- **Group 1:** `2.00s - 2.30s`
- **Group 2:** `2.12s - 2.42s`
- **Group 3:** `2.24s - 2.54s`
- **Group 4:** `2.36s - 2.66s`

**Visualization:**
```
Time:  2.00s ──────────────────────────────────────────────────────────────── 2.66s
       │
       [Neutron Rebrand]    ████████
       [Neutron Web & App]      ████████
       [Structured]                  ████████
       [Highlight AI]                    ████████

State:
2.00s: [Hidden] [Hidden] [Hidden] [Hidden]
2.12s: [Visible] [Hidden] [Hidden] [Hidden]
2.24s: [Visible] [Visible] [Hidden] [Hidden]
2.36s: [Visible] [Visible] [Visible] [Hidden]
2.66s: [Visible] [Visible] [Visible] [Visible]
```

**Code Reference:**
```131:140:app/page.tsx
              <motion.div
                key={workGroup.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.645, 0.045, 0.355, 1],
                  delay: workGroupDelay
                }}
              >
                <WorkGroup workGroup={workGroup} />
              </motion.div>
```

**Parallel Animation Visualization:**
```
Timeline:  2.0s    2.2s    2.4s    2.6s    2.8s    3.0s    3.2s
           │       │       │       │       │       │       │
Social:    ████   ████   ████   ████
Links:        ████   ████   ████   ████
                ████   ████   ████   ████

Work:      ████████████████████████████████████████
Groups:       ████████████████████████████████████████
                  ████████████████████████████████████████
                      ████████████████████████████████████████
```

---

## Phase 4: Dividers Animation (2.40s - 3.06s)

### 4.1 Divider Animations
**Start Time:** After each work group finishes + `0.1s` gap  
**Duration:** `0.3s` per divider  
**Easing:** `cubic-bezier(0.215, 0.61, 0.355, 1)` (ease-out-cubic)  
**Properties:**
- `scaleX`: 0 → 1 (transform-origin: left)
- `opacity`: 0 → 1

**Timing Calculations:**
- **Divider 1:** `2.00s + 0.3s + 0.1s = 2.40s` → `2.40s + 0.3s = 2.70s`
- **Divider 2:** `2.12s + 0.3s + 0.1s = 2.52s` → `2.52s + 0.3s = 2.82s`
- **Divider 3:** `2.24s + 0.3s + 0.1s = 2.64s` → `2.64s + 0.3s = 2.94s`
- **Divider 4:** `2.36s + 0.3s + 0.1s = 2.76s` → `2.76s + 0.3s = 3.06s`

**Visualization:**
```
Time:  2.40s ──────────────────────────────────────────────────────────────── 3.06s
       │
       [Divider 1]  ████████
       [Divider 2]      ████████
       [Divider 3]          ████████
       [Divider 4]              ████████

Animation Effect:
scaleX:  0% ──────────────────────────────────────────────── 100%
         │                                                  │
         [Hidden Line]                    [Full Width Line]
```

**Code Reference:**
```89:105:app/page.tsx
  const Divider = ({ delay }: { delay: number }) => (
    <motion.div
      className="flex h-[9px] items-center justify-center py-1 overflow-hidden"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={shouldReduceMotion ? {} : { scaleX: 1, opacity: 1 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.215, 0.61, 0.355, 1],
          delay
        }}
        style={{ transformOrigin: "left" }}
        className="h-px w-full bg-border"
      />
    </motion.div>
  )
```

---

## Phase 5: Back to Top Button (2.60s - 2.90s)

### 5.1 Back to Top Button
**Start Time:** `2.00s + (4 × 0.12s) + 0.12s = 2.60s`  
**Duration:** `0.3s`  
**Easing:** `cubic-bezier(0.645, 0.045, 0.355, 1)` (ease-in-out-cubic)  
**Properties:**
- `opacity`: 0 → 1
- `y`: 8px → 0px

**Visualization:**
```
Time:  2.60s ──────────────────────────────────────────────── 2.90s
       │
       [Button]  ████████

State:
2.60s: [Hidden - opacity: 0, y: +8px]
2.90s: [Visible - opacity: 1, y: 0px]
```

**Code Reference:**
```151:159:app/page.tsx
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.645, 0.045, 0.355, 1],
            delay: 2.0 + (workGroups.length * 0.12) + 0.12
          }}
          className="mt-16 flex items-center justify-center"
        >
```

---

## Complete Timeline Visualization

### Master Timeline
```
Time:  0.0s    0.5s    1.0s    1.5s    2.0s    2.5s    3.0s    3.5s
       │       │       │       │       │       │       │       │
Phase 1: ████
(Intro)

Phase 2:     ████████████████████████████████████████████████████████████
(Bio Text)

Phase 3:                                         ████████████████████
(Social & Work)

Phase 4:                                                      ████████████
(Dividers)

Phase 5:                                             ████████
(Button)
```

### Element State Matrix
```
Time →    0.0s  0.5s  1.0s  1.5s  2.0s  2.5s  3.0s  3.5s
          │     │     │     │     │     │     │     │
Intro     ████  ████  ████  ████  ████  ████  ████  ████
Bio P1    ████  ████  ████  ████  ████  ████  ████  ████
Bio P2        ████  ████  ████  ████  ████  ████  ████
Social 1                              ████  ████  ████
Social 2                              ████  ████  ████
Social 3                              ████  ████  ████
Work 1                                ████  ████  ████
Work 2                                    ████  ████  ████
Work 3                                        ████  ████  ████
Work 4                                            ████  ████  ████
Divider 1                                              ████  ████
Divider 2                                                  ████  ████
Divider 3                                                      ████  ████
Divider 4                                                          ████  ████
Button                                        ████  ████
```

**Legend:**
- `████` = Animation active/visible
- Empty space = Hidden/not yet started

---

## Easing Functions Reference

### Used Easing Functions

1. **Ease-In-Out-Cubic** (Intro, Work Groups, Button)
   - `cubic-bezier(0.645, 0.045, 0.355, 1)`
   - Smooth acceleration and deceleration
   - Used for: IntroSection wrapper, Work Groups, Back to Top button

2. **Ease-Out-Cubic** (Bio Text, Social Links, Dividers)
   - `cubic-bezier(0.215, 0.61, 0.355, 1)`
   - Fast start, slow end
   - Used for: Word-by-word text animation, Social links, Dividers

### Easing Curve Visualization
```
Ease-In-Out-Cubic (0.645, 0.045, 0.355, 1):
Progress
  1.0 │                    ╭───────────
      │                  ╭─╯
      │                ╭─╯
      │              ╭─╯
      │            ╭─╯
      │          ╭─╯
      │        ╭─╯
      │      ╭─╯
      │    ╭─╯
  0.0 └────╯───────────────────────────
      0.0                           1.0
                    Time

Ease-Out-Cubic (0.215, 0.61, 0.355, 1):
Progress
  1.0 │              ╭───────────────
      │            ╭─╯
      │          ╭─╯
      │        ╭─╯
      │      ╭─╯
      │    ╭─╯
      │  ╭─╯
      │╭─╯
  0.0 └───────────────────────────────
      0.0                           1.0
                    Time
```

---

## Animation Properties Summary

| Element | Property | Initial | Final | Duration | Easing |
|---------|----------|---------|-------|----------|--------|
| IntroSection | opacity | 0 | 1 | 0.3s | ease-in-out-cubic |
| IntroSection | y | 8px | 0px | 0.3s | ease-in-out-cubic |
| Bio Words | opacity | 0 | 1 | 0.3s | ease-out-cubic |
| Bio Words | y | 4px | 0px | 0.3s | ease-out-cubic |
| Social Links | opacity | 0 | 1 | 0.4s | ease-out-cubic |
| Social Links | y | 8px | 0px | 0.4s | ease-out-cubic |
| Work Groups | opacity | 0 | 1 | 0.3s | ease-in-out-cubic |
| Work Groups | y | 8px | 0px | 0.3s | ease-in-out-cubic |
| Dividers | scaleX | 0 | 1 | 0.3s | ease-out-cubic |
| Dividers | opacity | 0 | 1 | 0.3s | ease-out-cubic |
| Button | opacity | 0 | 1 | 0.3s | ease-in-out-cubic |
| Button | y | 8px | 0px | 0.3s | ease-in-out-cubic |

---

## Key Timing Milestones

| Time | Event |
|------|-------|
| `0.00s` | Page load, IntroSection wrapper animation starts |
| `0.10s` | First bio paragraph word animation begins |
| `0.30s` | IntroSection wrapper animation completes |
| `0.40s` | Second bio paragraph word animation begins |
| `0.91s` | First bio paragraph completes |
| `1.87s` | Second bio paragraph completes |
| `2.00s` | Social links and Work groups animation phase begins |
| `2.30s` | First work group (Neutron Rebrand) completes |
| `2.40s` | First social link (Twitter) completes, First divider animation starts |
| `2.42s` | Second work group (Neutron Web & App) completes |
| `2.50s` | Second social link (Telegram) completes |
| `2.52s` | Second divider animation starts |
| `2.54s` | Third work group (Structured) completes |
| `2.60s` | Third social link (LinkedIn) completes, Back to top button starts |
| `2.64s` | Third divider animation starts |
| `2.66s` | Fourth work group (Highlight AI) completes |
| `2.70s` | First divider completes |
| `2.76s` | Fourth divider animation starts |
| `2.82s` | Second divider completes |
| `2.90s` | Back to top button completes |
| `2.94s` | Third divider completes |
| `3.06s` | Fourth divider completes, **All animations complete** |

---

## Performance Considerations

1. **GPU Acceleration:** All animations use `transform` (translateY, scaleX) and `opacity` properties, which are GPU-accelerated
2. **Reduced Motion:** The animation respects `prefers-reduced-motion` via `useReducedMotion()` hook
3. **Stagger Optimization:** Word-by-word animations use minimal stagger (0.03s) to maintain smooth flow
4. **Overlap Strategy:** Social links and work groups animate simultaneously to reduce total load time

---

## Notes

- All timings are calculated based on the code implementation
- Word counts are approximate based on the bio text content
- The animation sequence is designed to create a cascading reveal effect
- Social links and work groups start simultaneously at 2.0s to maintain visual balance
- Dividers appear after their respective work groups to create visual separation

---

**Document Version:** 2.0  
**Last Updated:** Updated to comply with animation rules - reduced durations to 0.2-0.3s range, replaced custom easing with standard ease-in-out-cubic, added reduced motion support  
**Total Animation Duration:** ~3.06 seconds

