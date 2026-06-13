use serde::{Deserialize, Deserializer, Serialize};

// ============================================================
// Loose f64 deserializer — handles both number and string formats
// The Audiobookshelf API sometimes returns numeric fields as strings
// (e.g. "11682.186469" instead of 11682.186469)
// ============================================================

fn deserialize_f64_loose<'de, D>(deserializer: D) -> Result<f64, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::{self, Visitor};
    struct F64LooseVisitor;

    impl<'de> Visitor<'de> for F64LooseVisitor {
        type Value = f64;
        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a number or a string that can be parsed as a number")
        }
        fn visit_f64<E: de::Error>(self, v: f64) -> Result<f64, E> {
            Ok(v)
        }
        fn visit_i64<E: de::Error>(self, v: i64) -> Result<f64, E> {
            Ok(v as f64)
        }
        fn visit_u64<E: de::Error>(self, v: u64) -> Result<f64, E> {
            Ok(v as f64)
        }
        fn visit_str<E: de::Error>(self, v: &str) -> Result<f64, E> {
            v.trim()
                .parse::<f64>()
                .map_err(|_| de::Error::custom(format!("invalid float string: {}", v)))
        }
        fn visit_none<E: de::Error>(self) -> Result<f64, E> {
            Ok(0.0)
        }
        fn visit_unit<E: de::Error>(self) -> Result<f64, E> {
            Ok(0.0)
        }
    }

    deserializer.deserialize_any(F64LooseVisitor)
}

fn deserialize_option_f64_loose<'de, D>(deserializer: D) -> Result<Option<f64>, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::{self, Visitor};
    struct OptionF64LooseVisitor;

    impl<'de> Visitor<'de> for OptionF64LooseVisitor {
        type Value = Option<f64>;
        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a number, a string that can be parsed as a number, or null")
        }
        fn visit_f64<E: de::Error>(self, v: f64) -> Result<Option<f64>, E> {
            Ok(Some(v))
        }
        fn visit_i64<E: de::Error>(self, v: i64) -> Result<Option<f64>, E> {
            Ok(Some(v as f64))
        }
        fn visit_u64<E: de::Error>(self, v: u64) -> Result<Option<f64>, E> {
            Ok(Some(v as f64))
        }
        fn visit_str<E: de::Error>(self, v: &str) -> Result<Option<f64>, E> {
            if v.trim().is_empty() {
                Ok(None)
            } else {
                v.trim()
                    .parse::<f64>()
                    .map(Some)
                    .map_err(|_| de::Error::custom(format!("invalid float string: {}", v)))
            }
        }
        fn visit_none<E: de::Error>(self) -> Result<Option<f64>, E> {
            Ok(None)
        }
        fn visit_unit<E: de::Error>(self) -> Result<Option<f64>, E> {
            Ok(None)
        }
    }

    deserializer.deserialize_any(OptionF64LooseVisitor)
}

// ============================================================
// Author / Series
// ============================================================

