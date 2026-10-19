import { instructorCheck } from "../lib/store.js";

/**
 * Speaker notes for /deck/notes and /deck/present. Kept in this function (not a
 * static file) so they only go to someone with the INSTRUCTOR_KEY.
 *
 *   GET /api/deck-notes   header: x-instructor-key: <INSTRUCTOR_KEY>
 *
 * NOTES: the full notes from the Claude Slides deck (HTML, one per slide).
 * TIGHT: the short version to say out loud. One string per line; **bold** marks
 * the anchor words, a leading [KEY POINT] marks the takeaway, [brackets] are asides.
 */
const NOTES = [
"",
"I'm Mary Blankemeier, GSB '27, from Chicago<br>Before: UVA engineering and track, then Bain and healthcare startups<br>Now: Run Your City, AI@GSB and AI in healthcare<br><br>Fun facts to wake yall up...<br>Recently married another AI@GSB scholar - will let you guess which one<br>",
"In the next 20 minutes we're going to answer these 5 questions<br>Then you'll have 50 minutes to build your personal website<br>And we'll come back together for 10 minutes at the end to debrief",
"Quick question: which would you send your current or future daughter to right now? Hands up for A, B, C.<br><br>A is drag and drop on Wix -- us last year.<br>B is Claude with a simple prompt. Totally fine... could be literally anyone.<br>C is Claude with the SAME simple prompt, plus our photos, colors, taglines, etc.<br><br>[KEY POINT]&nbsp;<br>So: B and C are the same AI, same prompt. The only difference is the pile of “who we are” stuff we handed it alongside.<br><br>Hold onto that pile... we’re gonna come back to it.",
"Same prompt gives the same output. We all know that part<br><br>Came across this delightful study: researchers had AI play telephone. One AI draws a picture from a sentence, another AI describes the picture, then repeat... 100 times<br><br>They played that game over 1,000 times, starting from all kinds of different sentences<br>Almost every single one ended up as one of just 12 pictures -- stormy lighthouses, cities at night, palace interiors<br>Why? Every round drops what’s unusual and fills in what’s common. They literally called it visual elevator music<br><br>Why this matters for you: anywhere you leave a gap, AI fills it with an assumption... and it fills it with the most common thing it's seen. That's where the AI-isms come from. The stuff that's so not you.<br><br>[KEY POINT]&nbsp;<br>Prompting “make it better” over and over won't save you... it'll make you closer to the average.. and by average we mean visual elevator music (the most common version of a thing)",
"Why care about NOT being AI-average? We lose trust.<br><br>Okay, picture yourselves in this study. Same presentation for everyone. Left side finds out I used AI to make it, right side thinks I made it by hand. Just like that, left side trusts me ~18% less.<br><br>And it held across totally different groups -- students trusting professors, investors trusting companies, clients trusting designers.<br><br>[For the record, I did use AI for this. So there goes 1/5 of your trust in me.]<br><br>And it can be SO painfully obvious... the classic Linkedin post: I’m thrilled to share⁶ that I’m starting a new chapter! In today’s fast-paced world,¹ it’s not just about leadership, it’s about impact.² I’m excited to delve³ into the rich tapestry³ of healthcare —⁴ leveraging³ AI to build seamless, innovative and transformative⁵ solutions. Let’s connect!⁶<br><br>They just lost a lot more than 20% of my trust tbh.<br><br>[KEY POINT] More generic prompting won’t fix this. You've got to train your AI to be unmistakably yours.<br><br>[Quick tangent: this is the most studies I’ve deeply read in a while... so feel free to give me kudos in the feedback form you’ll all be filling out. TYSM in advance!]",
"Recap: Why does everyone’s AI sound the same?<br>✓ &nbsp;Same prompt = same output. AI drifts to the average. That's where we lose trust.<br><br>Next: how do I get it to sound like me?",
"Okay, quick throwback to workshop 2... what's a skill again? Saved instructions. You write the details once and never retype them.<br><br>Without one, every prompt has to carry the same paragraph of rules. Monday, Wednesday, Friday... same paragraph, every. single. time.<br><br>With one, you type the short version -- \"write my LinkedIn post about tonight\" -- and the skill fills in the rest. Bonus: it's cheaper too, since the chat stays short.",
"Two ways it kicks in. On its own, when your ask matches the skill's name and description (so write that description like a trigger!). Or on purpose: type slash and the name.<br><br>[KEY POINT] Write the details once. Stop retyping them.",
"Okay so... how do you actually get AI to sound like you? It's a formula: assets + vibe + icks.<br><br>Assets = stuff you actually wrote. Mine: ~140 sent emails, ~120 Slacks, 17,736 texts and my meeting notes.<br>Vibe = how it should feel. Mine's warm, direct, specific... athlete-operator.<br>Icks = what makes you cringe. Em dashes, middle dots, \"Regards,\" and please, never \"I hope this email finds you well.\"<br><br>Hand all three to Claude and it writes the rules for you. Middle is my real skill, trimmed. 483 lines and counting.<br><br>And yes, the Mary-isms made it in... \"thank you so big\" stays ungrammatical. On purpose. [Also: tehe, never lol. Non-negotiable.]<br><br>Works the same in ChatGPT or Gemini.<br><br>[KEY POINT] Same prompt, two answers. No skill: \"results-driven leader passionate about leveraging AI.\" With my skill: the line that's actually on my site.",
"Okay, real talk: the first draft is never it. The skill gets good by going around this loop.<br><br>Real round from my site's intro line. Walking you through exactly what I did...<br><br>1. I literally typed: \"give me 3 versions of my intro line.\" It gave me polished, warm and playful.",
"2. I picked the middle one, warm. Sounded the most like me... and I told Claude that, in plain words. The why is what it learns from.",
"3. But two things bugged me. \"Passionate\"? Ick, way overused. And that em dash... classic AI tell.",
"4. So I told it: add both to my skill as nevers, so you remember next time.<br><br>That last part is the key... not just fix this one line. Remember it going forward.",
"5. Run it again... and now it sounds like me<br><br>[KEY POINT] Every round of naming what's off makes the skill sharper. Then you go around again.",
"This is THE muscle to build tonight.<br><br>Fixing it in the chat helps once. \"Add that to my skill\" fixes it for good. Skip that step and you'll be making the same correction tomorrow... and the day after.<br><br>Every line on the right is real -- each one came from me correcting Claude. [Yes, I'm that picky. And yes, the finance vs fiancé one is real... very different conversations.]<br><br>[KEY POINT] Every correction goes into the skill, or you'll make the same fix tomorrow.&nbsp;<br><br>I've found that you just have to get over the hump of it making you annoyed -- once you get it over that hump its easy to continue to invest -- be strategic on which you want to&nbsp;invest in.",
"Recap: How do I get AI to sound like me?<br>✓ &nbsp;Assets + vibe + icks become a voice skill. Iterate till you feel good. Update it every time you correct it.<br><br>Tactically: a skill is just saved instructions. I pulled my writing in (screenshots, copy-paste, or connectors), gave it a few vibe words + my obvious icks... then kept refining as it showed me drafts.<br><br>Next: how do I get it to look like me? Spoiler... same recipe.",
"Good news: design is the same recipe. Assets + vibe + icks, just for how it looks.<br><br>Assets = what goes on the page. Mine: headshot, résumé, paintings, my voice skill... and a couple of sites I love as inspo, because showing beats describing.<br>Vibe = how it should feel. I pulled mine straight from my headshot -- blue pen and a yellow-green highlighter.<br>Icks = the nope list. Emojis, tape on photos, big-number stats, dark mode... and anything that looks like a video game. Found every one of those by building, wincing and writing it down.<br><br>Hand all three to Claude and it writes the rules. Middle is my real design skill, trimmed... and yes, it has its own non-negotiables. Blue pen outline around every photo. Handwriting always gets breathing room. [I'm that picky here too.]<br><br>[KEY POINT] Same prompt on both sides. Left could be anyone. Right is mine.",
"Quick peek at mine... live. [Let it play]<br><br>Every rule from that skill is on here. Blue pen around my photo, the highlighter on every heading, my paintings, my signature at the bottom... it looks like me, not like everyone else.<br><br>[KEY POINT] Same recipe as the voice skill: assets + vibe + icks. This is what comes out the other end.",
"Recap: How do I get it to look like me?<br>✓ &nbsp;Assets + vibe + icks become a design skill. Iterate till you feel good. Update it every time you correct it.<br><br>Next: what do you get once you have both?",
"Back to your make believe daughter... this is site C. Live. [Let it play]<br><br>Okay so this is what got me SO fired up about skills. The impact is tremendous.<br><br>We rebuilt our whole website in way less time, in a voice and design that's more us than ever... and with more features than we've ever had. A map of every chapter. Sign-ups for parents and volunteers. A dashboard for volunteers to track. A store.<br><br>[KEY POINT] Once you have your brand -- voice + design -- you can quite literally grow and serve more parents, volunteers and chapters, in so much less time, and cheaper than what we paid before.",
"So what did one brand skill actually get us? Way more than a prettier homepage...<br><br>1. A map of all 106 chapters -- tap a pin, find your program.<br>2. Every chapter page has kids sign-up, volunteer sign-up and donate-to-this-chapter.<br>3. A real store. Every order fuels another kid's season.<br>4. Giving that's dead simple -- $50 is one kid for a whole season.<br>5. The whole site in Spanish too.<br>6. And a password-protected hub for our volunteers and chapter leads -- check in kids, see the roster, track it all in one dashboard.<br><br>[KEY POINT] Once you have your brand, you stop spending your time on how it looks and sounds... and start spending it on growing the thing.",
"And the site is just the start. Same ryc-brand skill, three more things: a volunteer flyer (tear-off tabs and all), an Instagram post, a donor email.<br><br>[Mia's quote in the donor email is real -- straight from our homepage.]<br><br>[KEY POINT] Once the skill exists, everything you make sounds and looks like you. Tonight's site is just the first thing.",
"Recap: What do I get with both?<br>✓ &nbsp;A site for you, your company... anything! And it's just the start.<br><br>So you can use this for your own personal site. Or a site for your company or club. Or anything after that... flyers, posts, decks. Same two skills every time.<br><br>Last one: what do I wish I'd known sooner? Rapid fire... six of them, fast.",
"Okay, rapid fire! Six things I wish I'd known sooner... roughly in the order you'll hit them on a project.<br><br>#1: Where do I start a big project? Sketch the story first, then hand AI the sketch.<br><br>Before a single slide, I sketched this deck's arc in tldraw (free!): hi, five questions, your turn. Then I handed Claude the picture.<br><br>AI can absolutely outline for you... but then it's AI's story. You pick the story, AI fills it in.",
"#2: How do I get AI to match my taste? Show, don't tell.<br><br>Telling works... \"warm, bright, modern, clean\" is a fine start. But everyone's warm is different, so AI fills the gaps with the average.<br>Show it a site you love or an email you actually sent and it picks up way more detail than any description could -- the fonts, the spacing, how you sign off.<br><br>[Fancy name for this: few-shot learning. A few examples teach the pattern.]",
"#3: How do I give AI design feedback? Words work... but a marked-up screenshot shows exactly where.<br><br>\"Make the header smaller\" -- which header? So: screenshot it, circle what's off, paste it back with a line on what you want. The picture shows where, the words say what.<br><br>Here's a real one. An early agenda slide... I screenshot it, scribbled all over it, then pasted it back: \"fix these slides, see my notes in red.\" That's it. The red does the talking. [Yes... this deck had a LOT of notes.]<br><br>Same idea as #2: words + a picture beat words alone.",
"#4: One skill or two? When you're deciding between one big skill with more instructions or a few smaller, focused ones... here's how I think about it. One if voice and design always travel together, two if they don't.<br><br>Run Your City: every single thing needs both -- the site, flyers, posts, donor emails. So ryc-brand holds both.<br><br>Me? My writing skill runs on EVERYTHING -- emails, Slack, texts, intros, thank-yous. My design skill? Basically just my website. My texts don't need a highlighter. So I keep two.<br><br>[KEY POINT] And when I do need both, I don't merge them. One line in my design skill says \"any words on the page? use my-writing-style.\" Linked, not merged.",
"#5: Why does AI get worse the more I give it? Too much on its desk. More isn't better.<br><br>Everything in your chat, plus every skill it pulls in, sits on AI's desk at once. Bury it in directions and it can miss the one that matters.<br><br>So keep each skill focused on one job, and link them when you need both. My emails run my-writing-style AND humanizer: one makes it sound like me, the other strips the AI tells. Each one stays short and sharp.<br><br>[Pro tip: when a chat gets crowded, start a new one. Your skills come with you.]",
"#6: What else can skills do? Way more than websites. My favorites right now:<br><br>undyslexify -- I have dyslexia, so this one turns any dense reading into a press-play study page, a PDF + audio.<br>think-first-my-guy -- asks me questions before it writes a thing.<br>winning-writing -- Glenn Kramon's writing class... as a skill.<br>bye-bye-robot -- the humanizer from #5. Strips the AI tells (remember our LinkedIn friend?).<br>morning-moment -- my 30-second morning brief.<br>And spill-the-tea preps Josh and me for the podcast in reality-TV voice. [Highly recommend.]<br><br>[KEY POINT] Fill out the feedback form + I'll send you all six AND the code for my personal website... steal away!!",
"Recap: What do I wish I'd known sooner?<br>✓ &nbsp;Sketch first. Show, don't tell. Mark it up. Split skills that don't travel together. Keep skills focused.<br><br>All five answered! This is your checklist for the next 50 minutes.",
"Okay... now go build!! Voice, design and your site, with the tutorial -- aigsb-workshop3.vercel.app, or scan the first QR code.<br><br>Stuck? Debug in this order:<br>1. Ask AI in the chat you're building in<br>2. Hit \"Stuck?\" in the tutorial<br>3. Post on PollEv<br>4. Raise your hand -- we'll come running<br><br>Finished early? Go further in the tutorial: make it 3D, a signature move, a brand skill for your club.<br><br>And before you leave... feedback form, 2 minutes. TYSM!!",
"Okay... how'd it go?! First... show us what you built!! Ugly drafts welcome. Who's brave?<br><br>Thank you so big for being here. Seriously so touched. That's all...<br><br>Oh wait!! Plz do the feedback form, it helps me so big.<br><br>If you want more: Josh and I have a podcast, Out of Our Depth -- outofourdepth.com. You can watch him go through this exact process... and us learn AI and have fun with it. Ideally we build a fun community in a space that can be so blah.<br><br>[KEY POINT] 2 minutes of feedback = my skills + website code are yours. Have a joy of a week!!"
];

