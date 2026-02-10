import type { MomentCategory } from '../../shared/api';

export type Moment = {
  id: string;
  year: number;
  category: MomentCategory;
  promptTitle: string;
  promptTextRedacted: string;
  revealContext: string;
  revealLink?: string;
};

export const MOMENTS: Moment[] = [
  // ── legendary_comment ──
  {
    id: 'lc-01',
    year: 2009,
    category: 'legendary_comment',
    promptTitle: 'The Most Down-Voted Comment of Its Era',
    promptTextRedacted:
      'A user posted a single-word reply — "________" — to a question about what irritates you about everyday life. It became one of the most down-voted comments at the time, turning into a long-running inside joke.',
    revealContext:
      'User "________" posted the reply "geraffes are so dumb" (misspelling of giraffes) in an AskReddit thread, spawning a legendary meme.',
    revealLink: 'https://www.reddit.com/r/pics/comments/8aqjh/',
  },
  {
    id: 'lc-02',
    year: 2012,
    category: 'legendary_comment',
    promptTitle: 'Every Thread, Every Time',
    promptTextRedacted:
      'A user gave a detailed answer about a medical condition that causes arms to be non-functional. The follow-up from the person asking turned into a phrase repeated on the site for years.',
    revealContext:
      'The "broken arms" AMA became one of Reddit\'s most infamous threads, referenced in almost every comment section for years.',
  },
  {
    id: 'lc-03',
    year: 2014,
    category: 'legendary_comment',
    promptTitle: 'The Rice Rating System',
    promptTextRedacted:
      'A user asked people to suggest unusual food pairings. They then tried each one with a specific staple food and rated them all on a scale of 1–10.',
    revealContext:
      'The "with rice" thread in AskReddit where a user rated every food suggestion with rice, giving us the "X/10, X/10 with rice" meme.',
    revealLink: 'https://www.reddit.com/r/AskReddit/comments/2np694/',
  },
  {
    id: 'lc-04',
    year: 2017,
    category: 'legendary_comment',
    promptTitle: 'The Sense of Pride and Accomplishment',
    promptTextRedacted:
      'A major game studio responded to player complaints about progression mechanics. Their corporate reply became the most down-voted comment in the platform\'s history.',
    revealContext:
      'EA\'s "pride and accomplishment" comment defending Star Wars Battlefront II loot boxes received over 667,000 downvotes, still the all-time record.',
    revealLink:
      'https://www.reddit.com/r/StarWarsBattlefront/comments/7cff0b/',
  },
  {
    id: 'lc-05',
    year: 2010,
    category: 'legendary_comment',
    promptTitle: 'Today You, Tomorrow Me',
    promptTextRedacted:
      'A user shared a story about being stranded on the side of the road. A family of strangers stopped to help them, and the father said something that became one of the most-cited phrases on the site.',
    revealContext:
      'The "Today you, tomorrow me" story about a Mexican family helping a stranger fix a flat tire became one of Reddit\'s most beloved comments.',
    revealLink: 'https://www.reddit.com/r/AskReddit/comments/elal2/',
  },
  {
    id: 'lc-06',
    year: 2011,
    category: 'legendary_comment',
    promptTitle: 'The Museum of Filth',
    promptTextRedacted:
      'A user compiled a list of the most notorious stories ever shared on the platform. The collection became a well-known reference list that new users were warned about.',
    revealContext:
      'The Reddit "Museum of Filth" compiled legendary gross-out stories (Swamps of Dagobah, Jolly Rancher, etc.) into one infamous comment.',
  },
  {
    id: 'lc-07',
    year: 2013,
    category: 'legendary_comment',
    promptTitle: 'The Safe',
    promptTextRedacted:
      'A user found a large locked container in a house they had just moved into. They posted photos and promised to reveal the contents, then disappeared for months.',
    revealContext:
      'The famous Reddit Safe saga — a user found a safe in their new house, the post went massively viral, and the safe was eventually opened (it was empty).',
    revealLink: 'https://www.reddit.com/r/WhatsInThisThing/',
  },

  // ── platform_event ──
  {
    id: 'pe-01',
    year: 2017,
    category: 'platform_event',
    promptTitle: 'A Collaborative Canvas',
    promptTextRedacted:
      'The platform launched a social experiment where every user could place one colored pixel on a shared canvas every few minutes. Factions formed, art was created, and wars were fought over territory.',
    revealContext:
      'The first r/place event in April 2017 let millions of users collaboratively create pixel art on a shared 1000x1000 canvas.',
    revealLink: 'https://www.reddit.com/r/place/',
  },
  {
    id: 'pe-02',
    year: 2022,
    category: 'platform_event',
    promptTitle: 'The Canvas Returns',
    promptTextRedacted:
      'The platform brought back its beloved collaborative pixel art experiment with a much larger canvas. It ran for several days and attracted even more participants than the original.',
    revealContext:
      'r/place returned in 2022 with an expanded canvas, more colors, and massive international coordination between communities.',
  },
  {
    id: 'pe-03',
    year: 2018,
    category: 'platform_event',
    promptTitle: 'Perfectly Balanced',
    promptTextRedacted:
      'Inspired by a popular movie villain\'s philosophy, a community decided to ban exactly half of its subscribers at random. Hundreds of thousands were "snapped" away.',
    revealContext:
      'r/thanosdidnothingwrong banned half its subscribers in "The Snap," inspired by Avengers: Infinity War. Over 300,000 users were banned.',
    revealLink: 'https://www.reddit.com/r/thanosdidnothingwrong/',
  },
  {
    id: 'pe-04',
    year: 2015,
    category: 'platform_event',
    promptTitle: 'The Button',
    promptTextRedacted:
      'On April 1st, the platform launched a social experiment: a 60-second countdown timer with a single button. Users could press it once, resetting the timer. Factions formed based on when you pressed.',
    revealContext:
      'The Button was Reddit\'s 2015 April Fools experiment. Users were categorized by the timer value when they pressed, creating color-coded factions.',
    revealLink: 'https://www.reddit.com/r/thebutton/',
  },
  {
    id: 'pe-05',
    year: 2016,
    category: 'platform_event',
    promptTitle: 'Robin: Group Chat Roulette',
    promptTextRedacted:
      'The platform\'s April Fools experiment paired users in chat rooms that could vote to grow, stay, or abandon. Rooms merged into larger and larger groups.',
    revealContext:
      'Robin was Reddit\'s 2016 April Fools experiment — a chat room game where groups voted to merge, eventually forming massive chat rooms.',
  },
  {
    id: 'pe-06',
    year: 2019,
    category: 'platform_event',
    promptTitle: 'Sequence: A Collaborative Story',
    promptTextRedacted:
      'The platform launched an April Fools experiment where users voted on short video clips to build a collaborative narrative sequence.',
    revealContext:
      'r/sequence was Reddit\'s 2019 April Fools event where users voted on video clips to create a community-driven story.',
  },
  {
    id: 'pe-07',
    year: 2020,
    category: 'platform_event',
    promptTitle: 'Imposter: Social Deduction',
    promptTextRedacted:
      'The platform\'s April experiment asked users to identify which answer to a prompt was written by an AI bot hidden among human responses.',
    revealContext:
      'r/Imposter was Reddit\'s 2020 April Fools event — a social deduction game where users tried to spot the AI-generated answer among human ones.',
  },
  {
    id: 'pe-08',
    year: 2021,
    category: 'platform_event',
    promptTitle: 'Second: The Pixel Game Returns',
    promptTextRedacted:
      'The platform\'s April experiment involved a shared pixel canvas where communities competed to claim territory — but with a twist mechanic that reset areas.',
    revealContext:
      'r/second was Reddit\'s 2021 April Fools event, a variation on the pixel canvas concept with unique gameplay mechanics.',
  },

  // ── meme ──
  {
    id: 'mm-01',
    year: 2012,
    category: 'meme',
    promptTitle: 'The Photogenic Runner',
    promptTextRedacted:
      'A photo from a race went viral showing a runner who looked absurdly good-looking mid-stride. The image spawned hundreds of photoshop edits and meme templates.',
    revealContext:
      'Ridiculously Photogenic Guy (Zeddie Little) was photographed during the 2012 Cooper River Bridge Run, and the image became a massive meme on Reddit.',
  },
  {
    id: 'mm-02',
    year: 2013,
    category: 'meme',
    promptTitle: 'The Confession Animal',
    promptTextRedacted:
      'An image macro meme using a bear became a way for users to confess embarrassing or controversial opinions. One confession about a roommate went viral and sparked real investigations.',
    revealContext:
      'Confession Bear became hugely popular on Reddit\'s AdviceAnimals. One post appeared to confess to murder, leading to media coverage.',
  },
  {
    id: 'mm-03',
    year: 2014,
    category: 'meme',
    promptTitle: 'The Switcharoo Chain',
    promptTextRedacted:
      'A running joke where users deliberately misidentified who or what was being shown in a photo. Each instance linked back to the previous one, forming a chain thousands of links long.',
    revealContext:
      'The "Ah, the ol\' Reddit switcharoo" chain linked thousands of comments where users pretended to misidentify the subject of a photo.',
    revealLink: 'https://www.reddit.com/r/switcharoo/',
  },
  {
    id: 'mm-04',
    year: 2011,
    category: 'meme',
    promptTitle: 'Narwhals at a Specific Time',
    promptTextRedacted:
      'The community adopted a bizarre passphrase involving a marine animal and a time of day as a way to identify fellow users in real life.',
    revealContext:
      '"The narwhal bacons at midnight" became Reddit\'s unofficial real-world identification phrase, widely considered peak early Reddit culture.',
  },
  {
    id: 'mm-05',
    year: 2019,
    category: 'meme',
    promptTitle: 'Area 51 Raid Plan',
    promptTextRedacted:
      'A joke event page suggesting people rush a classified military facility went viral. A dedicated community tracked the "planning" and memed relentlessly about it.',
    revealContext:
      'The "Storm Area 51" meme exploded across Reddit in 2019, with r/memes and others generating enormous amounts of content about the planned "raid."',
  },
  {
    id: 'mm-06',
    year: 2023,
    category: 'meme',
    promptTitle: 'AI-Generated Nonsense',
    promptTextRedacted:
      'A community dedicated to content generated by artificial intelligence produced increasingly absurd and surreal images that became widely shared across the platform.',
    revealContext:
      'Subreddits like r/weirddalle and AI-generated content communities exploded in 2023 as image generation tools became widely accessible.',
  },

  // ── controversy ──
  {
    id: 'cv-01',
    year: 2015,
    category: 'controversy',
    promptTitle: 'The CEO Resignation',
    promptTextRedacted:
      'After a popular employee was fired, the community erupted in protest. Moderators took major subreddits private, and the interim CEO eventually resigned amid the backlash.',
    revealContext:
      'The firing of Victoria Taylor led to the 2015 Reddit Blackout. CEO Ellen Pao resigned shortly after, though later revealed she had opposed the firing.',
  },
  {
    id: 'cv-02',
    year: 2023,
    category: 'controversy',
    promptTitle: 'The API Pricing Protest',
    promptTextRedacted:
      'The platform announced major pricing changes to its developer tools, which would effectively shut down popular third-party mobile apps. Thousands of communities went dark in protest.',
    revealContext:
      'Reddit\'s 2023 API pricing changes led to a massive subreddit blackout protest and the shutdown of beloved apps like Apollo, RIF, and others.',
  },
  {
    id: 'cv-03',
    year: 2013,
    category: 'controversy',
    promptTitle: 'The Misidentified Suspect',
    promptTextRedacted:
      'After a major real-world tragedy, the community attempted to identify suspects using publicly available photos. They wrongly accused an innocent person who had gone missing.',
    revealContext:
      'During the Boston Marathon bombing investigation, Reddit users wrongly identified Sunil Tripathi as a suspect. He was later found deceased, unrelated to the bombing.',
  },
  {
    id: 'cv-04',
    year: 2014,
    category: 'controversy',
    promptTitle: 'The Leaked Photos Scandal',
    promptTextRedacted:
      'Private photos of celebrities were stolen and shared widely on the platform. The community hosting them was eventually banned after significant media pressure.',
    revealContext:
      'The "Fappening" involved stolen celebrity photos shared via Reddit. The hosting subreddit was banned after public outcry and legal pressure.',
  },

  // ── subreddit_moment ──
  {
    id: 'sm-01',
    year: 2021,
    category: 'subreddit_moment',
    promptTitle: 'Retail Traders vs. Wall Street',
    promptTextRedacted:
      'A community of amateur stock traders collectively invested in a struggling retail company, driving its price up dramatically and causing billions in losses for institutional short sellers.',
    revealContext:
      'r/wallstreetbets drove the GameStop (GME) short squeeze in January 2021, causing massive losses for hedge funds and mainstream media frenzy.',
    revealLink: 'https://www.reddit.com/r/wallstreetbets/',
  },
  {
    id: 'sm-02',
    year: 2009,
    category: 'subreddit_moment',
    promptTitle: 'The Original Ask Community',
    promptTextRedacted:
      'One of the platform\'s most popular communities for open-ended questions was created, eventually becoming a default destination for millions of users sharing stories and opinions.',
    revealContext:
      'r/AskReddit became one of the largest and most active subreddits, driving much of Reddit\'s comment culture from its early days.',
  },
  {
    id: 'sm-03',
    year: 2013,
    category: 'subreddit_moment',
    promptTitle: 'Celebrity Q&A Goes Wrong',
    promptTextRedacted:
      'A major celebrity did a Q&A session to promote a new project. They gave short, dismissive answers and kept redirecting to their project, angering the community.',
    revealContext:
      'Woody Harrelson\'s AMA became infamous when he only wanted to discuss his movie "Rampart" and ignored community questions.',
  },
  {
    id: 'sm-04',
    year: 2012,
    category: 'subreddit_moment',
    promptTitle: 'The Unexpected Presidential Q&A',
    promptTextRedacted:
      'A sitting world leader did a surprise Q&A session, breaking platform records for concurrent users and crashing the site temporarily.',
    revealContext:
      'President Obama\'s AMA in August 2012 crashed Reddit\'s servers and became one of the most upvoted posts of its era.',
    revealLink: 'https://www.reddit.com/r/IAmA/comments/z1c9z/',
  },
  {
    id: 'sm-05',
    year: 2016,
    category: 'subreddit_moment',
    promptTitle: 'No Sleep for Horror Fans',
    promptTextRedacted:
      'A community dedicated to original horror fiction reached mainstream recognition, with several stories being optioned for TV and film adaptations.',
    revealContext:
      'r/nosleep grew into a major creative writing community. Stories like "Penpal" were published as books and others were adapted for the "Channel Zero" TV series.',
  },
  {
    id: 'sm-06',
    year: 2020,
    category: 'subreddit_moment',
    promptTitle: 'Among Us Takes Over',
    promptTextRedacted:
      'A social deduction game from 2018 suddenly exploded in popularity, dominating the platform\'s gaming communities with memes, clips, and fan art.',
    revealContext:
      'Among Us became a cultural phenomenon in 2020, with r/AmongUs growing rapidly and "sus" entering everyday internet vocabulary.',
  },
  {
    id: 'sm-07',
    year: 2024,
    category: 'subreddit_moment',
    promptTitle: 'The IPO Frenzy',
    promptTextRedacted:
      'The platform itself went public on the stock market, and its own user communities were split between celebrating and protesting the move.',
    revealContext:
      'Reddit\'s IPO in March 2024 was heavily discussed on subreddits like r/wallstreetbets, with users both investing in and criticizing the offering.',
  },

  // ── product_feature ──
  {
    id: 'pf-01',
    year: 2017,
    category: 'product_feature',
    promptTitle: 'Profile Pages and Following',
    promptTextRedacted:
      'The platform introduced user profile pages and a following system, moving slightly toward a social-media feel. The community had mixed reactions.',
    revealContext:
      'Reddit launched user profile pages in 2017, allowing users to post directly to their profiles — a controversial move toward social media norms.',
  },
  {
    id: 'pf-02',
    year: 2018,
    category: 'product_feature',
    promptTitle: 'The Redesign',
    promptTextRedacted:
      'The platform launched a major visual overhaul after years of the same look. Many long-time users were unhappy and continued using the old version.',
    revealContext:
      'Reddit\'s 2018 redesign replaced the classic UI. Many users switched to old.reddit.com, which remains available to this day.',
  },
  {
    id: 'pf-03',
    year: 2020,
    category: 'product_feature',
    promptTitle: 'Live Audio Rooms',
    promptTextRedacted:
      'Following a trend started by another app, the platform added live audio conversation rooms where users could join and talk in real time.',
    revealContext:
      'Reddit Talk launched as Reddit\'s answer to Clubhouse, allowing subreddit moderators to host live audio conversations.',
  },
  {
    id: 'pf-04',
    year: 2010,
    category: 'product_feature',
    promptTitle: 'Premium Membership Launches',
    promptTextRedacted:
      'The platform introduced a premium membership that gave users special features and an ad-free experience. Purchasing it for others became a way to reward great posts.',
    revealContext:
      'Reddit Gold launched in 2010, allowing users to "gild" posts and comments. It was later rebranded to Reddit Premium with coins and awards.',
  },
  {
    id: 'pf-05',
    year: 2016,
    category: 'product_feature',
    promptTitle: 'The Official Mobile App',
    promptTextRedacted:
      'The platform released its own mobile app for the first time, offering free premium membership to early adopters. Third-party apps had dominated mobile access until then.',
    revealContext:
      'Reddit launched its official mobile app in 2016, giving 3 months of Gold to early downloaders. Apps like Alien Blue (acquired by Reddit) paved the way.',
  },
  {
    id: 'pf-06',
    year: 2022,
    category: 'product_feature',
    promptTitle: 'Collectible Digital Avatars',
    promptTextRedacted:
      'The platform introduced blockchain-based collectible profile pictures that users could buy, trade, and display. The rollout was met with both enthusiasm and skepticism.',
    revealContext:
      'Reddit launched Collectible Avatars (NFTs) in July 2022, later distributing free ones widely. Despite initial backlash, millions were claimed.',
  },
  {
    id: 'pf-07',
    year: 2023,
    category: 'product_feature',
    promptTitle: 'Contributor Points Sunset',
    promptTextRedacted:
      'The platform discontinued a community-specific token system that had been running as a limited experiment in select communities.',
    revealContext:
      'Reddit shut down Community Points (including r/CryptoCurrency\'s MOONs) in 2023, ending its blockchain-based community token experiment.',
  },
  {
    id: 'pf-08',
    year: 2024,
    category: 'product_feature',
    promptTitle: 'Developer Platform Goes Wide',
    promptTextRedacted:
      'The platform expanded its developer tools program, allowing anyone to build interactive experiences that live inside posts and communities.',
    revealContext:
      'Reddit\'s Developer Platform (Devvit) opened broadly in 2024, enabling community-built apps, games, and interactive experiences within Reddit.',
  },
];

// Quick lookup map
const MOMENTS_MAP = new Map<string, Moment>(MOMENTS.map((m) => [m.id, m]));

export function getMomentById(id: string): Moment | undefined {
  return MOMENTS_MAP.get(id);
}

export function getAllMomentIds(): string[] {
  return MOMENTS.map((m) => m.id);
}
