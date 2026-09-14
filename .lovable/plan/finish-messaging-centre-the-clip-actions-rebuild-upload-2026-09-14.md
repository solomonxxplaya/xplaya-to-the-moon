# Finish messaging, centre the clip actions, rebuild Upload

Three pieces of work, continuing from where the last session stopped.

## 1. Friends-only messaging (finish the started work)

The friends helper already exists (only people who follow each other count as friends). What is left:

- **New message** screen: list only friends instead of searching all players. Non-friends never appear.
- **Create group** and **Group settings > add members**: same friends-only list.
- Empty state when someone has no friends yet: "You can only message players who follow each other. Follow someone back to chat."
- Backend rules: a private chat can only be created between two accounts that follow each other, and a group member can only be added if they are a friend of the person adding them. This is enforced server-side, not just hidden in the screens.
- End-to-end test of private chat and group chat with two real accounts: open chat, send, receive live, unread badge, read on open, mute, delete message, leave/remove member, report.

## 2. Clip actions move from the side to a centred bottom bar

Today Like / Comment / Share / options sit in a vertical rail on the right edge, which is cramped on small phones.

New layout on the Home feed:

```text
        [ caption, username, rank, sound ]
   ------------------------------------------------
    (avatar)   Like    Comment   Share    (more)
        centred row, one line, safe-area aware
```

- One horizontal row, centred, sitting just above the bottom navigation, with equal spacing and the count under each glyph.
- Works from 320px up to tablets: the row scales, never wraps, never overlaps the bottom navigation.
- Caption block moves to full width above the row instead of being squeezed by the rail.
- Same behaviour and counts as now — only position and sizing change.

## 3. Upload: familiar short-video flow, XPLAYA look

Target roughly 70% of the flow people already know from TikTok, 30% XPLAYA styling (neon accent, hex/plate shapes, uppercase display type, dark surfaces).

Flow after picking a clip:

1. **Pick** — big select area, plus Gallery / Record / Drafts.
2. **Preview + caption** — large vertical preview on top, caption with hashtag entry underneath, character counter, cover picker with pickable frames from the clip.
3. **Post settings** — who can watch, allow comments, allow duet/stitch-style toggles kept honest (only toggles that actually do something), sound pick.
4. **Sticky bottom bar** — Drafts on the left, Post on the right, with live upload progress on the Post button.

Rules kept as they are: original bytes uploaded to XPLAYA storage, no re-encoding, audio preserved, current size/type limits, existing Firebase post creation. Anything not actually built (trim, effects, in-app camera) is labelled as coming rather than shown as a working button.

## Technical notes

- Friends list comes from `src/lib/friends.ts` (`useFriends`); `chat.new.tsx`, `group.new.tsx`, `group.$id.tsx` swap `searchUsers` for it.
- `firestore.rules`: add mutual-follow checks on conversation create and on `memberIds` growth, using the existing follow documents.
- `VideoFeedItem.tsx`: replace the absolute right rail with a centred flex row; reuse `ActionButton`, adjust sizes and safe-area padding; caption container becomes full width.
- `upload.tsx` restructured into step sections plus a sticky action bar; `uploadMedia`, `captureVideoPoster`, `createVideo`, and `src/lib/r2/limits.ts` behaviour unchanged.
- Verification: typecheck, build, then Playwright runs for `/`, `/upload`, `/inbox`, `/chat/new`, `/group/new` and a two-account chat exchange.

Firestore rules changes take effect once published to Firebase.
