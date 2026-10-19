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
"I'm Mary Blankemeier, MBA2, from Chicago<br>Before: UVA engineering and track, then Bain and healthcare startups<br>Now: Run Your City, AI@GSB and building at the intersection of AI x healthcare<br><br>Fun facts to wake yall up...<br>Recently married another AI@GSB scholar - will let you guess which one<br>",
"Plan for today<br><br>Spend the next 20 minutes...<br>Then you'll have 50 minutes to build your personal website<br>And we'll come back together for 10 minutes at the end to debrief<br><br>Was antisocial this weekend to build this out so would LOVE to talk to ur beautiful faces vs backs of ur computers if thats not too drama to ask...",
"...shout it out!<br><br>3 different versions of what our website could look like for the nonprofit I help lead<br><br>A - previous website, took many years -- represented us pretty well but an absolute pain (time, money, limited capabilities)<br>B - Claude with a simple build me a website for my nonprofit prompt. Totally fine... could be literally anyone.<br>C - Claude with the SAME simple prompt, plus our photos, colors, taglines, etc.<br><br>[KEY POINT]&nbsp;<br>B and C are the same model, same prompt. The only difference version C has access to the skills like those we're building tonight which capture who we are -- and communicate that in our voice + style<br>",
"In addition to the context + information you give AI upfront -- also important to be thoughtful on how you iterate with these models.<br>Where ever you don't provide guidance to AI -- AI has to fill the gaps.<br><br>Came across this delightful study: researchers had AI play telephone. One AI draws a picture from a sentence, another AI describes the picture, then repeat... 100 times<br><br>They ran it 1,000+ times, starting from all kinds of different sentences<br>Almost every single one ended up as one of just 12 pictures -- stormy lighthouses, cities at night, palace interiors<br>Why? Every round drops what’s unusual and fills in what’s common. They literally called it visual elevator music<br><br>Why this matters for you: anywhere you leave a gap, AI fills it with an assumption... and it fills it with the most common thing it's seen. That's where the AI-isms come from. The stuff that's so not you.<br><br>[KEY POINT]&nbsp;<br>Prompting “make it better” over and over won't save you... it'll make you closer to the average.. and by average we mean visual elevator music (the most common version of a thing)",
"Why care about NOT being AI-average? We lose trust.<br><br>Okay, picture a version of this study in here. Same work for everyone. Left side finds out I used AI, right side thinks I did it myself. The side that knows trusts me 16 to 20% less.<br><br>And it held across 13 experiments and 5,000+ people -- students trusting professors, investors trusting companies, clients trusting designers.<br><br>[For the record, I did use AI for this. So there goes 1/5 of your trust in me.]<br><br>And it can be SO painfully obvious... the classic Linkedin post: I’m thrilled to share⁶ that I’m starting a new chapter! In today’s fast-paced world,¹ it’s not just about leadership, it’s about impact.² I’m excited to delve³ into the rich tapestry³ of healthcare —⁴ leveraging³ AI to build seamless, innovative and transformative⁵ solutions. Let’s connect!⁶<br><br>They just lost a lot more than 20% of my trust tbh.<br><br>[KEY POINT] More generic prompting won’t fix this. You've got to train your AI to be unmistakably yours.<br><br>[Quick tangent: this is the most studies I’ve deeply read in a while... so feel free to give me kudos in the feedback form you’ll all be filling out. TYSM in advance!]",
"Recap: Why does everyone’s AI sound the same?<br>✓ &nbsp;Generic in = generic out. AI drifts to the average. That's where we lose trust.<br><br>Next: how do I get it to sound like me?",
"Okay, quick throwback to workshop 2... what's a skill again? Saved instructions. You write the details once and never retype them.<br><br>Without a skill you have to provide the same direction every prompt - LHS<br><br>With a skill, you type the short version -- \"write my LinkedIn post about tonight\" -- and the skill fills in the rest.",
"Two ways it kicks in. Automatically: Claude reads every skill's name and description, and when your ask matches, it pulls the skill in. Or on purpose: type slash and the name.<br><br>[KEY POINT] Write the details once. Stop retyping them. we LOVE saving time",
"Okay so... how do you actually get AI to sound like you? It's a formula: examples + vibe + icks.<br><br>Examples = stuff you actually wrote. Mine: ~140 sent emails, ~120 Slacks, 17,736 texts and my meeting notes.<br>Vibe = how it should feel. Mine's warm, direct, specific... playful.<br>Icks = what makes you cringe. Em dashes, middle dots, \"Regards,\" and please, never \"I hope this email finds you well.\"<br><br>Hand all three to Claude/Chat/Gemini and it writes the rules for you. Middle is my real skill, trimmed. Almost 500 lines and counting.<br><br>[KEY POINT] Same prompt, two answers. No skill: \"results-driven leader passionate about leveraging AI.\" With my skill: the line that's actually on my site.",
"Okay, real talk: the first draft is never it. The skill gets good by going around this loop.<br><br>Real round from my site's intro line. Walking you through exactly what I did...<br><br>1. I literally typed: \"give me 3 versions of my intro line.\" It gave me polished, warm and playful.",
"2. I picked the middle one, warm. Sounded the most like me...&nbsp;",
"3. But two things bugged me. \"Passionate\"? Ick, way overused. And that em dash... classic AI tell.",
"4. So I told it: add both to my skill as nevers, so you remember next time.<br><br>That last part is the key... not just fix this one line. Remember it going forward.",
"5. Run it again... and now it sounds like me<br><br>[KEY POINT] Every round of naming what's off makes the skill sharper. Then you go around again.",
"This is THE muscle to build tonight.<br><br>Fixing it in the chat helps once. \"Add that to my skill\" fixes it for good. Skip that step and you'll be making the same correction tomorrow... and the day after.<br><br>Every line on the right is real -- each one came from me correcting Claude. [Yes, I'm that picky. And yes, the finance vs fiancé one is real... very different conversations.]<br><br>[KEY POINT] Every correction goes into the skill, or you'll make the same fix tomorrow.&nbsp;<br><br>I've found that you just have to get over the hump of it making you annoyed -- once you get it over that hump its easy to continue to invest -- be strategic on which you want to&nbsp;invest in.",
"Recap: How do I get AI to sound like me?<br>✓ &nbsp;Examples + vibe + icks become a voice skill. Iterate till you feel good. Update it every time you correct it.<br><br>Tactically: a skill is just saved instructions. I pulled my writing in (screenshots, copy-paste, or connectors), gave it a few vibe words + my obvious icks... then kept refining as it showed me drafts.<br><br>Next: how do I get it in my style? Spoiler... same recipe.",
"Good news: design is the same recipe. Examples + vibe + icks, just for how it looks.<br><br>Examples = what goes on the page. Mine: headshot, résumé, paintings, my voice skill... and a couple of sites I love as inspo, because showing beats describing.<br>Vibe = how it should feel. Mine's casual, kinda Notion-like... a clean page with pen notes. Colors pulled straight from my headshot -- blue pen and a yellow-green highlighter.<br>Icks = the nope list. Emojis, tape on photos, big-number stats, dark mode... and anything that looks like a video game. Found every one of those by building, wincing and writing it down.<br><br>Hand all three to Claude and it writes the rules. Middle is my real design skill, trimmed... and yes, it has its own non-negotiables. Blue pen outline around every photo. Handwriting always gets breathing room. [I'm that picky here too.]<br><br>[KEY POINT] Same prompt on both sides. Top could be anyone. Bottom is mine.",
"Quick peek at mine... live. [Let it play]<br><br>Every rule from that skill is on here. Blue pen around my photo, the highlighter on every heading, my paintings, my signature at the bottom... it's my style, not everyone else's.<br><br>[KEY POINT] Same recipe as the voice skill: examples + vibe + icks. This is what comes out the other end.",
"Recap: How do I get it in my style?<br>✓ &nbsp;Examples + vibe + icks become a design skill. Iterate till you feel good. Update it every time you correct it.<br><br>Next: what do you get once you have both?",
"This is site C. Live. [Let it play]<br><br>Okay so this is what got me SO fired up about skills. The impact is tremendous.<br><br>We rebuilt our whole website in way less time, in a voice and design that's more us than ever... and with more features than we've ever had. A map of every chapter. Sign-ups for parents and volunteers. A dashboard for volunteers to track. A store.<br><br>[KEY POINT] Once you have your brand -- voice + design -- you can quite literally grow and serve more parents, volunteers and chapters, in so much less time, and cheaper than what we paid before.",
"So what did one brand skill actually get us? Way more than a prettier homepage...<br><br>1. A map of all 106 chapters -- tap a pin, find your program.<br>2. Every chapter page has kids sign-up, volunteer sign-up and donate-to-this-chapter.<br>3. A real store. Every order fuels another kid's season.<br>4. Giving that's dead simple -- $50 is one kid for a whole season.<br>5. The whole site in Spanish too.<br>6. And a password-protected hub for our volunteers and chapter leads -- check in kids, see the roster, track it all in one dashboard.<br><br>[KEY POINT] Once you have your brand, you stop spending your time on how it looks and sounds... and start spending it on growing the thing.",
"And the site is just the start. Same ryc-brand skill, three more things: a volunteer flyer (tear-off tabs and all), an Instagram post, a donor email.<br><br>[Mia's quote in the donor email is real -- straight from our homepage.]<br><br>[KEY POINT] Once the skill exists, everything you make sounds and looks like you. Tonight's site is just the first thing.",
"Recap: What do I get with both?<br>✓ &nbsp;A site for you, your company... anything! And it's just the start.<br><br>So you can use this for your own personal site. Or a site for your company or club. Or anything after that... flyers, posts, decks. Same two skills every time.<br><br>Last one: what do I wish I'd known sooner? Rapid fire... six of them, fast.",
"Okay, rapid fire! Six things I wish I'd known sooner... roughly in the order you'll hit them on a project.<br><br>#1: Where do I start a big project? Sketch the story first, then hand AI the sketch.<br><br>Before a single slide, I sketched this deck's arc in tldraw (free!): hi, five questions, your turn. Then I handed Claude the picture.<br><br>AI can absolutely outline for you... but then it's AI's story. You pick the story, AI fills it in.",
"#2: How do I get AI to match my taste? Show, don't tell.<br><br>Telling works... \"warm, bright, modern, clean\" is a fine start. But everyone's warm is different, so AI fills the gaps with the average.<br>Show it a site you love or an email you actually sent and it picks up way more detail than any description could -- the fonts, the spacing, how you sign off.<br><br>[Fancy name for this: few-shot learning. A few examples teach the pattern.]",
"#3: How do I give AI design feedback? Words work... but a marked-up screenshot shows exactly where.<br><br>\"Make the header smaller\" -- which header? So: screenshot it, circle what's off, paste it back with a line on what you want. The picture shows where, the words say what.<br><br>Here's a real one. An early agenda slide... I screenshot it, scribbled all over it, then pasted it back: \"fix these slides, see my notes in red.\" That's it. The red does the talking. [Yes... this deck had a LOT of notes.]<br><br>Same idea as #2: words + a picture beat words alone.",
"#4: One skill or two? When you're deciding between one big skill with more instructions or a few smaller, focused ones... here's how I think about it. One if voice and design always travel together, two if they don't.<br><br>Run Your City: every single thing needs both -- the site, flyers, posts, donor emails. So ryc-brand holds both.<br><br>Me? My writing skill runs on EVERYTHING -- emails, Slack, texts, intros, thank-yous. My design skill? Basically just my website. My texts don't need a highlighter. So I keep two.<br><br>[KEY POINT] And when I do need both, I don't merge them. One line in my design skill says \"any words on the page? use my-writing-style.\" Linked, not merged.",
"#5: Why does AI get worse the more I give it? Too much on its desk. More isn't better.<br><br>Everything in your chat, plus every skill it pulls in, sits on AI's desk at once. Bury it in directions and it can miss the one that matters.<br><br>So keep each skill focused on one job, and link them when you need both. My emails run my-writing-style AND humanizer: one makes it sound like me, the other strips the AI tells. Each one stays short and sharp.<br><br>[Pro tip: when a chat gets crowded, start a new one. Your skills come with you.]",
"#6: What else can skills do? Way more than websites. My favorites right now:<br><br>undyslexify -- I have dyslexia, so this one turns any dense reading into a press-play study page, a PDF + audio.<br>think-first-my-guy -- asks me questions before it writes a thing.<br>winning-writing -- Glenn Kramon's writing class... as a skill.<br>bye-bye-robot -- the humanizer from #5. Strips the AI tells (remember our LinkedIn friend?).<br>morning-moment -- my 30-minute morning brief.<br>And spill-the-tea preps Josh and me for the podcast in reality-TV voice. [Highly recommend.]<br><br>[KEY POINT] Fill out the feedback form + I'll send you all six AND the code for my personal website... steal away!!",
"Recap: What do I wish I'd known sooner?<br>✓ &nbsp;Sketch first. Show, don't tell. Mark it up. Split skills that don't travel together. Keep skills focused.<br><br>All five answered! This is your checklist for the next 50 minutes.",
"Okay... now go build!! Voice, design and your site, with the tutorial -- aigsb-workshop3.vercel.app, or scan the first QR code.<br><br>Stuck? Debug in this order:<br>1. Ask AI in the chat you're building in<br>2. Hit \"Stuck?\" in the tutorial<br>3. Post on PollEv<br>4. Raise your hand -- we'll come running<br><br>Finished early? Go further in the tutorial: make it 3D, a signature move, a brand skill for your club.<br><br>And before you leave... feedback form, 2 minutes. TYSM!!",
"Okay... how'd it go?! First... show us what you built!! Ugly drafts welcome. Who's brave?<br><br>Thank you so big for being here. Seriously so touched. That's all...<br><br>Oh wait!! Plz do the feedback form, it helps me so big.<br><br>If you want more: Josh and I have a podcast, Out of Our Depth -- outofourdepth.com. You can watch him go through this exact process... and us learn AI and have fun with it. Ideally we build a fun community in a space that can be so blah.<br><br>[KEY POINT] 2 minutes of feedback = my skills + website code are yours. Have a joy of a week!!"
];

