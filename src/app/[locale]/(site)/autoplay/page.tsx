// TRIAL: the home page with the flight playing by itself, start to end, no
// scroll control and no stops. SeeWingsExperience switches to autoplay when it
// finds itself on this path. Remove once that's settled.
import HomePage from '../page';

export const dynamic = 'force-dynamic';

// A trial of the home page under another URL: kept out of search results.
export const metadata: import('next').Metadata = { robots: { index: false, follow: false } };

export default HomePage;
