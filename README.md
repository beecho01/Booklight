<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">📖 Booklight</h3>

  <p align="center">
    A native Windows desktop client for <a href="https://github.com/advplyr/audiobookshelf">Audiobookshelf</a>, built with Tauri v2, React 18, TypeScript, and Fluent UI.
    <br />
    <a href="https://github.com/beecho01/Booklight"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/beecho01/Booklight/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/beecho01/Booklight/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

Booklight is a native Windows desktop client for [Audiobookshelf](https://github.com/advplyr/audiobookshelf) — a self-hosted audiobook and podcast server. It provides a polished, Windows 11-native experience with Mica transparency effects, Fluent UI components, and seamless audio playback.

### Key Features

- 🎧 **Audio Playback** — HTML5 Audio with session sync, progress tracking, and chapter navigation
- 📚 **Library Browser** — Grid view with cover art, progress badges, and zoom controls
- 🔍 **Filter & Search** — Filter by genre, author, or narrator; search across your library
- 🎨 **Windows 11 Design** — Mica effect, Fluent UI components, system accent color matching
- 🌓 **Theme Support** — Light, Dark, and System themes with automatic accent color detection
- ⏯️ **Now Playing Bar** — Frosted glass playback bar with chapter selector, volume, and speed controls
- 📖 **Audiobook Details** — Rich detail modal with cover art, metadata, chapters, and description
- 💾 **Persistent Settings** — Volume and playback speed saved across restarts

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

[![Tauri][Tauri-badge]][Tauri-url]
[![React][React-badge]][React-url]
[![TypeScript][TypeScript-badge]][TypeScript-url]
[![Fluent UI][FluentUI-badge]][FluentUI-url]
[![Rust][Rust-badge]][Rust-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/) — WebView2, Visual Studio C++ Build Tools (Windows)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/beecho01/Booklight.git
   cd Booklight
   ```
2. Install frontend dependencies
   ```sh
   npm install
   ```
3. Run in development mode
   ```sh
   npm run tauri dev
   ```
4. Build for production
   ```sh
   npm run tauri build
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

1. **Connect to your server** — Open Settings and enter your Audiobookshelf server URL
2. **Authenticate** — Log in with your username/password or an API token
3. **Browse your library** — View your audiobooks in a responsive grid with cover art
4. **Start listening** — Click the play button on any book card to begin playback
5. **Control playback** — Use the Now Playing bar for play/pause, skip, volume, and chapter navigation
6. **Filter your library** — Use the filter menu to narrow by genre, author, or narrator
7. **View details** — Click any book card to see full metadata, chapters, and description

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [x] Library browsing with grid view and zoom
- [x] Audio playback with session sync
- [x] Now Playing bar with chapter selector
- [x] Audiobook detail modal
- [x] Library filtering (genre, author, narrator)
- [x] System accent color matching
- [x] Persistent volume and playback speed
- [x] Dark/Light/System theme support
- [ ] Sync listening progress across devices
- [ ] Podcast support
- [ ] Collections and playlists
- [ ] Mini-player (detached floating window)
- [ ] Sleep timer
- [ ] Bookmarks management
- [ ] Search functionality

See the [open issues](https://github.com/beecho01/Booklight/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

- [Audiobookshelf](https://github.com/advplyr/audiobookshelf) — The excellent self-hosted audiobook server
- [Tauri](https://tauri.app/) — Build smaller, faster, and more secure desktop applications
- [Fluent UI React v9](https://react.fluentui.dev/) — Microsoft's design system for React
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template) — README template inspiration

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/beecho01/Booklight.svg?style=for-the-badge
[contributors-url]: https://github.com/beecho01/Booklight/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/beecho01/Booklight.svg?style=for-the-badge
[forks-url]: https://github.com/beecho01/Booklight/network/members
[stars-shield]: https://img.shields.io/github/stars/beecho01/Booklight.svg?style=for-the-badge
[stars-url]: https://github.com/beecho01/Booklight/stargazers
[issues-shield]: https://img.shields.io/github/issues/beecho01/Booklight.svg?style=for-the-badge
[issues-url]: https://github.com/beecho01/Booklight/issues
[license-shield]: https://img.shields.io/github/license/beecho01/Booklight.svg?style=for-the-badge
[license-url]: https://github.com/beecho01/Booklight/blob/main/LICENSE

[Tauri-badge]: https://img.shields.io/badge/Tauri-v2-24C8D8?style=for-the-badge&logo=tauri&logoColor=white
[Tauri-url]: https://tauri.app/
[React-badge]: https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black
[React-url]: https://react.dev/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[FluentUI-badge]: https://img.shields.io/badge/Fluent_UI-v9-0078D4?style=for-the-badge&logo=microsoft&logoColor=white
[FluentUI-url]: https://react.fluentui.dev/
[Rust-badge]: https://img.shields.io/badge/Rust-Stable-000000?style=for-the-badge&logo=rust&logoColor=white
[Rust-url]: https://www.rust-lang.org/