const TIGHT = [
 [],
 [
  "I'm **Mary Blankemeier**, GSB '27, from Chicago",
  "Before: **UVA** engineering + track, then **Bain** + healthcare startups",
  "Now: **Run Your City**, **AI@GSB**, AI in healthcare",
  "Fun fact to wake y'all up...",
  "Recently **married another AI@GSB scholar**... guess which one"
 ],
 [
  "**5 questions** in the next **20 minutes**",
  "Then **50 minutes** to build your personal website",
  "Back together for **10 minutes** to debrief"
 ],
 [
  "Which would you send your **current or future daughter** to? **Hands up**: A, B, C",
  "**A**: drag and drop on **Wix**... us last year",
  "**B**: Claude, **simple prompt**. Fine... could be **anyone**",
  "**C**: Claude, **same prompt**, plus our **photos, colors, taglines**",
  "[KEY POINT] B and C: **same AI, same prompt**. Only difference is the **pile of “who we are”**",
  "**Hold onto that pile**... we're coming back to it"
 ],
 [
  "Same prompt, **same output**. We all know that part",
  "Delightful study: AI plays **telephone**. One draws a picture, another describes it... **100 times**",
  "**1,000+ games**, all kinds of starting sentences",
  "Almost all ended as **1 of 12 pictures**: stormy lighthouses, cities at night, palace interiors",
  "Why? Each round **drops the unusual**, fills in the common. They called it **visual elevator music**",
  "Why it matters for you: **any gap you leave, AI fills with an assumption**... the most common thing it's seen. That's where the **AI-isms** come from",
  "[KEY POINT] “Make it better” over and over **won't save you**... it pulls you **closer to average**"
 ],
 [
  "Why care? **We lose trust**",
  "Picture this study: same presentation. Left side learns **I used AI**, right side thinks **I made it by hand**. Left trusts me **~18% less**",
  "Held everywhere: **students, investors, clients**",
  "[For the record, I did use AI for this. There goes **1/5 of your trust**]",
  "And it can be SO obvious... the classic **LinkedIn post** [read it]",
  "They lost **way more than 20%** of my trust tbh",
  "[KEY POINT] More generic prompting **won't fix this**. Train your AI to be **unmistakably yours**",
  "[Tangent: most studies I've read in a while... **kudos in the feedback form** welcome. TYSM!]"
 ],
 [
  "✓ Same prompt = same output. AI **drifts to average**. That's where we **lose trust**",
  "Next: how do I get it to **sound like me**?"
 ],
 [
  "Throwback to workshop 2... what's a skill? **Saved instructions**. Write once, **never retype**",
  "Without one: same paragraph of rules **Monday, Wednesday, Friday**... every. single. time.",
  "With one: “**write my LinkedIn post about tonight**” and the skill fills in the rest. Bonus: **cheaper**, chat stays short"
 ],
 [
  "Two ways it kicks in: **on its own** when your ask matches the description (write it **like a trigger!**). Or **on purpose**: slash + the name",
  "[KEY POINT] Write the details **once**. Stop retyping them"
 ],
 [
  "How do you get AI to sound like you? **Assets + vibe + icks**",
  "**Assets**: stuff you actually wrote. Mine: ~140 emails, ~120 Slacks, **17,736 texts**, meeting notes",
  "**Vibe**: how it should feel. Mine: warm, direct, specific... **athlete-operator**",
  "**Icks**: what makes you cringe. **Em dashes**, middle dots, “Regards,” and never “**I hope this email finds you well**”",
  "Hand all three to Claude, it **writes the rules**. Middle is my real skill: **483 lines** and counting",
  "Mary-isms made it in... “**thank you so big**” stays ungrammatical. [Also: **tehe, never lol**. Non-negotiable]",
  "Works in **ChatGPT or Gemini** too",
  "[KEY POINT] Same prompt, two answers. No skill: “**results-driven leader**...” With my skill: **the line actually on my site**"
 ],
 [
  "Real talk: the **first draft is never it**. The skill gets good going **around this loop**",
  "Real round, my site's intro line. **Exactly what I did**...",
  "1. I literally typed: “**give me 3 versions of my intro line**.” Got polished, warm, playful"
 ],
 [
  "2. I **picked the middle one, warm**. Sounded most like me",
  "And I **told Claude why**, in plain words. **The why is what it learns from**"
 ],
 [
  "3. Two things bugged me. “**Passionate**”? **Ick**, way overused",
  "That **em dash**... classic **AI tell**"
 ],
 [
  "4. So I told it: **add both to my skill as nevers**, so you remember next time",
  "[KEY POINT] Not just fix this one line. **Remember it going forward**"
 ],
 [
  "5. **Run it again**... now it sounds like me",
  "[KEY POINT] Every round of naming what's off makes the skill **sharper**"
 ],
 [
  "This is **THE muscle** tonight",
  "Fixing it in chat helps **once**. “**Add that to my skill**” fixes it **for good**",
  "Every line on the right is **real**, each one from me correcting Claude. [Yes, that picky. **Finance vs fiancé**... very different conversations]",
  "[KEY POINT] Every correction goes **into the skill**, or you'll make the **same fix tomorrow**",
  "Get over the **hump of being annoyed**... then it's easy to keep investing. Be **strategic** about which"
 ],
 [
  "✓ **Assets + vibe + icks** = a voice skill. **Iterate**. **Update it** every time you correct it",
  "Tactically: **saved instructions**. Pulled my writing in (screenshots, copy-paste or **connectors**), a few **vibe words** + obvious **icks**... then **refined as it showed me drafts**",
  "Next: how do I get it to **look like me**? Spoiler... **same recipe**"
 ],
 [
  "Good news: design is the **same recipe**. Assets + vibe + icks, for **how it looks**",
  "**Assets**: headshot, résumé, paintings, my voice skill... + **a couple of sites I love** as inspo. Showing beats describing",
  "**Vibe**: pulled straight from my headshot. **Blue pen + yellow-green highlighter**",
  "**Icks**: emojis, tape on photos, big-number stats, dark mode... anything like a **video game**. Found each by **building, wincing, writing it down**",
  "Claude writes the rules. Non-negotiables: **blue pen outline** on every photo, **handwriting gets breathing room**. [That picky here too]",
  "[KEY POINT] Same prompt both sides. Left could be **anyone**. Right is **mine**"
 ],
 [
  "Quick peek at **mine**... live. [Let it play]",
  "Every rule from the skill: **blue pen** around my photo, **highlighter** on every heading, my **paintings**, my **signature** at the bottom",
  "[KEY POINT] Same recipe: **assets + vibe + icks**. This is what comes out the other end"
 ],
 [
  "✓ Same recipe = a **design skill**. Iterate, update every time you correct it",
  "Next: what can you **build with both**?"
 ],
 [
  "Back to your make-believe daughter... **this is site C. Live.**",
  "[Let it play]",
  "This is what got me **SO fired up** about skills",
  "Rebuilt our whole site in **way less time**, more **us** than ever, with **more features than ever**",
  "[KEY POINT] Once you have your brand, you can **serve more parents, volunteers and chapters**... in **less time**, for **less money**"
 ],
 [
  "What did one brand skill get us? **Way more than a prettier homepage**",
  "1. **Map of all 106 chapters**. Tap a pin, find your program",
  "2. Every chapter page: **kid sign-up, volunteer sign-up, donate**",
  "3. **A real store**. Every order fuels a kid's season",
  "4. **Dead-simple giving**: $50 = **one kid, one season**",
  "5. The whole site **in Spanish**",
  "6. **Volunteer hub**: check in kids, see the roster, track it all",
  "[KEY POINT] Stop spending time on **how it looks and sounds**... start spending it on **growing the thing**"
 ],
 [
  "The site's **just the start**. Same **ryc-brand** skill: a **flyer** (tear-off tabs and all), an **Instagram post**, a **donor email**",
  "[Mia's quote is **real**, straight from our homepage]",
  "[KEY POINT] Once the skill exists, **everything** sounds and looks like you"
 ],
 [
  "✓ A site for **you, your company... anything**. And it's just the start",
  "Your **own site**. A site for your **company or club**. Then **flyers, posts, decks**. **Same two skills** every time",
  "Last one: what do I **wish I'd known sooner**? **6, fast**"
 ],
 [
  "Rapid fire! **6 things** I wish I'd known... in the order you'll hit them",
  "**#1: Where do I start?** **Sketch the story first**, then hand AI the sketch",
  "I sketched this deck's arc in **tldraw** (free!) before a single slide. Then handed Claude the picture",
  "AI can outline... but then it's **AI's story**. **You pick the story**, AI fills it in"
 ],
 [
  "**#2: Match my taste?** **Show, don't tell**",
  "“Warm, bright, modern” is a fine start... but **everyone's warm is different**, so AI fills the gaps with average",
  "**Show** it a **site you love** or an **email you sent**: way more detail than any description. **Fonts, spacing, sign-off**",
  "[Fancy name: **few-shot learning**]"
 ],
 [
  "**#3: Design feedback?** Words work... a **marked-up screenshot** shows exactly where",
  "“Make the header smaller”... **which header?** Screenshot, **circle it**, paste it back + **one line** on the fix",
  "Real one: early agenda slide, scribbled all over: “**fix these slides, see my notes in red**.” **The red does the talking**. [This deck had a LOT of notes]",
  "Same as #2: **words + a picture** beat words alone"
 ],
 [
  "**#4: One skill or two?** One big skill with more instructions, or a few **smaller, focused** ones? Here's how I think about it",
  "**One** if voice + design always travel together. **Two** if they don't",
  "**Run Your City**: everything needs both. So **ryc-brand holds both**",
  "**Me**: writing skill runs on **everything**. Design skill? Basically **just my website**. My texts don't need a highlighter. **So two**",
  "[KEY POINT] Need both? **Link, don't merge**: “any words on the page? use **my-writing-style**”"
 ],
 [
  "**#5: Why does AI get worse the more I give it?** **Too much on its desk**",
  "Your chat + every skill it pulls in, **all on the desk at once**. Bury it and it **misses the one that matters**",
  "Keep each skill **focused on one job**, link when needed. My emails: **my-writing-style + humanizer**. One sounds like me, one **strips the AI tells**",
  "[Pro tip: crowded chat? **Start a new one**. Your skills come with you]"
 ],
 [
  "**#6: What else?** **Way more than websites**. My favorites:",
  "**undyslexify**: I have dyslexia... turns dense reading into a **press-play study page**",
  "**think-first-my-guy**: asks me questions **before it writes**",
  "**winning-writing**: **Glenn Kramon's** class... as a skill",
  "**bye-bye-robot**: the humanizer from #5. Remember our **LinkedIn friend**?",
  "**morning-moment**: my **30-second** morning brief",
  "**spill-the-tea**: preps Josh and me for the podcast in **reality-TV voice**. [Highly recommend]",
  "[KEY POINT] Do the **feedback form** + I'll send **all six** AND **my website code**... steal away!!"
 ],
 [
  "✓ **Sketch first. Show, don't tell. Mark it up. Split skills that don't travel together. Keep skills focused**",
  "All five answered! Your **checklist** for the next 50 minutes"
 ],
 [
  "Now **go build!!** Voice, design, site. **Tutorial**: aigsb-workshop3.vercel.app, or the **first QR**",
  "Stuck? In order:",
  "1. **Ask AI** in your chat",
  "2. Hit “**Stuck?**” in the tutorial",
  "3. **PollEv**",
  "4. **Raise your hand**, we'll come running",
  "Done early? **Make it 3D, a signature move, a brand skill for your club**",
  "Before you leave: **feedback form**, 2 min. TYSM!!"
 ],
 [
  "**How'd it go?!** **Show us what you built!!** Ugly drafts welcome. **Who's brave?**",
  "Thank you **so big** for being here. Seriously **so touched**",
  "Oh wait!! **Feedback form** plz, it helps me so big",
  "More? Josh and I have a podcast, **Out of Our Depth**: outofourdepth.com. Watch him go through **this exact process**... and us **learn AI and have fun**. Ideally a **fun community** in a space that can be so blah",
  "[KEY POINT] **2 min of feedback = my skills + website code**. Have a **joy of a week!!**"
 ]
];

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method not allowed" });
  const check = instructorCheck(req);
  if (check === "unconfigured") return res.status(503).json({ ok: false, error: "notes are not set up" });
  if (!check) return res.status(401).json({ ok: false, error: "unauthorized" });
  return res.status(200).json({ ok: true, notes: NOTES, tight: TIGHT });
}