/// Custom deserializer that handles both `[{id, name}]` (object array)
/// and `["string_id"]` (string array) formats from the Audiobookshelf API.
fn deserialize_authors<'de, D>(deserializer: D) -> Result<Vec<Author>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum AuthorOrString {
        Object(Author),
        String(String),
    }

    let items = Vec::<AuthorOrString>::deserialize(deserializer)?;
    Ok(items
        .into_iter()
        .map(|item| match item {
            AuthorOrString::Object(author) => author,
            AuthorOrString::String(id) => Author {
                id,
                name: String::new(),
                cover_path: None,
                description: None,
                asin: None,
            },
        })
        .collect())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Author {
    pub id: String,
    pub name: String,
    #[serde(rename = "coverPath")]
    pub cover_path: Option<String>,
    #[serde(rename = "description")]
    pub description: Option<String>,
    #[serde(rename = "asin", default)]
    pub asin: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Series {
    pub id: String,
    pub name: String,
    #[serde(rename = "description", default)]
    pub description: Option<String>,
    #[serde(rename = "coverPath", default)]
    pub cover_path: Option<String>,
    #[serde(default)]
    pub books: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SeriesInfo {
    pub id: String,
    pub name: String,
    pub sequence: Option<String>,
}

// ============================================================
// Book / Media metadata
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BookMetadata {
    pub title: String,
    #[serde(rename = "titleIgnorePrefix", default)]
    pub title_ignore_prefix: Option<String>,
    pub subtitle: Option<String>,
    #[serde(default, deserialize_with = "deserialize_authors")]
    pub authors: Vec<Author>,
    /// Flat author name string from minified API responses (e.g. "Andy Weir")
    #[serde(rename = "authorName", default)]
    pub author_name: Option<String>,
    #[serde(rename = "authorNameLF", default)]
    pub author_name_lf: Option<String>,
    #[serde(default)]
    pub narrators: Vec<String>,
    /// Flat narrator name string from minified API responses
    #[serde(rename = "narratorName", default)]
    pub narrator_name: Option<String>,
    /// Flat series name string from minified API responses
    #[serde(rename = "seriesName", default)]
    pub series_name: Option<String>,
    #[serde(rename = "publishedYear")]
    pub published_year: Option<String>,
    #[serde(rename = "publishedDate", default)]
    pub published_date: Option<String>,
    #[serde(rename = "description")]
    pub description: Option<String>,
    #[serde(default)]
    pub genres: Vec<String>,
    #[serde(default)]
    pub series: Vec<SeriesInfo>,
    pub publisher: Option<String>,
    pub language: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(rename = "asin", default)]
    pub asin: Option<String>,
    #[serde(rename = "isbn", default)]
    pub isbn: Option<String>,
    #[serde(default)]
    pub explicit: Option<bool>,
    #[serde(default)]
    pub abridged: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chapter {
    pub id: i32,
    #[serde(deserialize_with = "deserialize_f64_loose")]
    pub start: f64,
    #[serde(deserialize_with = "deserialize_f64_loose")]
    pub end: f64,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Media {
    pub metadata: BookMetadata,
    #[serde(rename = "coverPath")]
    pub cover_path: Option<String>,
    #[serde(rename = "numTracks")]
    pub num_tracks: Option<i32>,
    #[serde(rename = "numAudioFiles")]
    pub num_audio_files: Option<i32>,
    #[serde(default, deserialize_with = "deserialize_option_f64_loose")]
    pub duration: Option<f64>,
    #[serde(default)]
    pub chapters: Vec<Chapter>,
    #[serde(rename = "narratorName", default)]
    pub narrator_name: Option<String>,
    #[serde(rename = "authorName", default)]
    pub author_name: Option<String>,
    #[serde(rename = "seriesName", default)]
    pub series_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MediaProgress {
    pub id: String,
    #[serde(rename = "libraryItemId", default)]
    pub library_item_id: Option<String>,
    #[serde(rename = "episodeId", default)]
    pub episode_id: Option<String>,
    #[serde(default, deserialize_with = "deserialize_f64_loose")]
    pub duration: f64,
    #[serde(default, deserialize_with = "deserialize_f64_loose")]
    pub progress: f64,
    #[serde(
        rename = "currentTime",
        default,
        deserialize_with = "deserialize_f64_loose"
    )]
    pub current_time: f64,
    #[serde(rename = "isFinished", default)]
    pub is_finished: bool,
    #[serde(
        rename = "lastUpdate",
        default,
        deserialize_with = "deserialize_f64_loose"
    )]
    pub last_update: f64,
    #[serde(
        rename = "startedAt",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub started_at: Option<f64>,
    #[serde(
        rename = "finishedAt",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub finished_at: Option<f64>,
}