const TIGHT = [
 [],
 [
  "I'm **Mary Blankemeier**, MBA2, from Chicago",
  "Before: **UVA** engineering + track, then **Bain** + healthcare startups",
  "Now: **Run Your City**, **AI@GSB**, building at **AI x healthcare**",
  "Fun facts to wake y'all up...",
  "Recently **married another AI@GSB scholar**... guess which one"
 ],
 [
  "Plan for today",
  "Next **20 minutes**...",
  "Then **50 minutes** to build your personal website",
  "Back together for **10 minutes** to debrief",
  "Was antisocial this weekend building this... would LOVE **your faces, not the backs of your computers**"
 ],
 [
  "...**shout it out!**",
  "3 versions of our website for the **nonprofit I help lead**",
  "**A**: previous site, **took years**. Represented us okay but an absolute pain (**time, money, limited**)",
  "**B**: Claude, **simple prompt**. Fine... could be **anyone**",
  "**C**: Claude, **same prompt**, plus our **photos, colors, taglines**",
  "[KEY POINT] B and C: **same model, same prompt**. Only difference: C has **skills like the ones we build tonight**, in our **voice + style**"
 ],
 [
  "Beyond what you give AI up front... **how you iterate** matters too",
  "Wherever you don't give guidance, **AI fills the gaps**",
  "Delightful study: AI plays **telephone**. One draws a picture, another describes it... **100 times**",
  "They ran it **1,000+ times**, all kinds of starting sentences",
  "Almost all ended as **1 of 12 pictures**: stormy lighthouses, cities at night, palace interiors",
  "Why? Each round **drops the unusual**, fills in the common. They called it **visual elevator music**",
  "Why it matters: **any gap you leave, AI fills with an assumption**... the most common thing. That's where the **AI-isms** come from",
  "[KEY POINT] “Make it better” over and over **won't save you**... it pulls you **closer to average**"
 ],
 [
  "Why care? **We lose trust**",
  "Picture it here: same work. Left side learns **I used AI**, right side thinks **I did it myself**. Left trusts me **16 to 20% less**",
  "Held across **13 experiments, 5,000+ people**: students, investors, clients",
  "[For the record, I did use AI for this. There goes **1/5 of your trust**]",
  "And it can be SO obvious... the classic **LinkedIn post** [read it]",
  "They lost **way more than 20%** of my trust tbh",
  "[KEY POINT] More generic prompting **won't fix this**. Train your AI to be **unmistakably yours**",
  "[Tangent: most studies I've read in a while... **kudos in the feedback form** welcome. TYSM!]"
 ],
 [
  "✓ **Generic in = generic out**. AI **drifts to average**. That's where we **lose trust**",
  "Next: how do I get it to **sound like me**?"
 ],
 [
  "Throwback to workshop 2... what's a skill? **Saved instructions**. Write once, **never retype**",
  "Without one: **same direction every prompt** (left side)",
  "With one: “**write my LinkedIn post about tonight**” and the skill fills in the rest"
 ],
 [
  "Two ways it kicks in: **automatically**, Claude reads every skill's name and description and **pulls it in when your ask matches**. Or **on purpose**: slash + the name",
  "[KEY POINT] Write the details **once**. Stop retyping them. We **LOVE saving time**"
 ],
 [
  "How do you get AI to sound like you? **Examples + vibe + icks**",
  "**Examples**: stuff you actually wrote. Mine: ~140 emails, ~120 Slacks, **17,736 texts**, meeting notes",
  "**Vibe**: how it should feel. Mine: warm, direct, specific... **playful**",
  "**Icks**: what makes you cringe. **Em dashes**, middle dots, “Regards,” and never “**I hope this email finds you well**”",
  "Hand all three to **Claude / Chat / Gemini**, it **writes the rules**. Middle is my real skill: **almost 500 lines** and counting",
  "[KEY POINT] Same prompt, two answers. No skill: “**results-driven leader**...” With my skill: **the line actually on my site**"
 ],
 [
  "Real talk: the **first draft is never it**. The skill gets good going **around this loop**",
  "Real round, my site's intro line. **Exactly what I did**...",
  "1. I literally typed: “**give me 3 versions of my intro line**.” Got polished, warm, playful"
 ],
 [
  "2. I **picked the middle one, warm**. Sounded the most like me..."
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
  "✓ **Examples + vibe + icks** = a voice skill. **Iterate**. **Update it** every time you correct it",
  "Tactically: **saved instructions**. Pulled my writing in (screenshots, copy-paste or **connectors**), a few **vibe words** + obvious **icks**... then **refined as it showed me drafts**",
  "Next: how do I get it **in my style**? Spoiler... **same recipe**"
 ],
 [
  "Good news: design is the **same recipe**. Examples + vibe + icks, for **how it looks**",
  "**Examples**: headshot, résumé, paintings, my voice skill... + **a couple of sites I love** as inspo. Showing beats describing",
  "**Vibe**: casual, kinda **Notion-like**... a clean page with **pen notes**. Colors from my headshot: **blue pen + yellow-green highlighter**",
  "**Icks**: emojis, tape on photos, big-number stats, dark mode... anything like a **video game**. Found each by **building, wincing, writing it down**",
  "Claude writes the rules. Non-negotiables: **blue pen outline** on every photo, **handwriting gets breathing room**. [That picky here too]",
  "[KEY POINT] Same prompt both sides. Top could be **anyone**. Bottom is **mine**"
 ],
 [
  "Quick peek at **mine**... live. [Let it play]",
  "Every rule from the skill: **blue pen** around my photo, **highlighter** on every heading, my **paintings**, my **signature** at the bottom... **my style, not everyone else's**",
  "[KEY POINT] Same recipe: **examples + vibe + icks**. This is what comes out the other end"
 ],
 [
  "✓ **Examples + vibe + icks** = a **design skill**. Iterate, update every time you correct it",
  "Next: what do you **get with both**?"
 ],
 [
  "**This is site C. Live.**",
  "[Let it play]",
  "This is what got me **SO fired up** about skills",
  "Rebuilt our whole site in **way less time**, more **us** than ever, with **more features than ever**: chapter map, sign-ups, volunteer dashboard, a store",
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
  "**morning-moment**: my **30-minute** morning brief",
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

/* CUES: the presenter view's default. START = first line on the slide, END = last line before you click.
   beats = the middle, short. **bold** = the words to hit. [brackets] = asides and cues. */
const CUES = [
 {
  "start": "Welcome in! Tonight is the **Art of Personalization**... teaching AI **your voice and style**.",
  "beats": [],
  "end": "Quick **intro on me** first."
 },
 {
  "start": "I'm **Mary Blankemeier**, MBA2, from Chicago.",
  "beats": [
   "Before the GSB: **UVA**, systems engineering, ran track",
   "Then **Bain** and healthcare startups",
   "Now: **Run Your City, AI@GSB**, and building at the intersection of AI and healthcare"
  ],
  "end": "Fun fact to wake y'all up... recently **married another AI@GSB scholar**. I'll let you **guess which one**."
 },
 {
  "start": "Plan for today: the next 20 minutes, we go through these **five sections**.",
  "beats": [
   "Then **50 minutes** to build your personal website",
   "Then **10 minutes** back together to debrief",
   "1 Why does everyone's AI sound the same?  2 How do I get it to sound like me?  3 In my style?  4 What do I get with both?  5 What do I wish I'd known sooner?"
  ],
  "end": "Was **antisocial** this weekend building this... so would LOVE the next 20 minutes to be **tech free**. Faces, not the backs of your computers, if that's not **too drama** to ask!"
 },
 {
  "start": "Which would you trust? **Shout it out!**",
  "beats": [
   "Three versions of our website for the nonprofit I help lead",
   "**A:** our old site. Took years, repped us pretty well, but an absolute pain (time, money, limited)",
   "**B:** Claude with a simple \"build me a website for my nonprofit\" prompt. Totally fine... **could be literally anyone**",
   "**C:** Claude, **SAME simple prompt**, plus our photos, colors, taglines"
  ],
  "end": "B and C are the **same model, same prompt**. The only difference: **C has skills**, like the ones we're building tonight, that capture who we are in our voice and style."
 },
 {
  "start": "Beyond what you give AI up front, **how you iterate** matters too. Wherever you don't give guidance, **AI fills the gaps**.",
  "beats": [
   "Delightful study: AI plays **telephone**. One draws a picture from a sentence, another describes it... back and forth 100 times",
   "Ran it **1,000+** times, all kinds of starting sentences",
   "Almost every one ended as one of just **12 pictures**: lighthouses, cities at night, palace interiors",
   "Every round drops what's unusual, fills in what's common. They called it **\"visual elevator music\"**",
   "Anywhere you leave a gap, AI fills it with the **most common thing** it's seen. That's where the AI-isms come from"
  ],
  "end": "Prompting **\"make it better\"** over and over won't save you... it pulls you **closer to average**. Visual elevator music."
 },
 {
  "start": "Why care about NOT being AI-average? **We lose trust.**",
  "beats": [
   "Picture the study in here: same work for everyone",
   "Left side finds out I used AI, right side thinks I did it myself",
   "Left side trusts me **16 to 20% less**",
   "Held across **13 experiments** and **5,000+ people**: students and professors, investors and companies, clients and designers",
   "[Aside] For the record, I did use AI for this... so there goes **a fifth of your trust** in me",
   "It can be **SO painfully obvious**... the classic LinkedIn post: \"I'm thrilled to share a new chapter... in today's fast-paced world...\" blah blah"
  ],
  "end": "More generic prompting won't fix this. You've got to train your AI to be **unmistakably yours**."
 },
 {
  "start": "Recap: **why does everyone's AI sound the same?**",
  "beats": [
   "**Generic in = generic out**. AI drifts to the average. That's where we lose trust"
  ],
  "end": "Next: how do I get AI to **sound like me?**"
 },
 {
  "start": "Quick throwback to workshop 2... what's a skill? **Saved instructions**. Write the details once, **never retype** them.",
  "beats": [
   "Left side, **no skill**: you give the same directions every single prompt",
   "Right side, **with a skill**: type the short version, \"write my LinkedIn post about tonight,\" and the skill fills in the rest"
  ],
  "end": "The skill **has you covered**."
 },
 {
  "start": "**Two ways** it kicks in.",
  "beats": [
   "**Automatically:** Claude reads every skill's name and description, and when your ask matches, it pulls the skill in",
   "**On purpose:** type slash and the skill name, if you want to be sure it's used"
  ],
  "end": "Write the details **once**. Stop retyping them. We **LOVE saving time**."
 },
 {
  "start": "Okay so... how do you actually get AI to sound like you? It's a formula: **examples + vibe + icks**.",
  "beats": [
   "**Examples:** stuff you actually wrote. Mine: ~140 emails, ~120 Slacks, **17,736 texts**, meeting notes",
   "**Vibe:** how it should feel. Mine: warm, direct, specific... playful",
   "**Icks:** what makes you cringe. Em dashes, middle dots, \"Regards,\" and please, never \"I hope this email finds you well\"",
   "Hand all three to Claude, ChatGPT or Gemini and it **writes the rules** for you",
   "Middle is my real skill, trimmed. **Almost 500 lines** and counting"
  ],
  "end": "**Same prompt, two answers.** No skill: \"results-driven leader passionate about leveraging AI.\" With my skill: **the line that's actually on my site**."
 },
 {
  "start": "Real talk: the first draft of your skill is **never it**. It gets good by going around **this loop**.",
  "beats": [
   "You only gave it a handful of examples. **Ask AI for more**, pick what you like, say why, update the skill",
   "Real round from my site's intro line..."
  ],
  "end": "Step 1: I literally typed **\"give me 3 versions of my intro line.\"** It gave me **polished, warm and playful**."
 },
 {
  "start": "Step 2: I picked the middle one, **warm**.",
  "beats": [],
  "end": "Sounded the **most like me**..."
 },
 {
  "start": "Step 3: but **two things bugged me**.",
  "beats": [
   "**\"Passionate\"?** Ick, way overused"
  ],
  "end": "And that **em dash**... **classic AI tell**."
 },
 {
  "start": "Step 4: so I told Claude: **add both to my skill as nevers**, so you remember next time.",
  "beats": [],
  "end": "That's the key... not just fixing this one line. **Remembering it going forward.**"
 },
 {
  "start": "Step 5: run it again... and **now it sounds like me**.",
  "beats": [],
  "end": "Every round of naming what's off, or what you like, **makes the skill sharper**. Keep going till it's a skill you're proud of."
 },
 {
  "start": "This is **THE muscle** to build tonight: **update the skill every time you correct it**.",
  "beats": [
   "Fixing it in the chat helps once. **\"Add that to my skill\"** fixes it for good",
   "Every line on the right is real, each one from me correcting Claude",
   "[Aside] Yes, I'm that picky. And yes, **finance vs fiancé** is real... very different conversations",
   "Pro move: a **recurring routine** that reads your chats and proposes skill updates, daily or weekly",
   "Get over the hump of being annoyed. After that it's easy to keep investing. Be strategic about which ones"
  ],
  "end": "**Every correction goes into the skill**... or you'll be making the **same fix tomorrow**."
 },
 {
  "start": "Recap: how do I get AI to **sound like me?**",
  "beats": [
   "Examples + vibe + icks become your **voice skill**. Iterate till you feel good. Update it every time you correct it",
   "**Tactically:** pulled my writing in (screenshots, copy-paste, connectors), gave it a few vibe words and my obvious icks, then kept refining as it showed me drafts"
  ],
  "end": "Next: how do I get it **in my style?** Spoiler... **same recipe**."
 },
 {
  "start": "Good news: design is the **same recipe**. Examples + vibe + icks, just for how it looks.",
  "beats": [
   "**Examples:** what goes on the page. Headshot, résumé, paintings, my voice skill... and sites I love as inspo, because showing beats describing",
   "**Vibe:** casual, kinda Notion-like... a clean page with pen notes. Colors straight from my headshot: blue pen and a yellow-green highlighter",
   "**Icks:** the nope list. Emojis, tape on photos, big-number stats, dark mode... anything that looks like a video game. Found every one by building, wincing, writing it down",
   "Hand all three to Claude and it **writes the rules**. Middle is my real design skill, trimmed",
   "**Non-negotiables:** blue pen around every photo, handwriting always gets breathing room [I'm that picky here too]"
  ],
  "end": "Same prompt on both sides. **Top could be anyone. Bottom is mine.**"
 },
 {
  "start": "Quick peek at mine... **live**. Yours will look even better by tonight.",
  "beats": [
   "[Let it play]",
   "Every rule from that skill is on here: **blue pen** around my photo, **highlighter** on every heading, my paintings, my signature... **my style, not everyone else's**",
   "Built the design skill first, asked for examples, iterated, **THEN built the site**"
  ],
  "end": "**Same recipe as the voice skill**. This is what comes out the other end."
 },
 {
  "start": "Recap: how do I get it **in my style?**",
  "beats": [
   "Examples + vibe + icks become a **design skill**. Iterate till you feel good. Update it every time you correct it"
  ],
  "end": "Next: what do you get **once you have both?**"
 },
 {
  "start": "This is **site C. Live.**",
  "beats": [
   "[Let it play]",
   "This is what got me **SO fired up** about skills. The impact is tremendous",
   "Rebuilt our whole website in **way less time**, in a voice and design more us than ever... with **more features** than we've ever had"
  ],
  "end": "Once you have your brand, you get to spend your time **growing and serving** more parents, volunteers and chapters... **not rewriting your brand** along the way."
 },
 {
  "start": "So what did **one brand skill** actually get us? Way more than a prettier homepage.",
  "beats": [
   "A map of all **106 chapters**. Tap a pin, find your program",
   "Every chapter page: **kid sign-up, volunteer sign-up, donate**. Used to be Google Forms, now built in and way more professional",
   "A **real store** that looks like we make the gear",
   "Giving that's **dead simple**",
   "The whole site in **Spanish** too, because so many of our families speak Spanish",
   "A **password-protected hub** for volunteers and chapter leads: roster, check-ins, one dashboard",
   "Not all of this fits a personal site. The point: your time goes to what's actually **creative and valuable**"
  ],
  "end": "Once you have your brand, you stop spending your time on how it looks and sounds... and start spending it on **growing the thing**."
 },
 {
  "start": "And the site is **just the start**.",
  "beats": [
   "Same Run Your City brand skill, three more things: a **volunteer flyer** (tear-off tabs and all), an **Instagram post**, a **donor email**",
   "[Aside] **Mia's quote** in the donor email is real, straight from our homepage",
   "For you: **presentations, papers, posts**"
  ],
  "end": "Once the skill exists, everything you make **sounds and looks like you**. Tonight's site is **just the first thing**."
 },
 {
  "start": "Recap: what do I get **with both?**",
  "beats": [
   "**A site for you**, your company... anything. Flyers, posts, decks. **Same two skills** every time"
  ],
  "end": "Last one: what do I wish I'd known sooner? **Rapid fire**... **six of them**, fast."
 },
 {
  "start": "Okay, **rapid fire!** Six things, roughly in the order you'll hit them on a project. **#1**: where do I start a big project? **Sketch the story first**, then hand AI the sketch.",
  "beats": [
   "Before a single slide, I sketched this deck in **tldraw (free!)**, then handed Claude the picture"
  ],
  "end": "AI can absolutely outline for you... but then it's **AI's story**. **You pick the story**, AI fills it in."
 },
 {
  "start": "**#2**: how do I get AI to match my taste? **Show, don't tell.**",
  "beats": [
   "Telling works. \"Warm, bright, modern\" is a fine start. But **everyone's warm is different**, so AI fills the gaps with the average",
   "Show it **a site you love** or **an email you actually sent**. It picks up way more than any description: fonts, spacing, how you sign off",
   "[Aside] Fancy name for this: **few-shot learning**"
  ],
  "end": "A few examples **teach the pattern**."
 },
 {
  "start": "**#3**: how do I give AI design feedback? **Mark it up, then say the fix.**",
  "beats": [
   "\"Make the header smaller\"... **which header?**",
   "Screenshot it, **circle what's off**, paste it back with one line on what you want",
   "Real one: an early agenda slide, scribbled all over it. \"Fix these slides, see my **notes in red**\" [Yes... this deck had a LOT of notes]"
  ],
  "end": "The picture **shows where**, the words **say what**."
 },
 {
  "start": "**#4**: **one skill or two?** One if voice and design always travel together, two if they don't.",
  "beats": [
   "Run Your City: everything needs both, the site, flyers, posts, donor emails. So one brand skill holds both",
   "Me: my writing skill runs on **EVERYTHING**. Emails, Slack, texts, intros, thank-yous",
   "My design skill? **Basically just my website**. My texts don't need a highlighter. So I **keep two**"
  ],
  "end": "When I do need both, I don't merge them. One line in my design skill: \"any words on the page? use my writing style.\" **Linked, not merged.**"
 },
 {
  "start": "**#5**: why does AI get worse the more I give it? **Too much on its desk.**",
  "beats": [
   "Everything in your chat, plus every skill it pulls in, sits on AI's desk **at once**",
   "Bury it in directions and it can **miss the one that matters**",
   "Keep each skill focused on **one job**, link them when you need both",
   "My emails run my writing style AND a **humanizer**. One sounds like me, the other strips the AI tells",
   "[Pro tip] Crowded chat? **Start a new one**. Your skills come with you"
  ],
  "end": "**More isn't better.** Short, sharp, focused skills."
 },
 {
  "start": "**#6**: what else can skills do? **Way more than websites.** My favorites right now:",
  "beats": [
   "**undyslexify**: I have dyslexia, so it turns dense reading into a press-play study page, PDF and audio",
   "**think-first-my-guy**: asks me questions before it writes a thing (I love to start building before I've nailed the actual problem)",
   "**winning-writing**: Glenn Kramon's writing class... as a skill",
   "**bye-bye-robot**: the humanizer. Strips the AI tells, so I don't end up like our LinkedIn friend",
   "**morning-moment**: my 30-minute morning brief",
   "**spill-the-tea**: preps Josh and me for the podcast in a reality-TV voice [Highly recommend]"
  ],
  "end": "Fill out the **feedback form** and I'll send you **all six** AND the **code for my website**... steal away!!"
 },
 {
  "start": "Recap: what do I **wish I'd known sooner?**",
  "beats": [
   "**Sketch first**. **Show, don't tell**. **Mark it up**. **Split skills** that don't travel together. **Keep skills focused**"
  ],
  "end": "All five answered! This is your **checklist for the next 50 minutes**."
 },
 {
  "start": "Okay... now **go build!!** Voice, design and your site, with the tutorial. Scan the **first QR code**.",
  "beats": [
   "**Stuck?** Debug in this order: 1 ask AI in the chat you're building in, 2 hit \"Stuck?\" in the tutorial, 3 post on PollEv (we're watching it), 4 raise your hand, we'll come running",
   "**Finished early?** Make it 3D, add a signature move, build a brand skill for your club"
  ],
  "end": "Before you leave... **feedback form, 2 minutes**. Please, please, please. TYSM!!"
 },
 {
  "start": "Okay... **how'd it go?!** First... **show us what you built!!** Ugly drafts welcome. Who's brave?",
  "beats": [
   "**Thank you so big** for being here. Seriously so touched",
   "Josh and I have a podcast, **Out of Our Depth** (outofourdepth.com). Watch him go through this exact process... and us learn AI and have fun with it"
  ],
  "end": "**2 minutes of feedback** = my skills and website code are yours. Have a **joy of a week!!**"
 }
];

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method not allowed" });
  const check = instructorCheck(req);
  if (check === "unconfigured") return res.status(503).json({ ok: false, error: "notes are not set up" });
  if (!check) return res.status(401).json({ ok: false, error: "unauthorized" });
  return res.status(200).json({ ok: true, notes: NOTES, tight: TIGHT, cues: CUES });
}
