### 🧩 Core Embed & API Providers

| Provider Name            | Primary Domain(s) / API                                                          | Content & Region Notes                                                                                                                        |
| :----------------------- | :------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **2Embed**               | `2embed.cc`, `2embed.ru`                                                         | A major embed provider that was targeted in a major anti-piracy crackdown, but continues to operate via new domains.                          |
| **VidLink**              | `vidlink.pro`                                                                    | A working and reliable embed source, often used by other sites to fetch video links for movies and TV shows.                                  |
| **VidSrc**               | `vidsrc.me`, `vidsrc.net`, `vidsrc.rip`, `vidsrc.to`, `vidsrc.in`, `vidsrc.io`   | A classic and foundational provider. Note that different domains (`.me`, `.net`, etc.) may have varying levels of stability or content focus. |
| **Embed.su**             | `embed.su`                                                                       | A direct embed source, often integrated into sites that fetch from multiple providers.                                                        |
| **SuperEmbed**           | `superembed.stream`, `getsuperembed.link`                                        | A popular embed source. You can use a specific API pattern: `https://getsuperembed.link/?video_id=tt1234567`.                                 |
| **Smashy**               | `smashy.stream`, `smashystream.xyz`, `flix.smashystream.xyz`, `smashystream.com` | Known to host a mix of movies, TV shows, and anime.                                                                                           |
| **MoviesAPI**            | `moviesapi.club`, `moviesapi.to`                                                 | A next-gen video streaming API service that aims to integrate video content.                                                                  |
| **Autoembed**            | `autoembed.cc`                                                                   | An API service supporting multiple providers including 2embed and Vidsrc.                                                                     |
| **Upcloud**              | `vidsrc.cc`                                                                      | A provider that has faced downtime but is used for its content catalog.                                                                       |
| **TMDB Embed API**       | GitHub Project                                                                   | Not a source itself, but an API wrapper that aggregates from multiple providers (4khdhub, UHDMovies, Vixsrc, etc.).                           |
| **FSAPI**                | `fsapi.xyz`                                                                      | An older API for fetching movie and TV show embed links.                                                                                      |
| **CurtStream**           | `curtstream.com`                                                                 | An embed provider for movies (`/movies/imdb/imdbId`) and TV series (`/series/tmdb/tmdbId/season/episode/`).                                   |
| **MovieWP**              | `moviewp.com`                                                                    | An older embed source (`/se.php?video_id=imdbId`).                                                                                            |
| **VidCloud**             | `vidcloud.stream`                                                                | An embed source (`/imdbId.html`).                                                                                                             |
| **Gomo**                 | `gomo.to`                                                                        | A source for movie embeds (`/movie/imdbId`).                                                                                                  |
| **APIMDB**               | `v2.apimdb.net`                                                                  | Another API for movies (`/e/movie/imdbId`) and TV shows (`/e/tmdb/tv/tmdbId/season/episode/`).                                                |
| **DatabaseGDrivePlayer** | `databasegdriveplayer.co`                                                        | A source specifically for TV series (`/player.php?type=series&tmdb=tmdbId&season=season&episode=episode`).                                    |

### 🌏 International & Specialized Sources

