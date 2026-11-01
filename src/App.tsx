import { CHAPTERS } from './config/chapters'
import { CourseOverview } from './components/CourseOverview'
import { CrewSection } from './components/CrewSection'
import { EnquiryForm } from './components/EnquiryForm'
import { ExperiencesSection } from './components/ExperiencesSection'
import { JourneyChapter } from './components/JourneyChapter'
import { SailingJourney } from './components/SailingJourney'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'

const ch = (i: number) => <JourneyChapter chapter={CHAPTERS[i]} index={i} />

/**
 * One voyage for the whole page: each island chapter is followed by the content it introduces,
 * and the boat docks at the arrival harbour (the contact form) at the very end of the scroll.
 */
export default function App() {
  return (
    <>
      <a className="skip-link" href="#cursuri">Sari la conținut</a>
      <SiteHeader />
      <SailingJourney />
      <main id="top" className="page">
        {ch(0)}
        {ch(1)}
        <CourseOverview />
        {ch(2)}
        {ch(3)}
        <ExperiencesSection />
        {ch(4)}
        <CrewSection />
        <EnquiryForm />
      </main>
      <SiteFooter />
    </>
  )
}