// ============================================================
// Library Items
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LibraryItem {
    pub id: String,
    pub media: Media,
    #[serde(rename = "mediaType")]
    pub media_type: String,
    #[serde(rename = "libraryId")]
    pub library_id: String,
    #[serde(rename = "folderId")]
    pub folder_id: Option<String>,
    #[serde(rename = "addedAt", deserialize_with = "deserialize_f64_loose")]
    pub added_at: f64,
    #[serde(
        rename = "updatedAt",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub updated_at: Option<f64>,
    #[serde(rename = "isMissing", default)]
    pub is_missing: Option<bool>,
    #[serde(rename = "isInvalid", default)]
    pub is_invalid: Option<bool>,
    #[serde(default, deserialize_with = "deserialize_option_f64_loose")]
    pub size: Option<f64>,
    #[serde(rename = "userMediaProgress")]
    pub user_media_progress: Option<MediaProgress>,
}

// ============================================================
// Library
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LibraryFolder {
    pub id: String,
    #[serde(rename = "fullPath")]
    pub full_path: String,
    #[serde(rename = "libraryId")]
    pub library_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Library {
    pub id: String,
    pub name: String,
    #[serde(rename = "mediaType")]
    pub media_type: String,
    #[serde(rename = "displayOrder")]
    pub display_order: Option<i32>,
    pub icon: Option<String>,
    pub provider: Option<String>,
    #[serde(
        rename = "lastScan",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub last_scan: Option<f64>,
    #[serde(rename = "lastScanVersion")]
    pub last_scan_version: Option<String>,
    #[serde(default)]
    pub folders: Vec<LibraryFolder>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LibraryItemsResponse {
    pub results: Vec<LibraryItem>,
    pub total: Option<i32>,
    pub limit: Option<i32>,
    pub page: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LibraryFilterData {
    #[serde(default)]
    pub authors: Vec<FilterAuthor>,
    #[serde(default)]
    pub genres: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub series: Vec<FilterSeries>,
    #[serde(default)]
    pub narrators: Vec<String>,
    #[serde(default)]
    pub publishers: Vec<String>,
    #[serde(default)]
    pub languages: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FilterAuthor {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FilterSeries {
    pub id: String,
    pub name: String,
}

// ============================================================
// User / Auth
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: Option<String>,
    #[serde(rename = "type", default)]
    pub user_type: Option<String>,
    pub token: Option<String>,
    #[serde(rename = "mediaProgress", default)]
    pub media_progress: Vec<MediaProgress>,
    #[serde(rename = "librariesAccessible", default)]
    pub libraries_accessible: Option<Vec<String>>,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: Option<bool>,
    #[serde(
        rename = "createdAt",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub created_at: Option<f64>,
}

fn default_true() -> Option<bool> {
    Some(true)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoginResponse {
    pub user: User,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerStatus {
    pub app: Option<String>,
    #[serde(rename = "serverVersion")]
    pub server_version: Option<String>,
    #[serde(rename = "isInit")]
    pub is_init: Option<bool>,
    #[serde(default)]
    pub language: Option<String>,
    #[serde(rename = "authMethods", default)]
    pub auth_methods: Option<Vec<String>>,
}

// ============================================================
// Personalized / Shelves
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PersonalizedShelf {
    pub id: String,
    pub label: String,
    #[serde(rename = "type")]
    pub shelf_type: String,
    pub entities: Vec<serde_json::Value>,
}

// ============================================================
// Playback Session / Audio Tracks
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudioTrack {
    pub index: i32,
    #[serde(
        rename = "startOffset",
        default,
        deserialize_with = "deserialize_f64_loose"
    )]
    pub start_offset: f64,
    #[serde(deserialize_with = "deserialize_f64_loose")]
    pub duration: f64,
    pub title: Option<String>,
    #[serde(rename = "contentUrl", default)]
    pub content_url: Option<String>,
    #[serde(rename = "mimeType", default)]
    pub mime_type: Option<String>,
    #[serde(default)]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaybackSession {
    pub id: String,
    #[serde(rename = "libraryItemId")]
    pub library_item_id: String,
    #[serde(rename = "displayTitle")]
    pub display_title: String,
    #[serde(rename = "displayAuthor")]
    pub display_author: Option<String>,
    #[serde(deserialize_with = "deserialize_f64_loose")]
    pub duration: f64,
    #[serde(rename = "currentTime", deserialize_with = "deserialize_f64_loose")]
    pub current_time: f64,
    #[serde(rename = "coverPath")]
    pub cover_path: Option<String>,
    #[serde(rename = "playMethod", default)]
    pub play_method: i32,
    #[serde(rename = "mediaType", default)]
    pub media_type: Option<String>,
    #[serde(default, rename = "audioTracks")]
    pub audio_tracks: Vec<AudioTrack>,
    #[serde(rename = "userId", default)]
    pub user_id: Option<String>,
    #[serde(rename = "mediaPlayer", default)]
    pub media_player: Option<String>,
    #[serde(
        rename = "startedAt",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub started_at: Option<f64>,
    #[serde(
        rename = "updatedAt",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub updated_at: Option<f64>,
}

// ============================================================
// Collections / Playlists
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    pub id: String,
    #[serde(rename = "libraryId")]
    pub library_id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(
        rename = "coverAspectRatio",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub cover_aspect_ratio: Option<f64>,
    #[serde(default)]
    pub books: Vec<String>,
    #[serde(
        rename = "lastUpdate",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub last_update: Option<f64>,
    #[serde(
        rename = "createdAt",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub created_at: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Playlist {
    pub id: String,
    #[serde(rename = "libraryId")]
    pub library_id: String,
    #[serde(rename = "userId", default)]
    pub user_id: Option<String>,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub items: Vec<PlaylistItem>,
    #[serde(
        rename = "lastUpdate",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub last_update: Option<f64>,
    #[serde(
        rename = "createdAt",
        default,
        deserialize_with = "deserialize_option_f64_loose"
    )]
    pub created_at: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaylistItem {
    #[serde(rename = "libraryItemId")]
    pub library_item_id: String,
    #[serde(rename = "episodeId", default)]
    pub episode_id: Option<String>,
    #[serde(rename = "title", default)]
    pub title: Option<String>,
}

// ============================================================
// Podcast
// ============================================================

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PodcastEpisode {
    pub id: String,
    #[serde(rename = "libraryItemId")]
    pub library_item_id: Option<String>,
    #[serde(rename = "podcastId")]
    pub podcast_id: Option<String>,
    pub title: String,
    #[serde(default)]
    pub subtitle: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(rename = "pubDate", default)]
    pub pub_date: Option<String>,
    #[serde(default, deserialize_with = "deserialize_option_f64_loose")]
    pub duration: Option<f64>,
    #[serde(rename = "episode", default)]
    pub episode_number: Option<String>,
    #[serde(rename = "season", default)]
    pub season: Option<String>,
    #[serde(default)]
    pub audio_file: Option<serde_json::Value>,
}

// ============================================================
// Search
// ============================================================

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub id: String,
    #[serde(rename = "libraryId")]
    pub library_id: Option<String>,
    #[serde(rename = "mediaType", default)]
    pub media_type: Option<String>,
    pub title: Option<String>,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub series: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(rename = "coverPath", default)]
    pub cover_path: Option<String>,
}

// ============================================================
// Listening Stats
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ListeningStats {
    #[serde(
        rename = "totalTime",
        default,
        deserialize_with = "deserialize_f64_loose"
    )]
    pub total_time: f64,
    #[serde(default)]
    pub items: Option<serde_json::Value>,
    #[serde(default)]
    pub days: Option<serde_json::Value>,
    #[serde(rename = "dayOfWeek", default)]
    pub day_of_week: Option<serde_json::Value>,
}

// ============================================================
// User Bookmark
// ============================================================

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserBookmark {
    #[serde(rename = "libraryItemId")]
    pub library_item_id: String,
    pub title: String,
    #[serde(deserialize_with = "deserialize_f64_loose")]
    pub time: f64,
    #[serde(rename = "createdAt", deserialize_with = "deserialize_f64_loose")]
    pub created_at: f64,
}