| Category                  | Provider/Source Name     | Primary Domains / Notes                                                                             |
| :------------------------ | :----------------------- | :-------------------------------------------------------------------------------------------------- |
| **Anime**                 | **GogoAnime**            | `gogoanime` (A foundational source for many anime streaming sites).                                 |
|                           | **9Anime**               | `9anime.pe`.                                                                                        |
|                           | **AnimePahe**            | (Source used by aggregator sites like Hyaku).                                                       |
|                           | **Zoro / AniWatch**      | `zoro.to`, `aniwatch.to`.                                                                           |
|                           | **HiAnime**              | (Noted as a popular choice in 2026 lists).                                                          |
|                           | **AnimixPlay**           | (When functioning, a source for anime content).                                                     |
|                           | **AnimeFreak**           | (A free streaming source for anime).                                                                |
| **Asian Dramas & Cinema** | **Dramacool**            | A well-known source for a wide range of Asian dramas.                                               |
|                           | **KissAsian**            | A popular hub for Asian drama content.                                                              |
|                           | **Viki**                 | A legal hub for Asian dramas with subtitles in many languages.                                      |
|                           | **WeTV**                 | Tencent Video's international platform for Asian content.                                           |
|                           | **iQIYI**                | A major streaming service for Asian dramas and anime.                                               |
|                           | **KissKH**               | A source for Korean, Chinese, Thai, and Japanese content.                                           |
|                           | **Viu**                  | Another notable platform for Asian dramas.                                                          |
| **Indian Cinema**         | **HindiProviders**       | A GitHub repository with extensions for fetching Hindi content.                                     |
|                           | **MoviesMod**            | A provider aggregated by the TMDB Embed API.                                                        |
|                           | **4KHDHub**              | A provider aggregated by the TMDB Embed API for 4K streams.                                         |
| **Chinese Content**       | **BiliBili**             | A major Chinese platform with a legal anime section.                                                |
|                           | **嘀嘀动漫 (DiDi Anime)**    | An app that aggregates over 10,000 domestic and international anime sources.                        |
|                           | **Animeko**              | An open-source anime player with built-in multiple data sources.                                    |
|                           | **AiYifan**              | A site known for free HD Chinese movies, dramas, and anime for overseas viewers.                    |
| **Nollywood & African**   | **FilmFlux**             | An app with a free library of thousands of Nollywood movies and series.                             |
|                           | **African Film Library** | An initiative showcasing award-winning works from over 80 African producers.                        |
|                           | **Yoruba Movies App**    | An app featuring a large catalog of Nollywood Yoruba films from copyright owners.                   |
| **European**              | **ARTE**                 | A public Franco-German TV station offering free access to films, docs, and series in six languages. |
|                           | **Filmfriend**           | A European streaming platform with thousands of films, often accessible via library memberships.    |
|                           | **WikiFlix**             | A free platform by Wikimedia Germany offering a library of freely licensed and public domain films. |
| **Latin American**        | **Retina Latina**        | A public digital platform promoting films from across Latin America and the Caribbean.              |
|                           | **Pragda**               | A database specializing in Latin American, Spanish, and Latinx cinema with over 700 films.          |
| **Middle Eastern**        | **Aflamedia.com**        | A website for streaming free Arabic movies.                                                         |
|                           | **ArabFilm.com**         | An online catalogue of Arab films that can be searched by country of origin.                        |

Given the nature of this landscape, lists like this are just a snapshot. For the most current and complete information, you may want to keep an eye on community-driven resources like the r/FREEMEDIAHECKYEAH subreddit and the FMHY (Free Media Heck Yeah) wiki.
### 🇹🇷 Turkish (Türkçe) Sources

| Category | Provider / Source | Primary Domain / Notes |
| :--- | :--- | :--- |
| **Video Hosting** | Izlesene | `izlesene.com` - A Turkish video network with its own embed system. |
| **Development Library** | KekikStream | A modular Python library for Turkish media; can be used via CLI or API. |
| **Aggregator API** | Autoembed | An API service that supports multiple providers, including Vidsrc and 2Embed. |
| **Web Scraper** | CinePro | An open-source backend that scrapes various streaming sites (likely includes Turkish ones). |
| **Meta-Data Provider** | TVmaze | An API for TV show schedules, which could be used to build a directory. |

### 🇸🇦🇪🇬 Middle Eastern / Arabic (عربى) Sources

| Category | Provider / Source | Primary Domain / Notes |
| :--- | :--- | :--- |
| **Direct Provider** | WeCima | A known Arabic provider/scraper used within the Stremio add-on "Stremify". |
| **Stremio Add-on** | Vidfast | The source used by the 'Arabic Mneizel' Stremio add-on. |
| **Kodi Add-ons** | Shahid.net | A plugin for the free MBC catch-up service. |
| **Music / Video** | Anghami | A leading Middle Eastern music streaming service with an oEmbed API. |
| **General API** | 2Embed | A general-purpose API for movies and TV series that likely includes Arabic content. |

### 📝 Final Summary

To summarize, while dedicated embed APIs are scarce, content is accessible through these alternative methods:

*   **Direct Providers (WeCima, Vidfast)**: The most direct source, used by apps like Stremio.
*   **Platform Ecosystems (Stremio, Kodi)**: These act as a front-end, using add-ons to scrape the actual sources. Exploring their community forums can lead you to more.
*   **Development Tools (KekikStream, CinePro)**: For those with technical skills, these offer a way to build your own pipeline.
*   **Specialized Platforms (Anghami, Izlesene)**: These serve specific media types (music videos, user uploads).
---
[Prev](UI-UX) | 3 | [Next](Embed Providers)
