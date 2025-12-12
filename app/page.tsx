import Link from "next/link"
import { IntroSection } from "@/components/intro-section"
import { WorkGroup } from "@/components/work-group"
import { workGroups } from "@/lib/work-groups"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[620px] flex-col px-6 py-32">
        <IntroSection />
        <section className="mt-[98px] flex flex-col gap-16">
          {workGroups.map((workGroup, index) => (
            <WorkGroup 
              key={workGroup.id} 
              workGroup={workGroup} 
              showDivider={index > 0}
            />
          ))}
          {/* Final divider */}
          <div className="flex h-[9px] items-center justify-center py-1">
            <div className="h-px w-full bg-border" />
          </div>
        </section>
        {/* Back to top button */}
        <div className="mt-16 flex items-center justify-center">
          <Link
            href="#top"
            className="flex h-9 items-center justify-center rounded-[22px] bg-[#f5f5f5] px-4 text-sm font-medium text-muted-foreground transition-opacity hover:opacity-80"
          >
            Back to the top
          </Link>
        </div>
      </div>
    </main>
  )
}

