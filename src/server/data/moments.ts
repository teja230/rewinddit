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
  // ═══════════════════════════════════════
  // ── legendary_comment (12) ──
  // ═══════════════════════════════════════
  {
    id: 'lc-01',
    year: 2009,
    category: 'legendary_comment',
    promptTitle: 'Stupid Long Horses',
    promptTextRedacted:
      'A user posted a comment about a photo of a tall animal, hilariously misspelling its name. The community piled on downvotes, and the edit history became an all-time classic.',
    revealContext:
      '"geraffes are so dumb" — a user\'s misspelling of giraffes in r/pics became legendary. Their increasingly defensive edits made it even funnier.',
    revealLink: 'https://www.reddit.com/r/pics/comments/8aqjh/',
  },
  {
    id: 'lc-03',
    year: 2014,
    category: 'legendary_comment',
    promptTitle: 'The Rice Rating System',
    promptTextRedacted:
      'A user asked people to suggest unusual food pairings. They tried each one with a specific staple food and rated them all, creating one of the most wholesome threads ever.',
    revealContext:
      'The "with rice" thread in r/AskReddit where a user rated every food suggestion with rice — giving us the "X/10, X/10 with rice, thank you for your suggestion" meme.',
    revealLink: 'https://www.reddit.com/r/AskReddit/comments/2np694/',
  },
  {
    id: 'lc-04',
    year: 2017,
    category: 'legendary_comment',
    promptTitle: 'Pride and Accomplishment',
    promptTextRedacted:
      'A major game studio responded to player complaints about unlock mechanics. Their corporate PR reply became the most down-voted comment in the platform\'s entire history.',
    revealContext:
      'EA\'s "pride and accomplishment" comment defending Star Wars Battlefront II loot boxes received over 667,000 downvotes — still the all-time record by a massive margin.',
    revealLink: 'https://www.reddit.com/r/StarWarsBattlefront/comments/7cff0b/',
  },
  {
    id: 'lc-05',
    year: 2010,
    category: 'legendary_comment',
    promptTitle: 'Today You, Tomorrow Me',
    promptTextRedacted:
      'A user shared a story about being stranded on the road. A family of strangers stopped to help, and the father said something that became one of the most-cited phrases on the platform.',
    revealContext:
      '"Today you, tomorrow me" — a Mexican family helped a stranded stranger fix a flat tire, sharing food and refusing payment. Widely considered the most heartwarming comment ever posted.',
    revealLink: 'https://www.reddit.com/r/AskReddit/comments/elal2/',
  },
  {
    id: 'lc-07',
    year: 2013,
    category: 'legendary_comment',
    promptTitle: 'The Safe',
    promptTextRedacted:
      'A user found a mysterious large locked container in a house they\'d just moved into. They posted photos, promised to reveal the contents — then vanished for months. The entire platform was obsessed.',
    revealContext:
      'The Reddit Safe saga captivated millions. After months of waiting, a different user finally opened it — and it was completely empty. The anticlimax became legendary in itself.',
    revealLink: 'https://www.reddit.com/r/WhatsInThisThing/',
  },
  {
    id: 'lc-08',
    year: 2016,
    category: 'legendary_comment',
    promptTitle: 'The Singer Gets a Taste of His Own Medicine',
    promptTextRedacted:
      'A famous musician did a Q&A session. A user linked them to a specific video as a reply — and the artist unknowingly clicked it, falling for the very internet prank they made famous.',
    revealContext:
      'Rick Astley did an AMA on r/Music and got rickrolled by a user who disguised a link to "Never Gonna Give You Up." Even Rick fell for it.',
    revealLink: 'https://www.reddit.com/r/Music/comments/56cdgm/',
  },
  {
    id: 'lc-10',
    year: 2015,
    category: 'legendary_comment',
    promptTitle: 'The Jumper Cables Guy',
    promptTextRedacted:
      'A user became famous for posting normal-seeming stories that always ended with the same absurd punchline about their father and a specific item used for punishment. They appeared in random threads for months.',
    revealContext:
      'u/rogersimon10 posted comments that always ended with "my dad beat me with jumper cables." The recurring gag in random threads made them a Reddit celebrity.',
  },
  {
    id: 'lc-11',
    year: 2015,
    category: 'legendary_comment',
    promptTitle: 'The Fastest Plane Story',
    promptTextRedacted:
      'A former military pilot shared an increasingly dramatic story about requesting speed checks from air traffic control, one-upping every other aircraft until the punchline. It became the most-reposted story on the platform.',
    revealContext:
      'The SR-71 Blackbird "ground speed check" story — a pilot requests a speed check, flexes on slower aircraft, and delivers the ultimate punchline. Reposted thousands of times across Reddit.',
    revealLink: 'https://www.reddit.com/r/SR71/',
  },
  {
    id: 'lc-12',
    year: 2013,
    category: 'legendary_comment',
    promptTitle: 'Maximum Laziness',
    promptTextRedacted:
      'In a thread asking about the laziest thing anyone had ever done, a user shared a story about being on a Navy ship and using an incredibly creative method to avoid a minor physical task. The story became legendary.',
    revealContext:
      'A Navy sailor threw his trash out a porthole to avoid walking to the trash can, prompting an investigation into who was littering from the ship. The r/AskReddit response became iconic.',
    revealLink: 'https://www.reddit.com/r/AskReddit/comments/1rgpdf/',
  },

  // ═══════════════════════════════════════
  // ── platform_event (8) ──
  // ═══════════════════════════════════════
  {
    id: 'pe-01',
    year: 2017,
    category: 'platform_event',
    promptTitle: 'A Collaborative Canvas',
    promptTextRedacted:
      'The platform launched a social experiment where every user could place one colored pixel on a shared canvas every few minutes. Factions formed, art was created, and wars were fought over territory.',
    revealContext:
      'The first r/place event in April 2017 let millions of users collaboratively create pixel art on a shared 1000x1000 canvas. It became one of Reddit\'s most iconic experiments.',
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
    revealLink: 'https://www.reddit.com/r/place/',
  },
  {
    id: 'pe-03',
    year: 2018,
    category: 'platform_event',
    promptTitle: 'Perfectly Balanced',
    promptTextRedacted:
      'Inspired by a popular movie villain\'s philosophy, a community decided to ban exactly half of its subscribers at random. Hundreds of thousands were "snapped" away.',
    revealContext:
      'r/thanosdidnothingwrong banned half its subscribers in "The Snap," inspired by Avengers: Infinity War. Over 300,000 users were banned in one event.',
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
      'The Button was Reddit\'s 2015 April Fools experiment. Users were categorized by the timer value when they pressed, creating color-coded factions and an entire mythology.',
    revealLink: 'https://www.reddit.com/r/thebutton/',
  },
  {
    id: 'pe-05',
    year: 2013,
    category: 'platform_event',
    promptTitle: 'Orangered vs. Periwinkle',
    promptTextRedacted:
      'On April 1st, every user was randomly assigned to one of two color-based teams. Items and weapons appeared that could affect other users\' posts. Total chaos ensued across the entire platform.',
    revealContext:
      'Reddit\'s 2013 April Fools event split all users into Team Orangered and Team Periwinkle for a site-wide battle with hats and weapons that distorted comments and posts.',
  },
  {
    id: 'pe-06',
    year: 2023,
    category: 'platform_event',
    promptTitle: 'The Canvas: Third Time',
    promptTextRedacted:
      'The beloved pixel art experiment returned for a third time. This time, communities coordinated across multiple platforms and time zones to protect their creations around the clock.',
    revealContext:
      'r/place 2023 was the third iteration. Communities used Discord bots and overlay tools for pixel-perfect coordination, making it the most organized version yet.',
    revealLink: 'https://www.reddit.com/r/place/',
  },
  {
    id: 'pe-07',
    year: 2010,
    category: 'platform_event',
    promptTitle: 'The Great Migration',
    promptTextRedacted:
      'A competing platform launched a deeply unpopular redesign, causing a mass exodus of users to this platform. The influx permanently changed the community\'s culture and size.',
    revealContext:
      'The Great Digg Migration happened when Digg v4 launched in 2010. Millions of users abandoned Digg for Reddit, transforming Reddit from a niche site into a mainstream platform.',
  },
  {
    id: 'pe-08',
    year: 2017,
    category: 'platform_event',
    promptTitle: 'Battle for the Net',
    promptTextRedacted:
      'The platform\'s front page was dominated by a single issue for days as nearly every major community rallied to defend an important internet policy. The coordinated campaign made international news.',
    revealContext:
      'Reddit\'s Net Neutrality campaign in 2017 saw nearly every subreddit coordinating to protest the FCC\'s proposed repeal. The front page was solid activism for days.',
    revealLink: 'https://www.reddit.com/r/blog/comments/6mtgtp/',
  },

  // ═══════════════════════════════════════
  // ── meme (10) ──
  // ═══════════════════════════════════════
  {
    id: 'mm-01',
    year: 2012,
    category: 'meme',
    promptTitle: 'The Photogenic Runner',
    promptTextRedacted:
      'A photo from a race went viral showing a runner who looked absurdly good-looking mid-stride. The image spawned hundreds of photoshop edits and meme templates.',
    revealContext:
      'Ridiculously Photogenic Guy (Zeddie Little) was photographed during the 2012 Cooper River Bridge Run. The image became a massive meme template on Reddit and beyond.',
  },
  {
    id: 'mm-02',
    year: 2013,
    category: 'meme',
    promptTitle: 'The Confession Animal',
    promptTextRedacted:
      'An image macro using a bear became the go-to way for users to confess embarrassing or controversial opinions. One confession went so dark it sparked real-world investigations.',
    revealContext:
      'Confession Bear peaked on Reddit\'s r/AdviceAnimals. One post appeared to confess to murder, attracting media coverage and debate about whether it was real.',
    revealLink: 'https://www.reddit.com/r/AdviceAnimals/comments/1btuzb/',
  },
  {
    id: 'mm-03',
    year: 2014,
    category: 'meme',
    promptTitle: 'The Switcharoo Chain',
    promptTextRedacted:
      'A running joke where users deliberately misidentified the subject of a photo. Each instance linked to the previous one, forming an unbroken chain thousands of links long.',
    revealContext:
      '"Ah, the ol\' Reddit switcharoo" — a chain of linked comments where users pretended to misidentify photo subjects. The chain spans years and thousands of entries.',
    revealLink: 'https://www.reddit.com/r/switcharoo/',
  },
  {
    id: 'mm-04',
    year: 2011,
    category: 'meme',
    promptTitle: 'Narwhals at a Specific Time',
    promptTextRedacted:
      'The community adopted a bizarre passphrase involving a marine animal and a specific time of day as a secret handshake to identify fellow users in the real world.',
    revealContext:
      '"The narwhal bacons at midnight" — Reddit\'s unofficial real-world identification phrase. Widely considered the peak (and cringe) of early Reddit culture.',
  },
  {
    id: 'mm-05',
    year: 2019,
    category: 'meme',
    promptTitle: 'Raid the Base',
    promptTextRedacted:
      'A joke event page suggesting people rush a classified military facility went viral. The platform memed relentlessly about it, and a handful of people actually showed up in the desert.',
    revealContext:
      '"Storm Area 51, They Can\'t Stop All of Us" exploded across Reddit in 2019. r/memes generated enormous amounts of content, and about 150 people actually showed up in Nevada.',
  },
  {
    id: 'mm-06',
    year: 2013,
    category: 'meme',
    promptTitle: 'Sarcastic Self-Congratulation',
    promptTextRedacted:
      'After a community\'s amateur investigation went horribly wrong, the sarcastic celebration phrase used afterward became one of the platform\'s most enduring self-deprecating memes.',
    revealContext:
      '"We did it Reddit!" became a sarcastic catchphrase after the Boston bombing misidentification. It\'s still used whenever the community prematurely celebrates something.',
  },
  {
    id: 'mm-07',
    year: 2012,
    category: 'meme',
    promptTitle: 'The Universal Scale',
    promptTextRedacted:
      'A user posted a photo with a yellow fruit placed next to an object to show its size. The community latched onto this as the only acceptable unit of measurement on the platform.',
    revealContext:
      '"Banana for scale" originated from an Imgur/Reddit post and became the platform\'s universal measurement standard. Any photo needing size context got requests for a banana.',
  },
  {
    id: 'mm-08',
    year: 2017,
    category: 'meme',
    promptTitle: 'NEXT!',
    promptTextRedacted:
      'A screenshot from a community group showed a person requesting free transportation for 20 people, then rudely dismissing every helpful suggestion with a single-word reply. The post defined an entire genre.',
    revealContext:
      'The "NEXT!" choosy beggar demanded free airport transport for 20 people and rejected every offer. Her aggressive "NEXT!" replies became the mascot of r/ChoosingBeggars.',
    revealLink: 'https://www.reddit.com/r/ChoosingBeggars/comments/7kr5as/',
  },
  {
    id: 'mm-09',
    year: 2017,
    category: 'meme',
    promptTitle: 'To Be Fair...',
    promptTextRedacted:
      'A user posted an earnest defense of a popular animated show, claiming you need a very high IQ to appreciate it. The post was so pretentious it became one of the most-copied pastas on the internet.',
    revealContext:
      '"To be fair, you have to have a very high IQ to understand Rick and Morty" — the ultimate copypasta. Originally posted sincerely, it became the go-to parody of intellectual gatekeeping.',
  },
  {
    id: 'mm-10',
    year: 2013,
    category: 'meme',
    promptTitle: 'The Gratitude Edit',
    promptTextRedacted:
      'A specific phrase that users would add when their comment received a premium award became so ubiquitous and mocked that the community eventually turned against anyone who used it.',
    revealContext:
      '"Edit: Thanks for the gold, kind stranger!" became so overused that it spawned r/AwardSpeechEdits dedicated to mocking it. The backlash made it a meme in itself.',
    revealLink: 'https://www.reddit.com/r/AwardSpeechEdits/',
  },

  // ═══════════════════════════════════════
  // ── controversy (8) ──
  // ═══════════════════════════════════════
  {
    id: 'cv-01',
    year: 2015,
    category: 'controversy',
    promptTitle: 'The CEO Resignation',
    promptTextRedacted:
      'After a popular employee was fired, the community erupted in protest. Moderators took major communities private, and the interim CEO eventually resigned amid the backlash.',
    revealContext:
      'The firing of Victoria Taylor led to the 2015 Reddit Blackout. CEO Ellen Pao resigned shortly after, though she later revealed she had actually opposed the firing.',
    revealLink: 'https://www.reddit.com/r/OutOfTheLoop/comments/3bxduw/',
  },
  {
    id: 'cv-02',
    year: 2023,
    category: 'controversy',
    promptTitle: 'The API Pricing Protest',
    promptTextRedacted:
      'The platform announced major pricing changes to its developer tools, effectively shutting down popular third-party mobile apps. Thousands of communities went dark in the largest protest ever.',
    revealContext:
      'Reddit\'s 2023 API pricing changes led to a massive subreddit blackout and the death of beloved apps like Apollo, Reddit is Fun, and Sync.',
    revealLink: 'https://www.reddit.com/r/Save3rdPartyApps/',
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
    id: 'cv-05',
    year: 2016,
    category: 'controversy',
    promptTitle: 'The Admin Who Edited Comments',
    promptTextRedacted:
      'The platform\'s CEO was caught secretly editing user comments in a controversial community, replacing mentions of his username with moderators\' names. Trust in the platform was shaken.',
    revealContext:
      'CEO Steve Huffman (u/spez) admitted to editing comments in r/the_donald that mentioned his username, sparking a massive trust crisis and the ongoing "f*ck u/spez" meme.',
    revealLink: 'https://www.reddit.com/r/announcements/comments/5frg1n/',
  },
  {
    id: 'cv-06',
    year: 2012,
    category: 'controversy',
    promptTitle: 'The Unmasked Moderator',
    promptTextRedacted:
      'A journalist revealed the real-world identity of a prolific moderator who ran some of the platform\'s most controversial communities. The resulting debate about anonymity vs. accountability divided users.',
    revealContext:
      'Gawker journalist Adrian Chen unmasked u/violentacrez, moderator of several controversial subreddits. Reddit briefly banned Gawker links, sparking a major free speech vs. accountability debate.',
  },
  {
    id: 'cv-07',
    year: 2013,
    category: 'controversy',
    promptTitle: 'Losing a Champion',
    promptTextRedacted:
      'The platform mourned one of its co-founders, a young tech activist who had fought for internet freedom. His passing at age 26 sparked conversations about justice, mental health, and digital rights.',
    revealContext:
      'Aaron Swartz, Reddit co-founder and internet freedom activist, died by suicide in January 2013 while facing federal charges for downloading academic papers. His loss deeply affected the community.',
    revealLink: 'https://www.reddit.com/r/blog/comments/16p1ys/',
  },
  {
    id: 'cv-08',
    year: 2013,
    category: 'controversy',
    promptTitle: 'The Fake Celebrity Q&A',
    promptTextRedacted:
      'A famous actor did a Q&A that was so obviously handled by a PR team — with a badly photoshopped proof photo — that the community revolted. The backlash made it one of the worst Q&As in history.',
    revealContext:
      'Morgan Freeman\'s AMA was widely believed to be answered by a PR rep. The proof photo appeared to show him asleep with a paper on his chest. Answers were generic and the community was furious.',
    revealLink: 'https://www.reddit.com/r/IAmA/comments/1c5zxh/',
  },

  // ═══════════════════════════════════════
  // ── subreddit_moment (14) ──
  // ═══════════════════════════════════════
  {
    id: 'sm-01',
    year: 2021,
    category: 'subreddit_moment',
    promptTitle: 'Retail Traders vs. Wall Street',
    promptTextRedacted:
      'A community of amateur stock traders collectively invested in a struggling retail company, driving its price up dramatically and causing billions in losses for institutional short sellers.',
    revealContext:
      'r/wallstreetbets drove the GameStop (GME) short squeeze in January 2021, causing massive hedge fund losses and becoming international front-page news.',
    revealLink: 'https://www.reddit.com/r/wallstreetbets/',
  },
  {
    id: 'sm-02',
    year: 2012,
    category: 'subreddit_moment',
    promptTitle: 'Let\'s Talk About Rampart',
    promptTextRedacted:
      'A major celebrity did a Q&A to promote a new project but gave short, dismissive answers and kept redirecting every question back to their project. The community was not amused.',
    revealContext:
      'Woody Harrelson\'s AMA became infamous when he only wanted to discuss his movie "Rampart" and ignored questions. "Let\'s focus on Rampart" became a meme for bad PR.',
    revealLink: 'https://www.reddit.com/r/IAmA/comments/p9a1v/',
  },
  {
    id: 'sm-03',
    year: 2012,
    category: 'subreddit_moment',
    promptTitle: 'The Presidential Q&A',
    promptTextRedacted:
      'A sitting world leader did a surprise Q&A session, breaking every record for concurrent users and temporarily crashing the entire platform under the traffic.',
    revealContext:
      'President Obama\'s AMA in August 2012 crashed Reddit\'s servers and became one of the highest-upvoted posts of its era. He answered questions for about 30 minutes.',
    revealLink: 'https://www.reddit.com/r/IAmA/comments/z1c9z/',
  },
  {
    id: 'sm-04',
    year: 2024,
    category: 'subreddit_moment',
    promptTitle: 'The IPO Frenzy',
    promptTextRedacted:
      'The platform itself went public on the stock market. Its own user communities were split between buying shares, protesting the move, and making memes about it.',
    revealContext:
      'Reddit\'s IPO in March 2024 was heavily discussed on r/wallstreetbets and r/stocks. The company was valued at ~$6.4 billion on its first day of trading.',
  },
  {
    id: 'sm-05',
    year: 2014,
    category: 'subreddit_moment',
    promptTitle: 'The Beloved Biologist Gets Banned',
    promptTextRedacted:
      'A hugely popular science commenter was caught using multiple accounts to upvote their own comments and downvote rivals. Their sudden ban shocked the entire community.',
    revealContext:
      'Unidan, beloved for enthusiastic biology comments, was banned for vote manipulation using alt accounts. The "jackdaw vs crow" argument that exposed it became legendary.',
    revealLink: 'https://www.reddit.com/r/SubredditDrama/comments/2c9ida/',
  },
  {
    id: 'sm-06',
    year: 2013,
    category: 'subreddit_moment',
    promptTitle: 'The Name Swap',
    promptTextRedacted:
      'A community about a recreational plant had its obvious name taken. Enthusiasts of the actual plant had to create a hilariously long-named alternative. Both communities leaned hard into the joke.',
    revealContext:
      'r/trees is about marijuana while r/marijuanaenthusiasts is about actual trees. The name swap became one of Reddit\'s most beloved and long-running inside jokes.',
    revealLink: 'https://www.reddit.com/r/marijuanaenthusiasts/',
  },
  {
    id: 'sm-07',
    year: 2017,
    category: 'subreddit_moment',
    promptTitle: 'The Prequel Takeover',
    promptTextRedacted:
      'A community dedicated to a divisive movie trilogy developed such a passionate meme culture that their content regularly dominated the front page. Their catchphrases entered mainstream internet vocabulary.',
    revealContext:
      'r/PrequelMemes turned Star Wars prequel dialogue into an art form. "Hello there," "I have the high ground," and "It\'s treason then" became inescapable across all of Reddit.',
    revealLink: 'https://www.reddit.com/r/PrequelMemes/',
  },
  {
    id: 'sm-08',
    year: 2012,
    category: 'subreddit_moment',
    promptTitle: 'The Chillest Celebrity Q&A',
    promptTextRedacted:
      'A famous rapper did a Q&A that was hilariously casual and genuinely fun. He used creative spelling, answered nearly everything, and became one of the platform\'s favorite celebrity guests.',
    revealContext:
      'Snoop Dogg\'s (then Snoop Lion) AMA was legendary for its authenticity. He answered hundreds of questions, his spelling was iconic ("81 blunts a day neffew"), and he became a Reddit regular.',
    revealLink: 'https://www.reddit.com/r/IAmA/comments/14cb0c/',
  },
  {
    id: 'sm-09',
    year: 2016,
    category: 'subreddit_moment',
    promptTitle: 'The Debate Star',
    promptTextRedacted:
      'A man wearing a distinctive red sweater became an instant celebrity after asking a question during a presidential debate. He did a Q&A the next day, but his post history was then scrutinized.',
    revealContext:
      'Ken Bone became an overnight sensation after the 2016 presidential debate. His AMA was popular, but users discovered his Reddit history under his real username, creating awkward headlines.',
    revealLink: 'https://www.reddit.com/r/IAmA/comments/57dw9a/',
  },
  {
    id: 'sm-10',
    year: 2019,
    category: 'subreddit_moment',
    promptTitle: 'Stay Hydrated',
    promptTextRedacted:
      'A popular community promoting water consumption was banned due to its offensive name. It was immediately reborn under a family-friendly name and became even more popular.',
    revealContext:
      'r/waterniggas was banned in 2019 for its name. It was reborn as r/HydroHomies, which grew even larger and became a wholesome meme community promoting hydration.',
    revealLink: 'https://www.reddit.com/r/HydroHomies/',
  },
  {
    id: 'sm-11',
    year: 2022,
    category: 'subreddit_moment',
    promptTitle: 'The Marinara Flag',
    promptTextRedacted:
      'A user in a relationship advice community used a hilariously wrong food-based term instead of the correct phrase for a warning sign. The mistake went so viral it was adopted as official community slang.',
    revealContext:
      'A user on r/AmItheAsshole wrote "marinara flag" instead of "red flag." The community loved it so much that marinara flag (red) and pesto flag (green) became actual subreddit terminology.',
  },
  {
    id: 'sm-12',
    year: 2013,
    category: 'subreddit_moment',
    promptTitle: 'The Unhinged Baseball Star',
    promptTextRedacted:
      'A former professional athlete did a Q&A that went completely off the rails. Their bizarre, unfiltered answers about time travel, aliens, and personal grudges made it an all-time classic.',
    revealContext:
      'Jose Canseco\'s AMA was hilariously unhinged — he discussed time travel, claimed to have evidence of aliens, and answered questions with wild sincerity. It\'s considered peak AMA entertainment.',
    revealLink: 'https://www.reddit.com/r/IAmA/comments/1clw9o/',
  },
  {
    id: 'sm-13',
    year: 2023,
    category: 'subreddit_moment',
    promptTitle: 'The Most Hated Celebrity Q&A',
    promptTextRedacted:
      'A talk show host attempted a Q&A session but was met with overwhelmingly hostile questions about their alleged rude behavior in real life. Nearly every response was a complaint or insult.',
    revealContext:
      'James Corden\'s AMA became a roast session. Users flooded it with stories of his rude behavior. The ratio of hostile to friendly questions made it one of the most brutal AMAs ever.',
    revealLink: 'https://www.reddit.com/r/IAmA/comments/bqy5zf/',
  },
  {
    id: 'sm-14',
    year: 2020,
    category: 'subreddit_moment',
    promptTitle: 'Live on Camera',
    promptTextRedacted:
      'During a period when millions were working from home, a user accidentally went viral on a platform livestream for an embarrassing incident visible to their entire community.',
    revealContext:
      'Reddit Public Access Network (RPAN) launched during COVID lockdowns and became a hub for unexpected viral moments, from musicians to pets to accidental broadcasts.',
    revealLink: 'https://www.reddit.com/r/pan/',
  },

  // ═══════════════════════════════════════
  // ── viral_post (20) ──
  // ═══════════════════════════════════════
  {
    id: 'vp-01',
    year: 2009,
    category: 'viral_post',
    promptTitle: 'Please Ignore This Post',
    promptTextRedacted:
      'A user made a mundane two-word administrative post with a simple request. The community did the exact opposite, upvoting it to the top purely out of defiance.',
    revealContext:
      '"test post please ignore" by u/qgyh2 became one of Reddit\'s most upvoted posts ever — the community upvoted it specifically because it asked them not to.',
    revealLink: 'https://www.reddit.com/r/pics/comments/92dd8/',
  },
  {
    id: 'vp-02',
    year: 2017,
    category: 'viral_post',
    promptTitle: 'A Dark Choice',
    promptTextRedacted:
      'In a thread asking users who they\'d choose to be with if they could pick anyone, one user gave a hilariously dark reply about another commenter\'s deceased spouse. It became one of the most-awarded comments ever.',
    revealContext:
      '"I also choose this guy\'s dead wife" — a perfectly timed dark joke in an otherwise wholesome AskReddit thread. It became one of Reddit\'s most legendary one-liner comments.',
    revealLink: 'https://www.reddit.com/r/AskReddit/comments/5c79n0/',
  },
  {
    id: 'vp-04',
    year: 2014,
    category: 'viral_post',
    promptTitle: 'The World\'s Dumbest Student',
    promptTextRedacted:
      'A teacher shared a detailed story about their most clueless student ever. The student didn\'t know cats and dogs were different animals, thought you could photocopy money, and much more.',
    revealContext:
      'The legendary "Kevin" story from r/AskReddit listed dozens of impossibly stupid things one student did. "Kevin" became Reddit slang for someone incredibly unintelligent.',
    revealLink: 'https://www.reddit.com/r/AskReddit/comments/219w2o/',
  },
  {
    id: 'vp-05',
    year: 2012,
    category: 'viral_post',
    promptTitle: 'The Greatest Name Ever Given',
    promptTextRedacted:
      'In a thread asking for the best name for a child, a user wrote an entire short story about a boy with an absurd name who lived an impossibly epic life from birth to legend.',
    revealContext:
      '"Streetlamp Le Moose" — a full short story written in an AskReddit thread about a character with a ridiculous name who became universally beloved. One of Reddit\'s greatest creative writing moments.',
    revealLink: 'https://www.reddit.com/r/AskReddit/comments/jlao6/',
  },
  {
    id: 'vp-06',
    year: 2014,
    category: 'viral_post',
    promptTitle: 'The Perfect Pun',
    promptTextRedacted:
      'In a philosophy-themed thread, a user delivered a pun involving a famous philosopher and a horse so perfectly crafted it was widely voted the best wordplay in the platform\'s entire history.',
    revealContext:
      '"Putting Descartes before the horse" — a play on "putting the cart before the horse" in a philosophy discussion. Widely considered Reddit\'s single greatest pun.',
  },
  {
    id: 'vp-10',
    year: 2012,
    category: 'viral_post',
    promptTitle: 'The Accidental Insult',
    promptTextRedacted:
      'A user shared a story about trying to say two things at once during a sports game — an apology and a taunt. What came out was a perfectly fused phrase that became an internet legend.',
    revealContext:
      '"Are you fucking sorry?!" — combining "Are you okay?" and "You\'re fucking out!" into one accidental phrase. Originally from a greentext, it became one of Reddit\'s most-shared stories.',
  },
  {
    id: 'vp-11',
    year: 2015,
    category: 'viral_post',
    promptTitle: 'What Is This Vegetable?',
    promptTextRedacted:
      'A user confessed that at dinner with their partner\'s parents, they pretended not to know what a very common food was. They committed so hard to the bit that the evening was completely ruined.',
    revealContext:
      'The "What\'s a potato?" TIFU: a user pretended to have never seen a potato at their girlfriend\'s parents\' dinner, doubled down repeatedly, and was eventually kicked out of the house.',
    revealLink: 'https://www.reddit.com/r/tifu/comments/2tdbig/',
  },
  {
    id: 'vp-14',
    year: 2016,
    category: 'viral_post',
    promptTitle: 'The Window Steak',
    promptTextRedacted:
      'A user confessed that at a dinner party, they panicked about an overcooked piece of meat and disposed of it by launching it through a window. Their partner was not amused.',
    revealContext:
      'A TIFU about a user who threw a steak out their apartment window to hide it from dinner guests, then had to explain the missing food and the meat on the street below.',
    revealLink: 'https://www.reddit.com/r/tifu/comments/3im341/',
  },
  {
    id: 'vp-15',
    year: 2015,
    category: 'viral_post',
    promptTitle: 'The Suspicious Texts',
    promptTextRedacted:
      'A user posted a multi-part saga about discovering suspicious messages on their spouse\'s phone. The community followed along in real-time as the story unfolded with twists and turns.',
    revealContext:
      'The "Jenny" TIFU saga — a user live-updated their discovery of a spouse\'s infidelity via text messages. The multi-part story captivated millions before being questioned as possibly fictional.',
    revealLink: 'https://www.reddit.com/r/tifu/comments/2snn0q/',
  },
  {
    id: 'vp-16',
    year: 2018,
    category: 'viral_post',
    promptTitle: 'Smells Like Victory',
    promptTextRedacted:
      'In a thread about things that taste better than they smell, one user gave a single-word answer that was so unexpected and clever it became one of the highest-upvoted comments of all time.',
    revealContext:
      '"What tastes better than it smells?" — the top answer was simply "Feet." The lateral thinking needed to arrive at this answer made it legendary.',
  },
  {
    id: 'vp-17',
    year: 2010,
    category: 'viral_post',
    promptTitle: 'The Three-Step Breakup Plan',
    promptTextRedacted:
      'A comment listing exactly three pieces of advice for anyone going through a breakup became so widely repeated that it turned into a meme format used across the entire platform for years.',
    revealContext:
      '"Delete Facebook, hit the gym, lawyer up" — originally sincere relationship advice that became the go-to sarcastic response to any relationship problem on Reddit.',
  },
  {
    id: 'vp-20',
    year: 2011,
    category: 'viral_post',
    promptTitle: 'The Ice Soap and 2am Chili',
    promptTextRedacted:
      'Within the same week, two users independently posted oddly specific life hacks that the community latched onto as a surreal duo. One involved frozen hygiene, the other a late-night recipe.',
    revealContext:
      'The "2am Chili" comic and "Ice Soap" posts went viral the same week on Reddit, becoming an absurd pair that the community couldn\'t stop referencing together.',
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
