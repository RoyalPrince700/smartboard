import type { SocialPost } from '../../types/social';
import { RAW_VOICE_SAMPLES } from './styleGuide';

/**
 * Add new posts here. Each entry = one angle, fully developed.
 * One rich post per platform in `content`, no series/thread splits unless you add them later.
 */
export const SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'rph-noteboard-architecture',
    title: 'I built Noteboard: sticky notes on a live canvas, not another notes app',
    topic: 'Product',
    summary:
      'Noteboard on Royal Prince Hub is a 3600×2400 pannable canvas of colored sticky notes. Multiple boards, Google sign-in, share-link live edit via Socket.IO rooms, MongoDB notes as data not pixels.',
    tags: ['noteboard', 'collaboration', 'architecture', 'buildinpublic', 'productivity'],
    createdAt: '2026-08-30',
    status: 'ready',
    sourceWriteUp:
      'New Noteboard on Royal Prince Hub. Separate post: how it works, what people can do, architecture. Sticky canvas, share links, realtime.',
    platforms: {
      linkedin: {
        content: `I added Noteboard to Royal Prince Hub because a task list is the wrong tool when you are still thinking.

Taskboard is for execution: dates, status, XP, done. Noteboard is the other surface. A big canvas of sticky notes you can pan, zoom, drag, and share live.

WHAT YOU CAN DO
Open royalprincehub.com/noteboard.

You get a 3600×2400 board, a desk, not a phone note. Drop sticky notes in yellow, mint, peach, sky, or lilac. Type up to 500 characters. Drag them. Stack them (the last one you touch comes forward). Zoom from 50% to 200%. Pan around. Create as many boards as you want and rename them.

You can try it as a guest. Sign in with Google when you want the notes to persist.

Share a link and someone else can edit with you. New notes, moves, color changes, deletes, even the board title, show up on their screen without a refresh.

I use it to map a product, dump a messy week, plan a workshop, or sit with a collaborator on the same board from two different places.

HOW IT IS BUILT
Frontend is React. The canvas is a transformed surface (pan + zoom). Each sticky is a note document, not pixels. Where you were zoomed, and which board you had open, lives in localStorage so you land where you left off.

Backend is Express + MongoDB, three collections:
• Artboard: owner + title
• ArtboardNote: text, color, x, y, z-index, tied to a board
• ArtboardShare: random token, edit permission, optional expiry

REST handles create, update, delete. Realtime is Socket.IO. Each board is a room (artboard:id). After a note saves, the server emits to everyone in the room except the client that made the change. I send an x-socket-id header so you don't get your own echo. Peers get join/leave so you know someone else is on the board.

Share links hit public routes. No login required to collaborate on a shared board. The token can expire. Delete a board and the notes and share tokens go with it.

New notes pick the least-used color so a board doesn't turn into a wall of yellow. They offset from the last note so they don't stack in a pile.

I built this with Cursor as a pair, but the architecture is mine: notes as data, rooms per board, share as a token not an account invite.

If you think in maps more than lists, use it. royalprincehub.com/noteboard

Open to feedback. If you've built collaborative canvases, I want to hear how you handled echo and conflict.`,
        hashtags: ['buildinpublic', 'webdev', 'productivity', 'collaboration', 'softwareengineer'],
        series: [
          `I added Noteboard to Royal Prince Hub because a task list is the wrong tool when you are still thinking.

Taskboard is dates, status, XP, done. Noteboard is a desk: a 3600×2400 canvas of sticky notes you pan, zoom, and drag.

WHAT YOU CAN DO
Open royalprincehub.com/noteboard.

Drop notes in yellow, mint, peach, sky, or lilac. Type up to 500 characters. Drag. Stack (last one you touch comes forward). Zoom 50% to 200%. Create as many boards as you want.

Try it as a guest. Sign in with Google when you want notes to persist.

Share a link and someone else edits with you. New notes, moves, color, deletes, even the board title, show up without a refresh.

I use it to map a product, dump a messy week, plan a workshop, or sit with a collaborator on the same board from two places.

This is not Notion. Not a phone notes app. A spatial board for people who think with their hands.

royalprincehub.com/noteboard

If you think in maps more than lists, go use it. Feedback welcome.`,
          `How Noteboard actually works, for people who care about the wiring.

Frontend: React. The canvas is a transformed surface (pan + zoom). Each sticky is a document, not pixels. Zoom and last board live in localStorage so you land where you left off.

Backend: Express + MongoDB.
• Artboard: owner + title
• ArtboardNote: text, color, x, y, z-index
• ArtboardShare: random token, edit permission, optional expiry

REST for create/update/delete. Realtime is Socket.IO. Each board is a room (artboard:id). After a save, the server emits to the room except the client that made the change (x-socket-id so you don't echo yourself). Peers get join/leave.

Share links are public routes. No login required to collaborate. Token can expire. Delete a board and notes + tokens go with it.

New notes pick the least-used color, then offset from the last note so they don't pile up.

I built with Cursor. The decisions are mine: notes as data, rooms per board, share as a token not an account invite.

If you've shipped collaborative canvases, how did you handle echo and conflict? royalprincehub.com/noteboard`,
        ],
        media: [
          {
            type: 'screen-recording',
            description: 'Noteboard walkthrough: drop notes, pan/zoom, share link, second window updates live',
            shots: [
              'Open /noteboard',
              'Create notes in different colors',
              'Drag + zoom the canvas',
              'Create a second board',
              'Share link, open in another window, watch a note appear',
            ],
          },
        ],
        notes: 'Royal Prince Hub, not Smart Board. Film on royalprincehub.com/noteboard. Guest mode works without login.',
      },
      twitter: {
        content: `I built Noteboard on royalprincehub.com.\n\n3600×2400 canvas. Sticky notes you pan, zoom, drag.\nShare a link → live edit (Socket.IO rooms).\nNotes are MongoDB docs, not pixels.\n\nTry it: royalprincehub.com/noteboard`,
        hashtags: ['buildinpublic', 'webdev', 'productivity'],
        thread: [
          `I built Noteboard on royalprincehub.com.\n\nA 3600×2400 canvas of sticky notes. Pan, zoom, drag. Share a link and someone else edits live.\n\nFor thinking. Taskboard is for doing.\n\nroyalprincehub.com/noteboard`,
          `Noteboard wiring:\n• React canvas (pan + zoom)\n• MongoDB: board, note, share token\n• Socket.IO room per board\n• x-socket-id so you don't echo yourself\n\nNotes as data, not screenshots.\n\nroyalprincehub.com/noteboard`,
        ],
        media: [{ type: 'screen-recording', description: '20–30 sec: drop a note, share, second window updates' }],
      },
      facebook: {
        content: `I added Noteboard to my site, royalprincehub.com.

It is a big board of sticky notes. You write, drag, zoom, and if you share the link, someone else can edit with you and see changes live.

I built it for the moments a to-do list is too tight. Mapping a project. Dumping ideas. Planning with a friend who is not in the same room.

You can try it without an account. Sign in with Google when you want it saved.

Under the hood: React canvas, MongoDB for each note (text, color, position), Socket.IO so the board stays in sync. I used Cursor to build faster. The product decisions are mine.

Go try it: royalprincehub.com/noteboard

Tell me what you'd use it for.`,
        hashtags: ['buildinpublic', 'productivity', 'webdev'],
        media: [{ type: 'screen-recording', description: '1–2 min: guest board → notes → share live' }],
      },
      instagram: {
        hook: 'I built a sticky-note canvas you can share live',
        content: `Noteboard is live on royalprincehub.com

What you can do:
• Drop colored sticky notes on a huge canvas
• Pan, zoom, drag, stack
• Make as many boards as you want
• Share a link → they edit with you, live
• Guest try, Google sign-in to save

Why I built it:
Taskboard is for execution.
Noteboard is for thinking.

How it works:
Notes are data in MongoDB (text, color, x, y).
Each board is a Socket.IO room.
Share is a token, not an account invite.

I build with Cursor. I still own the architecture.

Link in bio → /noteboard`,
        hashtags: ['buildinpublic', 'webdev', 'productivity', 'noteboard', 'softwareengineer'],
        media: [
          {
            type: 'carousel',
            description: '5 slides or a reel',
            shots: ['Empty board', 'Notes dropped', 'Zoom/pan', 'Share popover', 'Second person editing'],
          },
        ],
      },
      tiktok: {
        hook: "A to-do list is the wrong tool when you're still thinking",
        content: `I built Noteboard on royalprincehub.com

Huge canvas. Sticky notes. Pan, zoom, drag.
Share a link and it updates live on their screen.

Guest mode to try. Google to save.

React + MongoDB + Socket.IO rooms.
Notes as data, not screenshots.

I build with Cursor. You can use the board today.

royalprincehub.com/noteboard`,
        hashtags: ['buildinpublic', 'coding', 'productivity', 'webdev'],
        media: [
          {
            type: 'screen-recording',
            description: '45–60 sec vertical',
            shots: ['Hook text', 'Drop notes', 'Zoom', 'Share + second window', 'URL on screen'],
          },
        ],
      },
      whatsapp: {
        content: `Noteboard is live on royalprincehub.com

Sticky notes on a big canvas. Pan, zoom, drag. Share a link and someone edits with you live.

Guest to try. Google to save. royalprincehub.com/noteboard`,
        series: [
          `Noteboard is live on my site 📝

Big canvas of sticky notes. Write, drag, zoom, stack. Share a link and they edit with you, live. Guest to try. Google sign-in to save.

For thinking, mapping, dumping a messy week. Taskboard is for doing.

royalprincehub.com/noteboard`,
          `How Noteboard works (short):

Each note is saved as data (text, color, position), not a picture.
Share link = live board (Socket.IO rooms). Echo skipped so you don't see your own move twice.

I built it with Cursor. Architecture is mine.

royalprincehub.com/noteboard`,
        ],
        media: [{ type: 'screen-recording', description: '30 sec board demo', shots: ['Drop notes', 'Share live'] }],
      },
    },
  },
  {
    id: 'rph-taskboard-start-using',
    title: 'Taskboard is live. I want you using it this week, not screenshotting it',
    topic: 'Product',
    summary:
      'Push to use Taskboard on Royal Prince Hub: weekly planner, XP, streaks, focus mode, boss-battle projects, shareable Word reports, leaderboards. Sign in with Google at royalprincehub.com/taskboard.',
    tags: ['taskboard', 'productivity', 'gamification', 'buildinpublic'],
    createdAt: '2026-08-30',
    status: 'ready',
    sourceWriteUp:
      'Want people to start using Taskboard on the platform. Feature-rich weekly planner. CTA: sign in with Google and plan this week.',
    platforms: {
      linkedin: {
        content: `I didn't build Taskboard as a demo on my portfolio. I built it so people would actually plan their week on it.

It is live. royalprincehub.com/taskboard

Sign in with Google. That's it. No waitlist.

WHAT IT IS
A weekly planner with a calendar you can actually live in. Sunday to Saturday weeks. Tasks have a title, time window, status (started → in progress → almost done → completed, or postponed / cancelled), priority (low, normal, high, critical), tags, comments, and an optional project.

It is not a flat todo list. Status is a workflow. Unfinished work can roll to the next day without rewriting history. Original date stays. That's how real weeks work.

WHY I GAMIFIED IT
I get bored of tools that only store guilt. So completion pays XP: 10 / 25 / 50 / 100 depending on priority. 500 XP is a level. There is a daily score and a Royal Score (completion, priority, streak). Streaks count visits, not only perfect days, so missing one task doesn't wipe you. You can restore a broken streak with XP (capped per month).

Focus mode is a timer on one task. It autosaves every 45 seconds and when you leave the tab, so you don't lose a deep-work session because you refreshed.

Projects are "boss battles." There are missions, objectives, achievements (first task, 5 in a day, 7-day streak, 10 hours of focus, level 10), and a victory journal.

Share a day, week, or month as a link, or download a Word report. Links expire in 30 days. You can invite people onto a leaderboard. You can grant a collaborator real permissions: add, edit, delete, change status, comment. Presence so you see who's on the board.

I use this for my own week. I built it with Cursor. The rules (XP lock so you can't double-pay, visit streaks, focus flush) are engineering I had to think through.

I want this used, not admired.

If you are a founder, a student, a team lead, or you just want a week that isn't a pile of chats: go to royalprincehub.com/taskboard, sign in with Google, put Monday on the board.

If it helps you, tell someone. If something is missing, tell me.`,
        hashtags: ['productivity', 'buildinpublic', 'webdev', 'taskmanagement', 'softwareengineer'],
        series: [
          `I didn't build Taskboard as a demo. I built it so people would plan their week on it.

It is live. royalprincehub.com/taskboard

Sign in with Google. No waitlist.

WHAT YOU GET
A Sunday–Saturday week. Each task has time, status, priority, tags, comments, optional project. Status is a workflow, not a checkbox: started → in progress → almost done → completed. You can postpone or cancel without pretending the day was clean.

Unfinished work can roll forward. Original date stays. That's how real weeks work.

WHY YOU MIGHT STICK
Completion pays XP (10 / 25 / 50 / 100 by priority). Levels every 500 XP. Daily score + Royal Score. Streaks count showing up, not only perfect days.

Focus mode: one task, timer, autosave so a refresh doesn't steal the session.

Share a day/week/month as a link or a Word doc. Invite a leaderboard. Grant a collaborator real permissions.

I use this for my own week. I want you on it this week, not next quarter.

royalprincehub.com/taskboard

Sign in. Put Monday on the board. If it helps, tell someone. If it's missing something, tell me.`,
          `What I refused to ship in Taskboard: a pretty todo that forgets how work actually moves.

A few decisions, for people who will actually use it (and for engineers who want the why):

XP is locked per completion. Mark done, get paid once. Un-complete and the XP claws back. No farming.

Streaks are visit-based. Miss a task, you don't automatically lose the week. You can restore a broken streak with XP, limited times per month.

Focus time writes every ~45s and when the tab hides. Deep work shouldn't vanish on refresh.

Share reports are tokens with a 30-day expiry, day/week/month, plus .docx if your manager wants a file.

Collaborators are not "everyone is admin." You grant add / edit / delete / status / comment.

Leaderboards snapshot XP at join so the race is fair from that moment, not lifetime totals.

Stack: React frontend, Express + MongoDB, Google sign-in. I pair with Cursor. I still own the rules.

This only matters if people use it.

royalprincehub.com/taskboard

Sign in with Google. Plan this week there. DM me if you want a leaderboard with your team.`,
        ],
        media: [
          {
            type: 'screen-recording',
            description: 'Full Taskboard: week view, add task, complete for XP, focus mode, share report',
            shots: [
              'Open /taskboard, Google sign-in',
              'Add tasks on the week',
              'Change status + priority',
              'Complete → XP',
              'Focus mode timer',
              'Share week / download docx',
            ],
          },
        ],
        notes: 'Strong CTA: people should start using it. Film real week, not empty state. royalprincehub.com/taskboard',
      },
      twitter: {
        content: `Taskboard is live. I want you using it this week.\n\nWeekly planner + XP + streaks + focus mode + shareable reports.\nSign in with Google.\n\nroyalprincehub.com/taskboard`,
        hashtags: ['productivity', 'buildinpublic', 'webdev'],
        thread: [
          `Taskboard is live. I want you using it this week, not screenshotting it.\n\nWeekly planner. XP. Streaks. Focus mode. Share a report with your lead.\n\nSign in with Google.\nroyalprincehub.com/taskboard`,
          `Taskboard isn't a guilt list.\n\nXP 10/25/50/100 by priority. Levels at 500.\nStreaks count showing up.\nFocus autosaves.\nShare day/week/month.\n\nI use it for my own week.\nroyalprincehub.com/taskboard`,
        ],
        media: [{ type: 'screen-recording', description: '20 sec: add task → complete → XP ticks' }],
      },
      facebook: {
        content: `I built a weekly planner on my site and I actually want people to use it.

royalprincehub.com/taskboard

Sign in with Google. Put your week on the board. Tasks have time, status, priority. You earn XP when you finish. There's a focus timer so you can sit on one thing. You can share a weekly report as a link or a Word file.

This is the tool I use for my own work. I didn't want another list that just stores what I failed to do.

If you've been looking for somewhere to plan the week that isn't a messy chat, go try it and tell me how it feels.

royalprincehub.com/taskboard`,
        hashtags: ['productivity', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: '2 min walkthrough of a real week' }],
      },
      instagram: {
        hook: 'I built a planner I actually want you to use this week',
        content: `Taskboard. Live on royalprincehub.com

Sign in with Google. Plan the week there.

What you get:
📅 Sunday–Saturday week
✅ Status workflow (not just a checkbox)
⚡ XP by priority (10 / 25 / 50 / 100)
🔥 Streaks for showing up
⏱ Focus mode (autosaves)
📄 Share a report or download Word
👥 Leaderboards + collaborator permissions

I use this for my own week. Built with Cursor. The rules are mine.

Stop collecting productivity apps. Use this one.

Link in bio → /taskboard`,
        hashtags: ['productivity', 'taskboard', 'buildinpublic', 'webdev', 'softwareengineer'],
        media: [
          {
            type: 'carousel',
            description: 'Week grid, task card, XP, focus, share',
            shots: ['Week view', 'Task form', 'XP / level', 'Focus mode', 'Share report CTA'],
          },
        ],
      },
      tiktok: {
        hook: "I built a planner and I'm asking you to actually use it",
        content: `Taskboard on royalprincehub.com

Sign in with Google.
Plan your week.
Finish tasks → XP.
Focus mode so you sit on one thing.
Share the week with your lead.

I use this for my own work. Not a demo.

royalprincehub.com/taskboard`,
        hashtags: ['productivity', 'coding', 'buildinpublic', 'techtok'],
        media: [
          {
            type: 'screen-recording',
            description: '45 sec: empty week → fill Monday → complete → XP',
            shots: ['Hook', 'Add tasks', 'Complete', 'XP', 'URL'],
          },
        ],
      },
      whatsapp: {
        content: `Taskboard is live. I want you on it this week.

Weekly planner, XP, focus mode, shareable reports. Sign in with Google.

royalprincehub.com/taskboard`,
        series: [
          `Taskboard is live. Please use it this week, not next month.

Weekly planner + XP + focus timer + share a report with your lead. Sign in with Google. No waitlist.

I use this for my own week. I want you on it.

royalprincehub.com/taskboard`,
          `How I use Taskboard: dump the week, set priority, sit in focus mode, share the report if someone needs proof.

XP when you finish. Streaks for showing up. Free with Google sign-in on my site.

royalprincehub.com/taskboard`,
        ],
        media: [{ type: 'screen-recording', description: '30 sec week + complete task', shots: ['Week', 'XP'] }],
      },
    },
  },
  {
    id: 'rph-build-with-ai-workshop-book',
    title: 'Build with AI is the book, and the book is the ticket to my 3-day workshop',
    topic: 'Product',
    summary:
      'New book Build with AI: From Zero to Full-Stack Developer with Cursor. 14 chapters + glossary, live UI demos. Buying the book is the ticket to the 3-day online workshop. royalprincehub.com/all-books',
    tags: ['buildwithai', 'cursor', 'workshop', 'webdev', 'book'],
    createdAt: '2026-08-30',
    status: 'ready',
    sourceWriteUp:
      'New book Build with AI. The book is the ticket to my online 3-day workshop. Must buy the book to attend.',
    platforms: {
      linkedin: {
        content: `I wrote a new book: Build with AI: From Zero to Full-Stack Developer with Cursor.

It is also the ticket to my online 3-day workshop. You buy the book. That's how you get in. No separate "register for the webinar" link that forgets you by Thursday.

WHAT THE BOOK IS
A practical path from zero to shipping a real site, using the same stack I used to build Royal Prince Hub: React, Node, Express, MongoDB. Cursor as the pair, not as a magic button.

14 chapters + a glossary.

You learn what the web actually is, the toolkit (GitHub, Vercel, Render, Cloudflare, Google auth, Flutterwave), how to prompt without skipping fundamentals, type and color, then the anatomy of a real site.

Chapters 4–6 are not screenshots of a course. They have live UI inside the reader: the same hero, layout, and DIY tracks I use on royalprincehub.com. You see it, then you build it.

Then we get honest: env files, auth, what AI gets wrong, deploy, backend anatomy, debugging, admin dashboards, custom domain. Last chapter is what to build next so you don't freeze after "I finished a tutorial."

I am not writing this for computer science professors. I am writing it for the beginner, the creator, the person with an idea and no localhost yet.

THE WORKSHOP
Three days, online. We don't sit and watch slides about "the future of AI." We build. The book is the material. The workshop is the room: questions, live prompting, getting unstuck, shipping something you can open on your phone.

If you don't buy the book, you're not in the room. The book is the ticket. That's deliberate. I want people who will read, not people who collect Zoom links.

WHERE TO GET IT
royalprincehub.com/all-books

I built the bookstore, the reader, and the interactive chapters on the same platform. I pair with Cursor every day. This book is me teaching that workflow without pretending AI replaces judgment.

Buy the book. That's your seat.`,
        hashtags: ['buildwithai', 'webdev', 'Cursor', 'workshop', 'buildinpublic', 'Nigeria'],
        series: [
          `I wrote a new book: Build with AI: From Zero to Full-Stack Developer with Cursor.

It teaches the way I actually ship: MERN stack (MongoDB, Express, React, Node) plus Cursor as a pair, not a magic button.

14 chapters + a glossary. Fundamentals first, then you build. Chapters 4–6 have live UI in the reader, the same components from royalprincehub.com, so you see a real site then copy the path.

Auth, .env, deploy (Vercel + Render), debugging, admin, custom domain. The stuff tutorials skip.

I wrote it for beginners and creators, not professors. The same platform that sells the book is the case study inside the book.

royalprincehub.com/all-books

Buy it there.`,
          `The book is the ticket.

I'm running a 3-day online workshop on building with AI. You don't RSVP a Google Form. You buy Build with AI on royalprincehub.com. That purchase is your seat.

Why: I want people who will read the material, not people who collect Zoom links and vanish.

Three days, online. The book is the syllabus. The workshop is the room: live prompting in Cursor, getting unstuck, shipping something you can open on your phone.

No book, no seat. That's the deal.

royalprincehub.com/all-books

If you've been waiting to "finally learn to build," this is the door. Buy the book. Show up.`,
        ],
        media: [
          {
            type: 'screen-recording',
            description: 'Book page + interactive chapter demos + checkout. End on workshop = buy the book.',
            shots: [
              'all-books, Build with AI cover',
              'Chapter list (14 + glossary)',
              'Interactive chapter 5 live UI',
              'Buy / pay',
              'On-screen: book = workshop ticket',
            ],
          },
        ],
        notes: 'Do not invent workshop dates. Book is the ticket. Price in app is ₦1000. Confirm live price before posting if it changed.',
      },
      twitter: {
        content: `New book: Build with AI (Cursor + full-stack).\n\nThe book is the ticket to my 3-day online workshop.\nNo book, no seat.\n\nroyalprincehub.com/all-books`,
        hashtags: ['buildwithai', 'Cursor', 'webdev'],
        thread: [
          `New book: Build with AI: From Zero to Full-Stack with Cursor.\n\n14 chapters. Live UI in the reader. Same stack as royalprincehub.com.\n\nroyalprincehub.com/all-books`,
          `The book is the ticket to my 3-day online workshop.\n\nBuy on royalprincehub.com. That's your seat.\nNo book, no Zoom.\n\nroyalprincehub.com/all-books`,
        ],
        media: [{ type: 'image', description: 'Book cover + "book = workshop ticket" card' }],
      },
      facebook: {
        content: `I have a new book: Build with AI: From Zero to Full-Stack Developer with Cursor.

It is how I actually build websites, with AI as a partner, not as a replacement for thinking. 14 chapters. You see real UI in the book, then you build.

I'm also running a 3-day online workshop. The book is the ticket. You buy the book on my site, that's how you get into the workshop. I don't want a room full of people who never opened the material.

If you've been saying you want to learn to build, this is the door.

royalprincehub.com/all-books`,
        hashtags: ['buildwithai', 'webdev', 'workshop', 'Nigeria'],
        media: [{ type: 'video', description: 'Flip through chapters + say clearly: buy the book to join the 3-day workshop' }],
      },
      instagram: {
        hook: 'The book is the ticket',
        content: `Build with AI. New book.

From zero to full-stack, with Cursor as your pair.

14 chapters + glossary
Live UI inside the reader
Same stack I used to build royalprincehub.com

THE DEAL
I'm running a 3-day online workshop.
You buy the book → that's your seat.
No book, no workshop.

I want people who will read, not people who collect Zoom links.

royalprincehub.com/all-books

Link in bio.`,
        hashtags: ['buildwithai', 'cursorai', 'webdev', 'workshop', 'learnwithme', 'buildinpublic'],
        media: [
          {
            type: 'carousel',
            description: 'Cover, chapter list, live demo screenshot, workshop ticket slide',
            shots: ['Cover', '14 chapters', 'Live demo in reader', 'Book = ticket', 'URL'],
          },
        ],
      },
      tiktok: {
        hook: "My 3-day workshop has one ticket: you buy the book",
        content: `Build with AI is out.

I teach you to ship real sites with Cursor, the way I built royalprincehub.com.

14 chapters. Live UI in the book.

3-day online workshop: buy the book, you're in. Don't buy, you're not.

royalprincehub.com/all-books`,
        hashtags: ['buildwithai', 'cursor', 'webdev', 'learnontiktok'],
        media: [
          {
            type: 'video',
            description: 'Hook in 2s, flip chapters, point at buy button, say book = ticket',
            shots: ['Hook', 'Reader demo', 'Buy', 'Workshop line'],
          },
        ],
      },
      whatsapp: {
        content: `New book: Build with AI.

It's also the ticket to my 3-day online workshop. Buy the book, you're in.

royalprincehub.com/all-books`,
        series: [
          `New book: Build with AI (full-stack + Cursor).

14 chapters. You see real UI in the reader, then you build. Same stack I used to ship royalprincehub.com. Written for beginners, not professors.

royalprincehub.com/all-books`,
          `My 3-day online workshop: the book is the ticket.

Buy Build with AI on royalprincehub.com. That purchase is your seat.
No book, no workshop. I want people who will read, not collect Zoom links.

royalprincehub.com/all-books`,
        ],
        media: [{ type: 'image', description: 'Cover + "book = workshop ticket"' }],
      },
    },
  },
  {
    id: 'rph-portfolio-homepage',
    title: 'My homepage is the portfolio now: one URL for work, writing, and tools',
    topic: 'Hiring signal',
    summary:
      'royalprincehub.com homepage is the portfolio: Ownership / Curiosity / Execution, shipped products (Flier Studio, TestMancer, Smartboard, Taskboard), case studies, writing, contact. Built as a real product, not a template.',
    tags: ['portfolio', 'hiring', 'buildinpublic', 'product'],
    createdAt: '2026-08-30',
    status: 'ready',
    sourceWriteUp:
      'Post about the portfolio on the home page. Work, products, writing, tools in one place.',
    platforms: {
      linkedin: {
        content: `I turned the homepage of royalprincehub.com into my portfolio. Not a /portfolio subpage you never send. The front door.

Three words at the top: Ownership. Curiosity. Execution. That's the filter I use on work, not a slogan I hired a copywriter for.

WHAT'S ON THE PAGE
You can scroll one URL and see:

• Who I am: Growth Officer / product builder. I sit with a problem until I understand it, then I ship.
• Trusted-by row: Accessible Publishers, Smart Edu Hub, Smipay, Facity, Oxygen FM, TestMancer. Real orgs, not logos for decoration.
• What I built: Flier Studio (template fliers people actually export), TestMancer (LMS + smart board, 3,000+ users), Smartboard (handwriting + voice math), Taskboard and Noteboard on this same site, WifMart, Accessible Knowledge Hub.
• Case studies with the challenge, what we did, what happened. Not "I am passionate about synergy."
• Leadership timeline, skills, The Compass on Oxygen FM, writing, testimonials, how I think, what I'm focused on now, the stack, a contact section.

Sidebar nav. Scroll progress. Dark / light. It behaves like a product because it is one.

WHY THIS INSTEAD OF A PDF
A CV is a list. This page is proof. You can leave the homepage and open Taskboard, read a book, or click through to Flier Studio. Same Google account. Same platform.

I built it in React, on the same MERN stack as the rest of the hub. The book I'm teaching (Build with AI) even embeds live pieces of this homepage in the reader, so students aren't looking at fake mockups.

I pair with Cursor. I still decide the story, the sections, and what I'm willing to put my name on.

If you hire builders, send this URL, not a "portfolio coming soon."

royalprincehub.com

Open to work, collaboration, and product roles globally. If something on the page should be sharper, tell me. I'd rather hear it than polish in private.`,
        hashtags: ['portfolio', 'buildinpublic', 'hiring', 'softwareengineer', 'product'],
        series: [
          `I turned royalprincehub.com into the portfolio. The homepage. Not a hidden /portfolio link.

Ownership. Curiosity. Execution.

One scroll: who I am, who I've worked with, what I shipped, case studies, writing, how I think, how to reach me.

Products on the page are live: Flier Studio, TestMancer (3,000+ users), Smartboard, Taskboard, Noteboard, the bookstore. You can leave the hero and actually use the tools.

I got tired of sending a PDF that can't prove I ship.

royalprincehub.com

If you hire builders, that's the URL. Open to work and collaboration globally.`,
          `The portfolio on royalprincehub.com is a product, not a template I forked and swapped the name.

It's the same React app as the books, blog, Taskboard, and Noteboard. Dark/light. Section nav. Scroll progress. Case studies with challenge → work → result.

I put the trusted-by logos I can stand behind: publishing, edtech, fintech, radio. I put TestMancer's 3,000+ users because that's a number I can defend. I put Taskboard on the same domain because I want you to try the work, not only read about it.

The Build with AI book embeds live slices of this homepage in the reader. Students inspect the real hero, not a Dribbble shot.

I build with Cursor. The narrative is mine: proof over adjectives.

royalprincehub.com

If you're a founder or hiring manager who wants someone who ships and then keeps the lights on, that's the page. DMs open.`,
        ],
        media: [
          {
            type: 'screen-recording',
            description: 'Slow scroll of homepage: hero, trust, projects, case studies, contact',
            shots: [
              'Hero: Ownership / Curiosity / Execution',
              'Trusted by logos',
              'Projects (Flier Studio, TestMancer, Taskboard)',
              'Case study cards',
              'Contact',
            ],
          },
        ],
        notes: 'Film desktop homepage. Optional second clip: tap into Taskboard from the same site.',
      },
      twitter: {
        content: `My homepage is the portfolio now.\n\nOwnership. Curiosity. Execution.\n\nShipped work, case studies, writing, tools you can open (Taskboard, books).\n\nroyalprincehub.com`,
        hashtags: ['buildinpublic', 'portfolio', 'hiring'],
        thread: [
          `My homepage is the portfolio now.\n\nOwnership. Curiosity. Execution.\n\nWork, writing, and tools on one URL. Not a PDF.\n\nroyalprincehub.com`,
          `On that page: Flier Studio, TestMancer (3k+ users), Smartboard, Taskboard, Noteboard.\n\nSame site. You can use the products.\n\nOpen to work globally.\nroyalprincehub.com`,
        ],
        media: [{ type: 'screen-recording', description: '15 sec hero + scroll projects' }],
      },
      facebook: {
        content: `I rebuilt the front of royalprincehub.com as my actual portfolio.

You land on the homepage and you see the work: Flier Studio, TestMancer, Smartboard, Taskboard, the books. Not a separate "portfolio" nobody visits.

Ownership. Curiosity. Execution. That's how I work.

If you've been asking what I do, send people that URL. If you're hiring or you know someone who is, that's also the URL.

royalprincehub.com`,
        hashtags: ['portfolio', 'buildinpublic', 'hiring'],
        media: [{ type: 'screen-recording', description: 'Scroll the homepage on desktop' }],
      },
      instagram: {
        hook: 'The portfolio is the homepage',
        content: `royalprincehub.com

Ownership.
Curiosity.
Execution.

One page:
• Work I've shipped
• Case studies
• Writing
• Tools you can actually open (Taskboard, Noteboard, books)

Not a PDF. Not a coming-soon page.

Flier Studio · TestMancer (3,000+ users) · Smartboard · this hub.

I build with Cursor. I still own the story.

Open to work & collab. Link in bio.`,
        hashtags: ['portfolio', 'buildinpublic', 'softwareengineer', 'webdev', 'hiring'],
        media: [
          {
            type: 'carousel',
            description: 'Hero, projects, case study, tools, CTA',
            shots: ['Hero three words', 'Trust logos', 'Project cards', 'Taskboard', 'Contact'],
          },
        ],
      },
      tiktok: {
        hook: "I don't have a portfolio page. The homepage is the portfolio",
        content: `royalprincehub.com

Ownership. Curiosity. Execution.

Scroll: real products, case studies, writing, tools you can click into.

I got tired of sending PDFs.

Open to work globally. Link in bio.`,
        hashtags: ['portfolio', 'coding', 'buildinpublic', 'hiring'],
        media: [
          {
            type: 'screen-recording',
            description: '30–45 sec scroll with hook on screen',
            shots: ['Hook', 'Hero', 'Projects', 'URL'],
          },
        ],
      },
      whatsapp: {
        content: `I made the homepage the portfolio.

royalprincehub.com

Work, writing, Taskboard, books. One URL. If anyone asks what I do, send them that.`,
        series: [
          `Homepage is the portfolio now.

Ownership. Curiosity. Execution.

Work, writing, Taskboard, books. One URL you can actually send. Not a PDF. Not coming soon.

If anyone asks what I do, send royalprincehub.com`,
          `If someone asks what I built: Flier Studio, TestMancer (3,000+ users), Smartboard, Taskboard, Noteboard, the books.

It's all on royalprincehub.com. That's the link to send. Open to work and collab.`,
        ],
        media: [{ type: 'image', description: 'Homepage hero screenshot' }],
      },
    },
  },
  {
    id: 'handwriting-whiteboard-math-agent',
    title: 'I built a hand-writing whiteboard for teachers, and replaced Gemini with my own math agent',
    topic: 'Build log',
    summary:
      'Touchscreen whiteboard for PC and TV. Gemini solved equations but got too expensive. Built a 6-layer math agent, local ONNX OCR, and a geometry pipeline, trig rendering still fighting me after 5 hours.',
    tags: ['whiteboard', 'math-agent', 'handwriting', 'ocr', 'geometry', 'buildinpublic'],
    createdAt: '2026-08-28',
    status: 'ready',
    sourceWriteUp: `${RAW_VOICE_SAMPLES[0]}\n\n${RAW_VOICE_SAMPLES[1]}`,
    platforms: {
      linkedin: {
        content: `I built a touchscreen whiteboard for PC and TV that lets teachers write with their hand, like a classroom board, but the software understands what you draw and can help you teach.

Not a PDF viewer. Not a blank canvas with no structure. You draw on a full-screen board, finger, stylus, or touch TV, and the system reads your handwriting and responds.

I'm building this in public. I also use AI tools (Cursor, AI pair programming) to move faster, but I still architect, debug, and own the hard problems.

THE BOARD
I used the Pointer Events API (how the browser tracks finger/stylus/mouse input), not legacy touch handlers. Mouse drawing is off by default, touch and stylus auto-enable it. That matters on a classroom TV where you don't want accidental mouse hover turning into ink. Every stroke saves as structured data, points, color, width, not a screenshot. Auto-save every 3 seconds. Reopen the board and it redraws stroke by stroke. 1920×1080 canvas for projectors and touch TVs.

WHY I LEFT GEMINI
I started by using Gemini AI to solve any equation written on the board. It worked. But at classroom scale, every stroke, every question, every follow-up, the API bill got too expensive. So I built my own math tutor from scratch that runs on my website.

It's a 6-layer pipeline: understand what the student asked → remember the conversation → pull lesson knowledge from the database → solve with deterministic code → pick a teaching style (guided, Socratic, hint) → render structured steps on the board.

Quadratics, linear equations, geometry, trig, same input gives the same steps every time. Zero API cost per math turn. Gemini stays for open-ended subjects like English.

HANDWRITING → SOLVABLE TEXT
This is the hardest and most interesting part.

Equations go through local OCR in the browser (software that turns handwriting into text, using ONNX models, no API call per stroke). Side-length digits beside shapes? Different job entirely. I had to classify stroke roles first, is this a shape edge, a label, an angle mark, or noise?, before OCR runs. I literally had a bug where a handwritten "2" came back as "mmm" because I was feeding angle marks into an equation model trained on expressions, not isolated digits.

THE GEOMETRY FIGHT 😭
Rendering handwritten geometry and trigonometry has been the toughest challenge. I've done a lot of research and tried so many methods but it keeps failing.

My current approach: shape recognition from hand-drawn lines + OpenCV.js for polygon corners, fused together, then a teaching overlay that draws textbook-quality right-angle squares aligned to the actual triangle legs, not generic boxes.

The one you saw in my demo took me 5 hours just to get to this level. I haven't even gotten it right yet. I'll continue tomorrow.

WHAT MAKES THIS DIFFERENT
- Nigeria-first: 176 NERDC math topics (Primary 1 → SS 3) built into the app
- Handwriting is the input, not an afterthought
- Smart about AI: my own agent for math, Gemini for language, local OCR to cut cost
- Honest about what's broken, teachers deserve tools that work, not demos

I'm open to work, collaboration, and feedback, whether you're a founder looking for a builder, an edtech team, or an engineer who's solved handwritten geometry before. DM me or comment.`,
        hashtags: ['buildinpublic', 'edtech', 'webdev', 'Nigeria', 'NERDC', 'softwareengineer'],
        media: [
          {
            type: 'screen-recording',
            description: 'Full demo: curriculum browse → draw on board → agent solves → geometry attempt',
            shots: ['Pick JSS topic', 'Draw equation', 'Agent steps', 'Geometry struggle'],
          },
        ],
      },
      twitter: {
        content: `I built a touchscreen whiteboard for teachers, write by hand on PC/TV, 176 NERDC topics built in.\n\nStarted with Gemini to solve equations. Too expensive at scale.\n\nBuilt my own math agent + local OCR in the browser.\n\nHardest fight: handwriting → solvable text.\nGeometry/trig? 5 hrs yesterday, still not right 😭\n\nBuilding with Cursor + AI. Open to work globally.`,
        hashtags: ['buildinpublic', 'edtech', 'webdev'],
        media: [{ type: 'screen-recording', description: '30 sec: draw equation → steps appear' }],
      },
      facebook: {
        content: `I've been building a touchscreen whiteboard for teachers, you write with your hand on a PC, phone, or touch TV, and the software understands what you drew.

This is for Nigerian classrooms. 176 NERDC math topics built in. Pick JSS 2 → Pythagoras → full-screen board.

First I used Gemini AI to solve equations on the board. It worked, but the API cost at classroom scale was too much. So I built my own math tutor, deterministic solvers, session memory, teaching modes, zero cost per math turn.

The hardest part is handwriting → text. I run OCR locally in the browser. Geometry labels need a separate pipeline, I classify each stroke's role before reading it. Real bug: "2" came back as "mmm".

Geometry rendering? 5 hours yesterday. Still not right. 😭

I also build with AI tools (Cursor) to move faster, but I architect and debug the hard stuff myself.

Open to work, collaboration, and feedback. Share if you know someone hiring a builder who ships for real users.`,
        hashtags: ['buildinpublic', 'edtech', 'Nigeria', 'coding'],
        media: [
          {
            type: 'screen-recording',
            description: '2–3 min walkthrough attached to post',
            shots: ['Curriculum browse', 'Board drawing', 'Math agent response'],
          },
        ],
      },
      instagram: {
        hook: 'I built a whiteboard that reads your handwriting, for teachers 🇳🇬',
        content: `Smart Board, write with your hand, software helps you teach.

What I built:
✍️ Touchscreen whiteboard (PC, phone, TV)
📚 176 NERDC math topics
🧮 Custom math agent (ditched Gemini, too expensive)
🔍 Local handwriting OCR in browser
😭 Geometry rendering, 5 hrs, still fighting it

The story:
→ Gemini solved equations but API cost killed it
→ Built my own 6-layer math tutor
→ Hardest code: handwriting → solvable text
→ Building with Cursor + AI, engineering the hard parts myself

For teachers. For classrooms. Built in Nigeria, positioning globally.

Open to work & collab, DM me.`,
        hashtags: ['buildinpublic', 'webdev', 'edtech', 'nigerianteachers', 'softwareengineer', 'nerdc'],
        media: [
          {
            type: 'carousel',
            description: '5-slide carousel or 60-sec reel',
            shots: ['Writing on board', 'Equation recognized', 'Agent steps', 'Curriculum browser', 'Open to work CTA'],
          },
          { type: 'screen-recording', description: 'Reel: draw → solve in 30 sec' },
        ],
      },
      tiktok: {
        hook: "I replaced Gemini with my own math agent because the API bill was killing me",
        content: `Building a touchscreen whiteboard for teachers in Nigeria 🇳🇬

You write by hand → software reads it → math tutor helps you teach

176 NERDC topics built in
Own math agent (not paying Gemini per question)
Local OCR in browser
Geometry? 5 hours yesterday still not right 😭

I build with Cursor + AI but I own the hard problems

Open to work globally, link in bio`,
        hashtags: ['buildinpublic', 'coding', 'edtech', 'techtok'],
        media: [
          {
            type: 'screen-recording',
            description: '60-90 sec demo with hook in first 2 seconds',
            shots: ['Hook text', 'Draw equation', 'Agent solves', 'Curriculum scroll', 'Geometry fail + CTA'],
          },
        ],
      },
      whatsapp: {
        content: `Built a touchscreen whiteboard for teachers, write with your hand on PC or TV. 176 NERDC math topics in the app 🇳🇬

Started with Gemini to solve equations. API cost too high → built my own math agent instead.

Hardest part: handwriting → text the computer can solve. Geometry still broken after 5 hrs yesterday 😭

Building with Cursor + AI. Open to work, collab, referrals 🙏

Screen recording attached.`,
        media: [{ type: 'screen-recording', description: '30-60 sec board demo', shots: ['Draw equation', 'See steps appear'] }],
      },
    },
  },
  {
    id: 'nerdc-curriculum-board',
    title: 'I mapped 176 NERDC math topics into a whiteboard, not another blank canvas',
    topic: 'Product',
    summary:
      'Teachers browse Primary 1 through SS 3, pick a topic, and open it on a full-screen board. Curriculum ships with the code, 176 mathematics topics versioned in the repo.',
    tags: ['edtech', 'nigeria', 'curriculum', 'nerdc', 'teachers'],
    createdAt: '2026-08-28',
    status: 'ready',
    platforms: {
      linkedin: {
        content: `Most classroom software in Nigeria is either a PDF viewer or a blank whiteboard with no structure.

I didn't want either. I built Smart Board so a teacher can open the app, pick Mathematics, select JSS 2, tap "Pythagoras Theorem", and land on a full-screen interactive board ready to teach.

THE CURRICULUM IS IN THE CODE
I mapped 176 NERDC mathematics topics into the repo itself. Primary 1 through SS 3. Grouped by theme: Number and Numeration, Algebraic Processes, Mensuration and Geometry, Everyday Statistics, and more. Not fetched from an API, versioned with every deploy.

Browse flow: Subject → Class (Pry 1, JSS 2, SS 3…) → Topic → board opens with lesson metadata attached (subject, education level, tags). That metadata flows into the math tutor so difficulty and teaching style match the class.

WHY THIS MATTERS
A blank canvas puts the burden on the teacher to know what to teach and where to find it. A PDF viewer gives content but no interaction. I wanted the middle: structured curriculum + live board where you write, draw, and the system helps.

Mathematics is live. English, Basic Science, and Physics are scaffolded in the UI as coming soon, same NERDC framing, ready when I ship them.

WHAT'S UNDER THE HOOD
React + TypeScript frontend. Express + MongoDB backend. Strokes auto-save every 3 seconds. Default canvas 1920×1080, sized for projectors and touch TVs. Focus mode strips chrome for classroom projection.

For teachers: one tap from "what am I teaching today?" to "I'm on the board." For founders and hiring managers: this is what building for real users in emerging markets looks like, start from the syllabus, not a template.

I use AI tools to build faster (Cursor, AI-assisted coding), but the curriculum mapping, UX flow, and product decisions are mine.

Open to conversations, edtech teams, schools in Nigeria, founders who need a product builder, or engineers who want to collaborate on the next subjects. DM me.`,
        hashtags: ['edtech', 'Nigeria', 'NERDC', 'teachers', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: 'Browse curriculum → open topic → board', shots: ['Home', 'JSS 2 topics', 'Board opens'] }],
      },
      twitter: {
        content: `I didn't build another blank whiteboard.\n\n176 NERDC math topics in the app.\nPrimary 1 → SS 3. Pick class → pick topic → full-screen board.\n\nCurriculum ships with the code.\n\nBuilt for Nigeria. Open to work globally. #edtech #Nigeria #buildinpublic`,
        hashtags: ['edtech', 'Nigeria', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: '15 sec curriculum browse clip' }],
      },
      facebook: {
        content: `Working on Smart Board for Nigerian classrooms.

Instead of hunting through PDFs or starting from a blank screen, you browse the NERDC curriculum, Primary, JSS, SS, select your class and topic, and open it on an interactive board.

I mapped 176 mathematics topics into the app. Grouped by theme. Versioned in the code so curriculum updates ship with the product.

Mathematics is live now. When you open a topic, the board knows your subject and education level, that flows into the math tutor too.

English, Basic Science, Physics coming next. Built for teachers who already work from NERDC.

I build with AI tools (Cursor) but product decisions are mine. Open to work and collaboration globally.`,
        hashtags: ['edtech', 'Nigeria', 'teachers'],
        media: [{ type: 'screen-recording', description: 'Walkthrough: pick topic → teach on board' }],
      },
      instagram: {
        content: `Smart Board, teach from the NERDC curriculum on one board 🇳🇬

📚 176 math topics mapped
🏫 Primary 1 → SS 3
👆 Pick topic → full-screen canvas
💾 Strokes auto-save

Not a PDF viewer.
Not a blank whiteboard.
Structured curriculum + live interaction.

Math is live. More subjects coming.

Built in Nigeria. Open to global work & collab.`,
        hashtags: ['edtech', 'nigerianteachers', 'nerdc', 'buildinpublic', 'webdev', 'teachers'],
        media: [{ type: 'carousel', description: '4 slides: browse → pick → board → teach', shots: ['Curriculum', 'Topic list', 'Board', 'Drawing'] }],
      },
      tiktok: {
        hook: 'I put the entire NERDC math syllabus inside a whiteboard app',
        content: `176 topics. Primary to SS 3. Tap a topic → start teaching on a full-screen board. Built for Nigerian classrooms, positioning globally. Open to work 🌍 #edtech #Nigeria #buildinpublic`,
        hashtags: ['edtech', 'Nigeria', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: '30 sec: scroll topics → tap → draw', shots: ['Scroll topics', 'Tap', 'Draw'] }],
      },
      whatsapp: {
        content: `Smart Board now has 176 NERDC math topics, Primary to SS 3 🇳🇬

Pick subject → class → topic → full-screen board. Not a PDF. Not blank.

Math is live. More subjects coming. Building in public.

Open to work & referrals if you know teams hiring product builders 🙏`,
        media: [{ type: 'screen-recording', description: 'Attach topic browse clip' }],
      },
    },
  },
  {
    id: 'stroke-persistence',
    title: 'Every line on my whiteboard is JSON, not a screenshot',
    topic: 'Engineering',
    summary:
      'Strokes store as structured data in MongoDB, points, pressure, timestamp per point. Auto-save every 3s. Full replay on load. Trade-off: replay cost grows with long lessons.',
    tags: ['mongodb', 'canvas', 'architecture', 'strokes'],
    createdAt: '2026-08-27',
    status: 'ready',
    platforms: {
      linkedin: {
        content: `When a teacher closes their whiteboard and opens it again the next day, every line they drew should still be there, exactly as they left it. That's what I optimized for on Smart Board.

I don't screenshot the canvas. I store every stroke as structured data.

In plain terms: each line you draw is saved as a list of points (x, y, how hard you pressed, when) plus color and width. When the board reopens, the app redraws every stroke on a 1920×1080 canvas, sized for projectors and touch TVs. No PNG. No flat image.

WHY I CHOSE THIS (even if you're not technical)
- Smaller files than saving a picture every few seconds
- You can erase one line without wiping the whole board
- The handwriting recognition and math tutor need the raw stroke data, a screenshot would block that
- You can see how much was drawn in a session (useful later for analytics)

HOW IT WORKS (for engineers)
Frontend: usePointerDrawing captures pointer events with pressure and coalesced samples. useBoardPersistence debounces saves, 3 seconds after the last change, PUT /api/boards/:id with the full strokes array.

Backend: Mongoose Board model stores strokes inline, plus lessonMeta (subject, educationLevel), recognizedText, and aiHistory (text, handwriting, or voice inputs with responses). Index on owner + updatedAt for listing boards.

TRADE-OFFS I'M WATCHING
Replay cost grows with stroke count. A 45-minute lesson with heavy drawing means a bigger document and slower initial load. Next steps: chunking old strokes, compressing point arrays, or archiving settled strokes separately.

Full-array PUT is simple but not optimal at scale. Fine for now, I'll optimize when teachers hit the limit.

I build with AI tools (Cursor, AI pair programming) but architecture decisions like this, stroke data over screenshots, are deliberate engineering choices.

If you've solved canvas persistence at scale, or you're hiring a builder who thinks about trade-offs before optimizing prematurely, let's talk. Comments and DMs open.`,
        hashtags: ['webdev', 'MongoDB', 'canvas', 'architecture', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: 'Draw → reload page → strokes replay', shots: ['Draw lines', 'Refresh', 'Replay'] }],
      },
      twitter: {
        content: `My whiteboard doesn't save PNGs.\n\nEach stroke = JSON in MongoDB.\n{x, y, pressure, timestamp} per point.\n\nReopen → replay strokes on canvas.\nAuto-save every 3s.\n\n#webdev #MongoDB #buildinpublic`,
        hashtags: ['webdev', 'MongoDB', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: 'Show network save + reload replay' }],
      },
      facebook: {
        content: `Technical decision on Smart Board: store strokes as data, not screenshots.

Every line becomes a JSON object, points with x, y, pressure, timestamp, plus color, width, tool type. Saved to MongoDB. When a teacher comes back, the app redraws each stroke on a 1920×1080 canvas.

Why? Smaller than images. Erasable per stroke. And my OCR/agent pipeline needs the stroke data anyway.

Auto-saves every 3 seconds after changes. Trade-off: very long lessons mean bigger documents. Working on compression when that becomes real.

I use AI tools to build faster but decisions like this are deliberate engineering.

Open to work and feedback from other builders.`,
        hashtags: ['webdevelopment', 'mongodb', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: 'Demo save and reload' }],
      },
      instagram: {
        content: `How I persist a whiteboard without PNGs 👇

Each stroke = structured JSON
→ points with x, y, pressure, timestamp
→ saved to MongoDB
→ replayed on load

Auto-save every 3 seconds.
Default canvas: 1920×1080 (projector/TV sized).

Why not screenshots?
• smaller files
• erase individual paths
• OCR needs stroke data anyway
• stroke count per lesson

Trade-off: long classes = bigger docs. Optimizing later.`,
        hashtags: ['webdev', 'mongodb', 'reactjs', 'softwareengineering', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: 'Reel: draw → refresh → strokes replay' }],
      },
      tiktok: {
        hook: "Your whiteboard app shouldn't save screenshots",
        content: `I store every stroke as JSON in MongoDB. {x,y,pressure,timestamp} per point. Reload = full replay. Auto-save every 3s. #webdev #mongodb #coding`,
        hashtags: ['webdev', 'mongodb', 'coding'],
        media: [{ type: 'screen-recording', description: '30 sec: draw, reload, replay', shots: ['Draw', 'Refresh', 'Strokes return'] }],
      },
      whatsapp: {
        content: `Whiteboard strokes save as JSON in MongoDB, not images. Full replay on reload. Auto-save every 3 seconds. Built for long classroom sessions on projectors and TVs 📐

Open to work & referrals if you know teams hiring builders 🙏`,
        media: [{ type: 'screen-recording', description: 'Attach reload demo clip' }],
      },
    },
  },
  {
    id: 'math-without-llm',
    title: 'I built a math tutor that does not call an API to solve equations',
    topic: 'Engineering',
    summary:
      '6-layer agent: intent → conversation → knowledge → deterministic solvers → teaching modes → structured blocks. Gemini stays for English. Math runs free, deterministic, with session memory.',
    tags: ['agent', 'math', 'architecture', 'gemini', 'cost'],
    createdAt: '2026-08-26',
    status: 'ready',
    platforms: {
      linkedin: {
        content: `AI is great at explaining Shakespeare. It should not be the only thing solving 2x² + 5x − 3 = 0 in a classroom, especially when you're paying per question.

I built a math tutor for Smart Board that solves with code first, and only uses cloud AI when the subject actually needs open-ended language. This is a product decision and a cost decision. It's also how I think about building with AI in general: use it where it helps, replace it where it doesn't.

THE PIPELINE (simplified)
When a student asks something, the system:

1. Figures out what they want (start a problem, ask why, request a hint…), no AI API call
2. Remembers the conversation ("why is b 5?" links back to the active problem)
3. Pulls lesson knowledge from the database
4. Solves with deterministic code, quadratics, linear, geometry, trig
5. Picks a teaching style (guided, Socratic, hint…)
6. Renders structured steps on the board, not a chat bubble wall of text

Same equation → same steps every time. Zero API cost per math turn.

WHY NOT JUST GEMINI FOR EVERYTHING
I tried. It worked for demos. At classroom scale the bill adds up. Worse: the model sometimes invents algebra steps. In a classroom that's not acceptable.

So Gemini handles English, biology, open-ended explanations. My agent handles math with session memory across 24-hour sessions.

FOR TEACHERS
Reliable step-by-step solutions. The tutor remembers where you are. Equations render on the board like a real lesson.

FOR ENGINEERS
17 intents, 6 teaching modes, 10 response block types, MongoDB knowledge base, deterministic solvers. The hardest part wasn't plugging in an API, it was separating parsing, solving, pedagogy, and presentation into layers.

I also use AI tools (Cursor, AI pair programming) to build this faster, but the architecture and solver logic are engineered, not generated and shipped blind.

Open to work, collaboration, and technical conversations. If you're building edtech, hiring product engineers, or want to recommend someone who knows when NOT to use AI, I'd love to connect.`,
        hashtags: ['softwareengineering', 'edtech', 'agents', 'math', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: 'Quadratic solve + follow-up on board', shots: ['Equation', 'Steps', 'Why follow-up'] }],
      },
      twitter: {
        content: `Built a 6-layer math agent that never calls an API to solve.\n\nDeterministic solvers. Session memory.\nGemini stays for English.\n\nSame equation → same steps every time. Zero cost per math turn.\n\n#buildinpublic #edtech #webdev`,
        hashtags: ['buildinpublic', 'edtech', 'webdev'],
        media: [{ type: 'screen-recording', description: 'Demo solve on board' }],
      },
      facebook: {
        content: `On Smart Board I built a math tutor that doesn't send every question to Gemini.

Intent detection → conversation memory → MongoDB knowledge → deterministic solvers → teaching mode → structured blocks on the board.

Quadratics, linear, geometry, trig, same input, same steps, no API cost per turn. Gemini handles subjects that need open language. My agent handles math with session memory ("why is b 5?" actually works mid-lesson).

I started with Gemini for everything. API cost and inconsistent algebra pushed me to build this. Knowing when not to use AI matters.

I use AI tools to build faster. The engineering is mine.

Open to work, collaboration, and referrals.`,
        hashtags: ['edtech', 'programming', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: 'Full tutor demo on board' }],
      },
      instagram: {
        content: `Math tutoring without sending every step to an LLM.

My Smart Board agent:
1️⃣ Understands the question (no LLM)
2️⃣ Session memory across turns
3️⃣ Knowledge in MongoDB
4️⃣ Deterministic solvers
5️⃣ Teaching modes (guided, Socratic, hint)
6️⃣ Structured blocks on the board

Gemini → English & open subjects
My agent → math, free per turn

Built with Cursor + AI. Engineering = mine.

Open to work 🌍`,
        hashtags: ['edtech', 'softwareengineer', 'math', 'buildinpublic', 'agents', 'webdev'],
        media: [{ type: 'screen-recording', description: 'Reel: equation → steps → follow-up works' }],
      },
      tiktok: {
        hook: 'I turned off Gemini for math and built my own agent instead',
        content: `6 layers. Deterministic solvers. Session memory. Zero API cost per math turn. Gemini only for subjects that need it. Built with AI tools, engineered by me. #coding #edtech #buildinpublic`,
        hashtags: ['coding', 'edtech', 'buildinpublic'],
        media: [{ type: 'screen-recording', description: '45 sec: write → solve → ask why', shots: ['Handwrite equation', 'Steps', 'Follow-up'] }],
      },
      whatsapp: {
        content: `Built a math agent that solves without calling Gemini. Deterministic steps, session memory, zero cost per turn. Gemini stays for English.

Handles quadratics, linear, geometry, trig. Building in public, open to work & referrals 🙏`,
        media: [{ type: 'screen-recording', description: 'Attach board demo clip' }],
      },
    },
  },
  {
    id: 'voice-math-debug-buffer',
    title: 'I stopped trusting Chrome\'s transcript and built a persistent math buffer, with a debug panel to prove it works',
    topic: 'Iteration story',
    summary:
      'Voice math broke when speaking slowly, Chrome kept sending weaker finals that wiped "2x" back to "2". Built a persistent math buffer the app owns, plus a dev debug panel to watch hypotheses, merges, and regression blocks in real time. Screen record the buffer; hide the panel later.',
    tags: ['voice', 'speech-recognition', 'debugging', 'iteration', 'buildinpublic', 'edtech'],
    createdAt: '2026-08-28',
    status: 'ready',
    sourceWriteUp: `Voice math kept breaking when I spoke slowly. Chrome's speech API would show "2x" on screen, then a weaker final result would wipe it back to "2". I built a persistent math buffer the app owns, not the browser transcript, and a debug panel so I could watch every hypothesis, merge, and regression block while iterating. Screen recording the debug panel for the post; I'll comment it out for production but the architecture stays.`,
    platforms: {
      linkedin: {
        series: [
          `I added voice input to my teaching whiteboard so teachers can speak equations instead of writing every symbol.

It worked great when I talked fast.

When I spoke slowly, the way you actually teach a class, it kept breaking.

I'd say "two" … pause … "x minus five equals ten." On screen I'd briefly see 2x − 5 = 10. Then Chrome's speech engine would send a weaker "final" result and wipe my progress back to just "2".

The bug wasn't "voice recognition is bad." The bug was I was treating the browser transcript as the source of truth.

WHAT I CHANGED
I stopped rebuilding the equation from whatever Chrome said last.

Now the app owns a persistent math buffer. Chrome only supplies hypotheses, noisy guesses, interim and final. My pipeline normalizes spoken math ("two ex" → 2x, "equals" doesn't become a stray x), tokenizes it, scores alternatives, and merges new speech into the buffer only when it actually continues the equation.

If a weaker final would regress the buffer, say you already have 2x and Chrome sends 2, the merge is blocked. You keep 2x.

WHY THE DEBUG PANEL EXISTS
I couldn't fix slow speech blind. So I built a dev-only Voice Math Debug panel that logs the whole pipeline live:

• raw SpeechRecognition results (interim vs final)
• normalized tokens after my speech-to-math layer
• persistent buffer BEFORE and AFTER each merge
• REGRESSION_BLOCKED when a bad final gets rejected
• HYPOTHESIS_BREAK when Chrome starts a fresh guess mid-equation
• SEGMENT_COMMIT when a pause finally locks a chunk in

I'm screen recording this panel in my demo so you can watch the buffer hold steady while I speak slowly, digit by digit, operator by operator, even when Chrome wobbles.

That's how I iterated from "trust the transcript" to something that survives real classroom pacing. Brackets, fractions, square roots, inequalities, simultaneous equations, each layer got tests because the debug panel showed me exactly where speech was lying.

I build with AI tools (Cursor, AI pair programming) to move faster. But this architecture, buffer ownership, monotonic merges, regression guards, is engineering I had to reason through while watching real speech fail in slow motion.

The debug UI will come out before production. The buffer stays.

If you're hiring builders who debug hard UX problems properly, or you've fought speech APIs on touch devices, I'd love to connect. DM me or comment.`,
          `The voice math debug panel on my whiteboard isn't a feature for teachers. It's how I debugged slow speech.

Quick context: teachers speak equations on a touchscreen board. Chrome listens. My app turns speech into solvable math and runs it through a local tutor, no API call per step for core algebra.

THE FAILURE MODE (speaking slowly)
Real example from debugging:

1. I say "two" → buffer: 2
2. Pause. Chrome sends interim "2 x" then final "2", weaker than what I already had
3. Without a owned buffer, the equation shrinks. Teachers lose trust instantly.

Slow speech exposes what fast demos hide: SpeechRecognition is a stream of hypotheses, not a ledger.

WHAT THE DEBUG PANEL SHOWS (watch the screen recording)
Amber panel under the mic while voice math mode is on. Every event is timestamped:

SESSION_START → RAW_RESULT → INTERIM_TEXT / FINAL_TEXT → NORMALIZED_TOKENS → PERSISTENT_BUFFER_BEFORE → PERSISTENT_BUFFER_AFTER

When it works you'll see after="2x" even if raw="2".
When a bad final arrives you'll see REGRESSION_BLOCKED, the buffer refuses to shrink.

Other events I lived in for days:
• HYPOTHESIS_BREAK: Chrome replaced "2" with "x" mid-utterance; treat as new fragment, don't rewrite history
• DUPLICATE_SKIPPED: same tokens restated across pauses
• COMMAND_CANDIDATE vs COMMAND_CONFIRMED, "solve" only fires on a confirmed final, never on interim "so"

THE ITERATION ARC (honest)
v1: trust transcript → broke on slow speech
v2: word aliases (ex→x, minus vs nine) → less garbage, still wiped on weak finals
v3: persistent buffer + merge rules → monotonic state
v4: hypothesis scorer picks best alternative among Chrome's guesses
v5: debug panel → finally visible iteration; 138 automated tests locking behavior

Still building: more spoken forms, tighter alias rules, cleaner teacher UX without the debug chrome.

AI helped me write code faster. It didn't tell me to stop trusting the browser.

Open to work, collaboration, and feedback from anyone who's shipped voice on the web. The screen recording attached shows the buffer doing its job, speak slowly, watch the math stick.`,
        ],
        hashtags: ['buildinpublic', 'webdev', 'edtech', 'speechrecognition', 'debugging', 'softwareengineer'],
        media: [
          {
            type: 'screen-recording',
            description: 'Voice math mode with debug panel visible, speak a full equation slowly with pauses between words',
            shots: [
              'Enable voice math on board (dev mode)',
              'Say "two", pause, watch buffer show 2, debug log RAW_RESULT + PERSISTENT_BUFFER_AFTER',
              'Say "x minus five", show merge to 2x - 5',
              'Pause, show REGRESSION_BLOCKED if Chrome sends weaker final',
              'Say "equals ten", buffer completes 2x - 5 = 10',
              'Say "solve", equation solves; debug shows COMMAND_CONFIRMED on final only',
              'Optional: simultaneous eq, "2x plus y equals 7" pause "comma x minus y equals 1"',
            ],
          },
        ],
        notes: 'Post with screen recording attached. Morning = series[0] (story + architecture). Evening = series[1] (debug panel walkthrough). Comment out VoiceMathDebugPanel before prod, mention that in comments if asked.',
      },
      twitter: {
        thread: [
          `Voice math on my whiteboard broke when I spoke slowly.\n\nChrome would show "2x" then send a weaker final "2" and wipe my equation.\n\nFix: the app owns a persistent math buffer. Browser transcript = hypotheses only.\n\nBuilt a debug panel to watch merges + regression blocks live.\n\nScreen recording 👇 #buildinpublic`,
          `Debug panel events I lived in:\n\n• PERSISTENT_BUFFER_BEFORE / AFTER\n• REGRESSION_BLOCKED (weak final rejected)\n• HYPOTHESIS_BREAK (Chrome swapped 2→x)\n• solve only on confirmed final, never interim "so"\n\n138 tests. Debug UI comes out. Buffer stays.\n\nBuilding with Cursor. Engineering the hard parts myself.`,
        ],
        hashtags: ['buildinpublic', 'webdev', 'edtech'],
        media: [{ type: 'screen-recording', description: '30–45 sec: slow speech + debug panel + equation sticks' }],
      },
      facebook: {
        content: `Been fighting voice input on my teaching whiteboard.

Works fine when I talk fast. Breaks when I speak slowly, like a real teacher would.

I'd say "two" … pause … "x minus five equals ten." Chrome briefly shows the right thing, then sends a weaker final result and my equation shrinks back to "2".

The fix wasn't a better mic. I stopped treating the browser transcript as truth.

Now the app keeps its own persistent math buffer. Chrome only sends guesses. My code normalizes spoken math, merges new words into the buffer, and blocks regressions, if you already have 2x, a final "2" gets rejected.

I built a debug panel (dev only) that logs every step: raw speech results, normalized tokens, buffer before/after, when bad finals get blocked. I'm screen recording it so people can see the buffer hold while I speak slowly.

Iteration so far: trust transcript → aliases for mishears → owned buffer → hypothesis scoring → debug visibility → 138 tests.

I use Cursor + AI to ship faster. The architecture decisions are mine.

Open to work, collaboration, and referrals.`,
        hashtags: ['buildinpublic', 'edtech', 'coding', 'Nigeria'],
        media: [{ type: 'screen-recording', description: '2 min: slow voice equation + debug panel visible' }],
      },
      instagram: {
        hook: 'Chrome kept deleting my equation when I spoke slowly 🎤',
        content: `Voice math on Smart Board, speak an equation, local tutor solves it.

Problem: slow speech broke everything.
Chrome sends interim "2x" … then final "2" … equation wiped.

What I built instead:
🧠 Persistent math buffer the app owns
🚫 REGRESSION_BLOCKED, weak finals can't shrink the buffer
🔍 Dev debug panel, watch RAW_RESULT → tokens → buffer before/after live
✅ 138 tests locking spoken math behavior

The debug UI is for engineering (screen recording it for this post). Teachers won't see it in production. The buffer architecture stays.

Iteration: trust transcript → aliases → owned state → hypothesis scoring → visible debugging

I build with Cursor + AI. I own the hard problems.

Open to work & collab, DM me.`,
        hashtags: ['buildinpublic', 'webdev', 'edtech', 'softwareengineer', 'speechrecognition', 'debugging'],
        media: [
          {
            type: 'screen-recording',
            description: 'Reel 45–60 sec: speak slowly, debug panel visible, equation builds correctly',
            shots: ['Hook text overlay', 'Say two… pause… x', 'Debug log scrolling', 'Full equation', 'Solve'],
          },
        ],
      },
      tiktok: {
        hook: "Chrome kept erasing my math equation when I talked slowly",
        content: `Building voice input for a teaching whiteboard 🎤

Fast speech = fine
Slow speech = Chrome sends "2x" then final "2" and wipes everything

I stopped trusting the browser transcript
Built a persistent math buffer + debug panel to watch it work

Screen recording shows the buffer holding while I speak digit by digit

Debug UI comes out before prod. Architecture stays.

Building with Cursor. Open to work globally #buildinpublic #coding #edtech`,
        hashtags: ['buildinpublic', 'coding', 'edtech', 'techtok', 'webdev'],
        media: [
          {
            type: 'screen-recording',
            description: '60 sec vertical: mic on, amber debug panel, slow "2x minus 5 equals 10 solve"',
            shots: ['Hook in first 2 sec', 'Debug panel close-up', 'Equation completes', 'Solve fires'],
          },
        ],
      },
      whatsapp: {
        series: [
          `Voice math update on Smart Board 🎤

Speaking slowly kept breaking equations, Chrome would wipe "2x" back to "2".

Built a persistent math buffer the app owns (browser = guesses only) + a debug panel to watch merges live.

Screen recording attached, speak slowly, watch the math stick.

Building with Cursor. Open to work & referrals 🙏`,
          `How I debugged slow speech on my whiteboard:

Debug panel logs: raw Chrome results → my normalized tokens → buffer before/after → REGRESSION_BLOCKED when bad finals get rejected.

Not a teacher feature, engineering visibility. Coming out before prod. Buffer stays.

138 tests. Still iterating. DM if you're hiring builders who ship real UX fixes.`,
        ],
        media: [{ type: 'screen-recording', description: '30–60 sec board demo with debug panel', shots: ['Slow speech', 'Buffer holds', 'Solve'] }],
      },
    },
  },
  {
    id: 'voice-math-spoken-aliases',
    title: 'One equation, dozens of ways to say it, how I mapped Nigerian speech to solvable math',
    topic: 'Iteration story',
    summary:
      'Voice math isn\'t one word → one symbol. It\'s aliases for Nigerian intonation (tree, fife, nain, mine), multi-word phrases (two x minus five equals), context rules (s→x only after a number), and a confirmed "solve" that fires the local tutor, never on interim speech.',
    tags: ['voice', 'nigeria', 'speech-recognition', 'localization', 'edtech', 'buildinpublic'],
    createdAt: '2026-08-28',
    status: 'ready',
    sourceWriteUp: `Building voice math for Nigerian classrooms means Chrome hears "tree" and you meant three, "mine" and you meant minus, "nain" and you meant nine. One equation takes a whole pipeline, phrase rewriting, context-aware aliases, token gluing across pauses, persistent buffer merges, and "solve" only fires on a confirmed final utterance when both sides of the equation are complete.`,
    platforms: {
      linkedin: {
        content: `Saying "2x − 5 = 10" out loud sounds simple.

Building software that understands it in a Nigerian classroom is not one word → one symbol. It's a whole pipeline, and I had to iterate on every layer while speaking slowly into the mic and watching my debug panel.

THE PROBLEM ISN'T ENGLISH. IT'S HOW CHROME HEARS YOU.
Chrome's speech engine was trained on generic English. Teachers here don't speak like a Silicon Valley demo. Syllables stretch. Consonants soften. Words blur together.

So the same math idea arrives as different strings:

• "two" / "to" / "too" / "tu" → 2
• "three" / "tree" → 3
• "four" / "for" → 4
• "five" / "fife" → 5
• "seven" / "seben" → 7
• "nine" / "nain" → 9
• "zero" / "ziro" → 0
• "one" / "won" / "wan" → 1

And the dangerous ones, words that sound like other math words:

• "minus" / "mine" / "minas" → −  (not nine)
• "ex" / "ecs" / "eks" → x
• "why" / "wye" → y
• "equals" / "equal to" / "is" (after a term) → =

I built a speech alias layer that maps whole words only, never global substring replacement. "example" must not become "xample". A lone "e" from a cut-off "equals" must not inject garbage into the equation.

CONTEXT MATTERS AS MUCH AS THE WORD
The same sound means different things depending on what came before:

• "s" becomes x only after a bare number, "2 s" → 2x, but isolated "s" is dropped (could be noise)
• "r" becomes radius only after pi, "2 pi r" → 2πr, but random "r" is ignored
• "and" becomes + before the equals sign, but becomes a comma after, for simultaneous equations like 2x + y = 7, x − y = 1
• "to" is 2 in "tu" or "two", but "equal to" stays equals, not the digit 2

This is where Nigerian intonation really shows up. You don't say crisp dictionary words. You say "two ex mine fife equals ten" across three breaths, and the system has to glue 2, x, −, 5, =, 10 without treating "mine" as the number nine.

I even added Levenshtein distance for close calls: if Chrome sends something one letter off from "minus" and closer to minus than to "nine", it becomes −.

MULTI-WORD PHRASES, ONE IDEA, MANY SYLLABLES
Single-word aliases aren't enough. Teachers speak in phrases:

• "two x minus five equals x plus two" → 2x − 5 = x + 2
• "two x square" / "two x squared" → 2x²
• "two to the power of x" → 2^x
• "square root of x plus four equals five" → √(x+4) = 5  (must run before "square" → ²)
• "greater than or equal to" → ≥  (longest phrase matched first)
• "open bracket x plus one close bracket" → (x+1)

Longest phrases win. Order matters. "Square root" must not become "² root". "Equal to" must not become "equal 2".

WHAT IT ACTUALLY TAKES TO BUILD ONE EQUATION
When you speak slowly, word by word, this is the path:

1. Chrome sends raw hypotheses (interim + final, often wrong)
2. Multi-word phrase rewriter collapses spoken math into operators
3. Each word resolves through the alias dictionary, context-aware
4. Functions and brackets fold into single terms, sqrt(x+4), (x+1)(x−2)
5. Tokenizer glues across pauses, 2 … x → 2x, 2 … ^ … x → 2^x
6. Persistent buffer merges new speech, blocks regressions when Chrome backtracks
7. Display updates as a draft, equation visible, not yet solved

138 automated tests lock this behavior. I broke it constantly while tuning, "equals" turning into x, "mine" fighting "nine", "so" firing solve too early.

HOW "SOLVE" TRIGGERS THE SOLUTION
The equation stays a draft until you explicitly say solve. That matters for slow speech, you don't want half an equation sent to the solver mid-utterance.

Rules I enforced:

• "solve" / "sol" / "so" / "solv" only confirm on a FINAL result, interim "so" never fires
• Both sides of = must be complete before solve runs
• If you say "2x + 5 = 6 solve", math stays, solve strips off, tutor runs
• If the equation isn't finished, you get a clear message: finish after "=", then say solve
• Only when solve confirms does the equation commit to the board and hit my local math agent, step-by-step solution, no API call per algebra turn

Watch the screen recording: I say "two ex" … pause … "mine fife" … pause … "equals ten" … pause … "solve". Debug panel shows NORMALIZED_TOKENS at each step. The buffer grows. COMMAND_CANDIDATE on interim "so". COMMAND_CONFIRMED only when Chrome finalizes. Then the tutor renders steps on the board.

WHY THIS MATTERS BEYOND MY APP
Generic speech APIs assume one accent, one pace, one way of speaking math. Classrooms don't work that way, especially here. Building for real teachers meant:

• embracing alias diversity instead of fighting it
• owning state instead of trusting the transcript
• separating "building the equation" from "solving the equation"
• testing every mishear I actually heard at the mic

I build with Cursor and AI pair programming to move faster. But which words to accept, which to reject, and when "solve" is allowed, that's product and engineering judgment from sitting with the mic and speaking the way my users speak.

Open to work, collaboration, and conversations with anyone building voice UX for non-default accents. If you've mapped speech for local languages or classrooms, I'd love to hear how you handled it. DM me.`,
        hashtags: ['buildinpublic', 'edtech', 'Nigeria', 'speechrecognition', 'webdev', 'softwareengineer'],
        media: [
          {
            type: 'screen-recording',
            description: 'Speak one equation slowly with accent variations, debug panel shows alias resolution',
            shots: [
              'Say "two ex mine fife equals ten" slowly, show 2x - 5 = 10 in buffer',
              'Say "tree" for three, "fife" for five, "nain" for nine, show aliases resolving',
              'Say "two x minus five equals x plus two" with pauses, full equation builds',
              'Say "2x plus y equals 7" pause "comma x minus y equals 1", simultaneous eq',
              'Say interim "so", debug shows COMMAND_CANDIDATE (held)',
              'Say final "solve", COMMAND_CONFIRMED → tutor steps appear on board',
            ],
          },
        ],
        notes: 'Post 3 in voice math series. Pairs with voice-math-debug-buffer posts. Best with screen recording showing NORMALIZED_TOKENS + solve flow. Can post day after buffer posts.',
      },
      twitter: {
        thread: [
          `Voice math for Nigerian classrooms: one equation, dozens of ways to say it.\n\n"tree"→3, "fife"→5, "nain"→9, "mine"→− (not nine)\n"ex"/"ecs"→x, "why"→y\n\nContext matters: "s"→x only after a number. "and"→+ before =, comma after.\n\nScreen recording 👇`,
          `Building one equation slowly:\n\nphrase rewrite → alias map → fold brackets/sqrt → glue 2…x→2x → persistent buffer → draft\n\n"solve"/"so" only on FINAL utterance. Both sides of = complete. Then local math tutor runs.\n\n138 tests. Built with Cursor. Engineering judgment = mine.`,
        ],
        hashtags: ['buildinpublic', 'edtech', 'Nigeria'],
        media: [{ type: 'screen-recording', description: '45 sec: accent aliases + slow equation + solve' }],
      },
      facebook: {
        content: `Building voice math for teachers in Nigeria taught me that one equation can arrive a dozen different ways.

"two" / "tu" / "to" → 2
"tree" → 3
"fife" → 5
"nain" → 9
"mine" → minus (not nine!)
"ex" / "ecs" → x

Chrome wasn't trained on how we actually speak in class. Syllables stretch. Words blur. So I built a speech-to-math pipeline:

1. Rewrite multi-word phrases ("two x minus five equals" → operators)
2. Map each word through context-aware aliases
3. Glue tokens across pauses (2 … x → 2x)
4. Merge into a persistent buffer the app owns
5. Keep it as draft until you say "solve"

"solve" / "so" / "sol" only fire on a confirmed final, never mid-speech. Equation must be complete. Then my local math tutor runs step-by-step.

I'm screen recording myself speaking slowly with Nigerian intonation so people can see the aliases and buffer working live.

Building with Cursor + AI. The alias rules and solve logic are engineering I iterated at the mic.

Open to work and collaboration.`,
        hashtags: ['buildinpublic', 'edtech', 'Nigeria', 'coding'],
        media: [{ type: 'screen-recording', description: 'Slow speech demo: mine/fife/nain + solve' }],
      },
      instagram: {
        hook: 'Chrome hears "mine", I needed minus, not nine 🇳🇬',
        content: `Voice math on Smart Board, speak an equation, local tutor solves it.

The hard part wasn't speech recognition. It was mapping how Nigerian teachers actually talk into solvable math.

One digit, many sounds:
two / tu / to → 2
tree → 3
fife → 5
nain → 9
mine → − ✅ (not nine ❌)

Variables too:
ex / ecs / eks → x
why / wye → y

Context rules:
• s → x only after a number
• and → + before =, comma after =
• square root before square (phrase order matters)

Pipeline to build one equation:
raw speech → phrase rewrite → aliases → glue across pauses → persistent buffer → draft

"solve" only on FINAL speech. Equation complete. Then tutor runs.

Screen recording shows me speaking slowly, watch tokens resolve.

138 tests. Building with Cursor. Alias rules = mine.

Open to work & collab, DM me.`,
        hashtags: ['buildinpublic', 'edtech', 'nigeria', 'webdev', 'speechrecognition', 'softwareengineer'],
        media: [
          {
            type: 'screen-recording',
            description: 'Reel: say "two ex mine fife equals ten solve" slowly with debug panel',
            shots: ['Hook overlay', 'Alias examples on screen', 'Buffer grows', 'Solve → steps'],
          },
        ],
      },
      tiktok: {
        hook: 'Chrome thinks "mine" means nine, I built voice math for Nigerian teachers',
        content: `Mapping Nigerian speech to math on my whiteboard 🎤

tree→3, fife→5, nain→9, mine→minus
ex→x, why→y

Multi-word phrases: "two x minus five equals ten"
Context: s→x only after a number
Buffer glues across pauses when you speak slowly
"solve" only fires when you finish, not mid-word

Screen recording attached #buildinpublic #coding #edtech #nigeria`,
        hashtags: ['buildinpublic', 'coding', 'edtech', 'nigeria', 'techtok'],
        media: [{ type: 'screen-recording', description: '60 sec vertical: accent words + solve trigger' }],
      },
      whatsapp: {
        content: `Voice math update 🇳🇬

One equation, many ways to say it:
tree→3, fife→5, nain→9, mine→minus (not nine)
ex/ecs→x, why→y

Speak slowly → buffer glues word by word
"solve" only when equation is complete + speech is final

Screen recording attached, watch aliases resolve live.

Building with Cursor. Open to work & referrals 🙏`,
        media: [{ type: 'screen-recording', description: '30–60 sec: slow equation + solve' }],
      },
    },
  },
];

export function getSocialPost(id: string): SocialPost | undefined {
  return SOCIAL_POSTS.find((p) => p.id === id);
}

export function getSocialPostsByTopic(topic: string): SocialPost[] {
  return SOCIAL_POSTS.filter((p) => p.topic === topic);
}

export function getSocialTopics(): string[] {
  return [...new Set(SOCIAL_POSTS.map((p) => p.topic))];
}
