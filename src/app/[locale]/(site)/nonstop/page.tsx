// TRIAL: the home page with no stops in the flight, to compare one continuous
// scrub against the stop-to-stop flight. SeeWingsExperience switches off its
// stops when it finds itself on this path. Remove once that's settled.
import HomePage from '../page';

export const dynamic = 'force-dynamic';

// A trial of the home page under another URL: kept out of search results.
export const metadata: import('next').Metadata = { robots: { index: false, follow: false } };

export default HomePage;
