---
tags:
  - index
---
# FADA | فضاء

**Audience Priority:** Arabic-First (RTL & Localization)  
**License & Distribution:** Free, Open Source. No monetization. Official releases only via GitHub.  
**Experience:** Ad-Free. Well-Categorized. User-Friendly [[UI-UX]].

---

## Middleman Architecture

FADA operates as a **streaming middleman**. It does **not** store, nor host.

- **Metadata:** Fetched from public APIs (TMDB / IMDb) to retrieve IDs, descriptions, posters, and categorization.
- **Playback:** IDs are passed to [[Embed Providers]] (e.g., Vidsrc) which return watchable stream URLs.
- **[[More/Scraping Layer]] :** If a source does not offer a direct embed, a scraping layer will extract the stream URL from other third-party sites.

---

## Phases

### P1 - v0.1: Foundation & UI/UX

A fully designed content browser (Movies & Shows) with the following features:

- Intuitive navigation and categorization.
- Search functionality.
- Detailed view: Description, episode lists (for shows), season selection (for movies/series).
- Collections section.
- User Watchlist.
- Preferences & Settings.

**Placeholders for Future Content Types:**

- IPTV section with categorization, EPG (Electronic Program Guide) structure, and channel list UI.
- Manga/Comics viewer layout with chapter lister and details page.
- Live Sports section UI.

*Goal: Establish the front-end groundwork before implementing the player and middleman logic.*

### P2 - v0.2: Backend & VOD Embed System

Implementation of the backend resolver and embed pipeline covering global content:

- **Global Coverage:** Western, European, Asian, Middle Eastern, Korean, Turkish, and more.
- **Provider Fallback Chain:** Automatic switching between multiple embed sources to ensure stream availability.
- **User Data:** Local profile saving and automatic progress tracking for episodes/movies.
- **Subtitles:** Fetching and parsing subtitle files.

*Goal: Make all Movies and TV Shows watchable with a seamless fallback system.*

### P3 - v1.0: Code Refinement & Stabilization

- Code cleanup and removal of redundant logic.
- Simplification of overly complex processes.
- Performance improvements.
- Initial testing and UI/UX tweaks.

*Goal: Prepare a stable, production-ready v1 MVP core.*

### P4 - v1.1: IPTV & Live Content

- Implement IPTV content fetching.
- Live stream architecture.
- Live Sports integration.
- Optimized user experience for live playback (EPG view, channel switching).

### P5 - v1.2: Manga & Comics Reader

- Implement the Manga/Comics reader.
- Chapter navigation and image rendering.
- Integration with aggregation sources.

---

## Arabic-First Design Note

The entire interface is built **Right-to-Left (RTL)** first. Navigation elements, typography, and scrolling behavior prioritize the Arabic user experience. Content categorization emphasizes regional libraries (Middle Eastern, North African, Turkish dubbed) before global collections.

## Open Source & Distribution Note

- **Free Software:** No subscription fees, no advertisements, no monetization strategies.
- **Official Channel:** Application updates and source code are published **exclusively on GitHub**. No commercial app store listings (Google Play, Apple App Store).
- **Community Maintained:** The project relies on community contributions for maintaining provider lists and improving scrapers.
---
NOTHING | 0 | [Next](More/UI-UX)
