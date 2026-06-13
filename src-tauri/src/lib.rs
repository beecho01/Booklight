mod api;
mod models;

use api::*;
use models::*;
use tauri::Manager;

#[tauri::command]
fn get_system_accent_color() -> Result<String, String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let dwm = hkcu
        .open_subkey(r"Software\Microsoft\Windows\DWM")
        .map_err(|e| format!("Failed to open DWM key: {}", e))?;

    // ColorizationColor is stored as a DWORD in 0xAARRGGBB format
    let colorization_color: u32 = dwm
        .get_value("ColorizationColor")
        .map_err(|e| format!("Failed to read ColorizationColor: {}", e))?;

    // Extract RGB components from 0xAARRGGBB
    let r = (colorization_color >> 16) & 0xFF;
    let g = (colorization_color >> 8) & 0xFF;
    let b = colorization_color & 0xFF;

    Ok(format!("#{:02X}{:02X}{:02X}", r, g, b))
}

#[tauri::command]
async fn login(
    server_url: String,
    username: String,
    password: String,
) -> Result<LoginResponse, String> {
    api_login(&server_url, &username, &password).await
}

#[tauri::command]
async fn authorize(server_url: String, token: String) -> Result<LoginResponse, String> {
    api_authorize(&server_url, &token).await
}

#[tauri::command]
async fn login_with_token(server_url: String, token: String) -> Result<LoginResponse, String> {
    api_authorize(&server_url, &token).await
}

#[tauri::command]
async fn get_server_status(server_url: String) -> Result<ServerStatus, String> {
    api_get_server_status(&server_url).await
}

#[tauri::command]
async fn get_libraries(server_url: String, token: String) -> Result<Vec<Library>, String> {
    api_get_libraries(&server_url, &token).await
}

#[tauri::command]
async fn get_library(
    server_url: String,
    token: String,
    library_id: String,
) -> Result<Library, String> {
    api_get_library(&server_url, &token, &library_id).await
}

#[tauri::command]
async fn get_library_items(
    server_url: String,
    token: String,
    library_id: String,
) -> Result<LibraryItemsResponse, String> {
    api_get_library_items(&server_url, &token, &library_id).await
}

#[tauri::command]
async fn get_personalized(
    server_url: String,
    token: String,
    library_id: String,
) -> Result<Vec<PersonalizedShelf>, String> {
    api_get_personalized(&server_url, &token, &library_id).await
}

#[tauri::command]
async fn get_item(
    server_url: String,
    token: String,
    item_id: String,
) -> Result<LibraryItem, String> {
    api_get_item(&server_url, &token, &item_id).await
}

#[tauri::command]
async fn get_current_user(server_url: String, token: String) -> Result<User, String> {
    api_get_current_user(&server_url, &token).await
}

#[tauri::command]
async fn update_progress(
    server_url: String,
    token: String,
    library_item_id: String,
    current_time: f64,
    duration: f64,
    is_finished: bool,
    episode_id: Option<String>,
) -> Result<(), String> {
    api_update_progress(
        &server_url,
        &token,
        &library_item_id,
        current_time,
        duration,
        is_finished,
        episode_id.as_deref(),
    )
    .await
}

#[tauri::command]
async fn start_playback(
    server_url: String,
    token: String,
    item_id: String,
    episode_id: Option<String>,
) -> Result<PlaybackSession, String> {
    api_start_playback(&server_url, &token, &item_id, episode_id.as_deref()).await
}

#[tauri::command]
async fn scan_library(server_url: String, token: String, library_id: String) -> Result<(), String> {
    api_scan_library(&server_url, &token, &library_id).await
}

#[tauri::command]
async fn sync_session(
    server_url: String,
    token: String,
    session_id: String,
    current_time: f64,
    duration: f64,
) -> Result<(), String> {
    api_sync_session(&server_url, &token, &session_id, current_time, duration).await
}

#[tauri::command]
async fn close_session(
    server_url: String,
    token: String,
    session_id: String,
    current_time: f64,
    duration: f64,
) -> Result<(), String> {
    api_close_session(&server_url, &token, &session_id, current_time, duration).await
}

// ============================================================
// Library Filter Data & Search
// ============================================================

#[tauri::command]
async fn get_filter_data(
    server_url: String,
    token: String,
    library_id: String,
) -> Result<LibraryFilterData, String> {
    api_get_filter_data(&server_url, &token, &library_id).await
}

#[tauri::command]
async fn search_library(
    server_url: String,
    token: String,
    library_id: String,
    query: String,
) -> Result<serde_json::Value, String> {
    api_search_library(&server_url, &token, &library_id, &query).await
}

#[tauri::command]
async fn search(
    server_url: String,
    token: String,
    query: String,
) -> Result<serde_json::Value, String> {
    api_search(&server_url, &token, &query).await
}

// ============================================================
// Me (Current User) endpoints
// ============================================================

#[tauri::command]
async fn get_listening_sessions(
    server_url: String,
    token: String,
) -> Result<serde_json::Value, String> {
    api_get_listening_sessions(&server_url, &token).await
}

#[tauri::command]
async fn get_listening_stats(server_url: String, token: String) -> Result<ListeningStats, String> {
    api_get_listening_stats(&server_url, &token).await
}

#[tauri::command]
async fn get_items_in_progress(
    server_url: String,
    token: String,
) -> Result<serde_json::Value, String> {
    api_get_items_in_progress(&server_url, &token).await
}

#[tauri::command]
async fn get_media_progress(
    server_url: String,
    token: String,
    library_item_id: String,
    episode_id: Option<String>,
) -> Result<serde_json::Value, String> {
    api_get_media_progress(&server_url, &token, &library_item_id, episode_id.as_deref()).await
}

#[tauri::command]
async fn create_bookmark(
    server_url: String,
    token: String,
    library_item_id: String,
    time: f64,
    title: String,
) -> Result<(), String> {
    api_create_bookmark(&server_url, &token, &library_item_id, time, title).await
}

#[tauri::command]
async fn delete_bookmark(
    server_url: String,
    token: String,
    library_item_id: String,
    time: f64,
) -> Result<(), String> {
    api_delete_bookmark(&server_url, &token, &library_item_id, time).await
}

// ============================================================
// Collections
// ============================================================

#[tauri::command]
async fn get_collections(server_url: String, token: String) -> Result<Vec<Collection>, String> {
    api_get_collections(&server_url, &token).await
}

#[tauri::command]
async fn get_collection(
    server_url: String,
    token: String,
    collection_id: String,
) -> Result<Collection, String> {
    api_get_collection(&server_url, &token, &collection_id).await
}

#[tauri::command]
async fn create_collection(
    server_url: String,
    token: String,
    library_id: String,
    name: String,
    description: Option<String>,
    books: Vec<String>,
) -> Result<Collection, String> {
    api_create_collection(
        &server_url,
        &token,
        &library_id,
        &name,
        description.as_deref(),
        books,
    )
    .await
}

#[tauri::command]
async fn update_collection(
    server_url: String,
    token: String,
    collection_id: String,
    name: Option<String>,
    description: Option<String>,
    books: Option<Vec<String>>,
) -> Result<Collection, String> {
    api_update_collection(
        &server_url,
        &token,
        &collection_id,
        name.as_deref(),
        description.as_deref(),
        books,
    )
    .await
}

#[tauri::command]
async fn delete_collection(
    server_url: String,
    token: String,
    collection_id: String,
) -> Result<(), String> {
    api_delete_collection(&server_url, &token, &collection_id).await
}

// ============================================================
// Playlists
// ============================================================

#[tauri::command]
async fn get_playlists(server_url: String, token: String) -> Result<Vec<Playlist>, String> {
    api_get_playlists(&server_url, &token).await
}

#[tauri::command]
async fn get_playlist(
    server_url: String,
    token: String,
    playlist_id: String,
) -> Result<Playlist, String> {
    api_get_playlist(&server_url, &token, &playlist_id).await
}

#[tauri::command]
async fn create_playlist(
    server_url: String,
    token: String,
    library_id: String,
    name: String,
    description: Option<String>,
    items: Vec<PlaylistItem>,
) -> Result<Playlist, String> {
    api_create_playlist(
        &server_url,
        &token,
        &library_id,
        &name,
        description.as_deref(),
        items,
    )
    .await
}

#[tauri::command]
async fn delete_playlist(
    server_url: String,
    token: String,
    playlist_id: String,
) -> Result<(), String> {
    api_delete_playlist(&server_url, &token, &playlist_id).await
}

// ============================================================
// Authors
// ============================================================

#[tauri::command]
async fn get_authors(server_url: String, token: String) -> Result<Vec<Author>, String> {
    api_get_authors(&server_url, &token).await
}

#[tauri::command]
async fn get_author(
    server_url: String,
    token: String,
    author_id: String,
) -> Result<Author, String> {
    api_get_author(&server_url, &token, &author_id).await
}

#[tauri::command]
async fn update_author(
    server_url: String,
    token: String,
    author_id: String,
    name: Option<String>,
    description: Option<String>,
    asin: Option<String>,
) -> Result<Author, String> {
    api_update_author(
        &server_url,
        &token,
        &author_id,
        name.as_deref(),
        description.as_deref(),
        asin.as_deref(),
    )
    .await
}

// ============================================================
// Series
// ============================================================

#[tauri::command]
async fn get_series(
    server_url: String,
    token: String,
    library_id: String,
) -> Result<Vec<Series>, String> {
    api_get_series(&server_url, &token, &library_id).await
}

#[tauri::command]
async fn get_series_by_id(
    server_url: String,
    token: String,
    series_id: String,
) -> Result<Series, String> {
    api_get_series_by_id(&server_url, &token, &series_id).await
}

// ============================================================
// Item metadata update & match
// ============================================================

#[tauri::command]
async fn update_item_media(
    server_url: String,
    token: String,
    item_id: String,
    metadata: serde_json::Value,
) -> Result<(), String> {
    api_update_item_media(&server_url, &token, &item_id, metadata).await
}

#[tauri::command]
async fn match_item(
    server_url: String,
    token: String,
    item_id: String,
    provider: String,
    query: Option<String>,
) -> Result<serde_json::Value, String> {
    api_match_item(&server_url, &token, &item_id, &provider, query.as_deref()).await
}

// ============================================================
// Podcasts
// ============================================================

#[tauri::command]
async fn check_podcast_new_episodes(
    server_url: String,
    token: String,
    podcast_id: String,
) -> Result<serde_json::Value, String> {
    api_check_podcast_new_episodes(&server_url, &token, &podcast_id).await
}

#[tauri::command]
async fn download_podcast_episodes(
    server_url: String,
    token: String,
    podcast_id: String,
    episodes: Vec<serde_json::Value>,
) -> Result<(), String> {
    api_download_podcast_episodes(&server_url, &token, &podcast_id, episodes).await
}

// ============================================================
// Open Sessions
// ============================================================

#[tauri::command]
async fn get_open_sessions(
    server_url: String,
    token: String,
) -> Result<Vec<PlaybackSession>, String> {
    api_get_open_sessions(&server_url, &token).await
}

#[tauri::command]
fn set_mica_effect(app: tauri::AppHandle, is_dark: bool) -> Result<(), String> {
    use tauri::window::{Color, Effect, EffectsBuilder};
    if let Some(window) = app.get_webview_window("main") {
        let effect = if is_dark {
            Effect::MicaDark
        } else {
            Effect::MicaLight
        };
        window
            .set_effects(
                EffectsBuilder::new()
                    .effect(effect)
                    .color(Color(0, 0, 0, 0))
                    .build(),
            )
            .map_err(|e| format!("Failed to set window effect: {}", e))?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // Set the window icon for the taskbar
            if let Some(main_window) = app.get_webview_window("main") {
                let icon_bytes = include_bytes!("../icons/icon.png");
                let decoder = png::Decoder::new(std::io::Cursor::new(icon_bytes));
                let mut reader = decoder.read_info().expect("Failed to read PNG info");
                let mut buf = vec![0u8; reader.output_buffer_size()];
                let info = reader
                    .next_frame(&mut buf)
                    .expect("Failed to read PNG frame");
                let icon = tauri::image::Image::new_owned(buf, info.width, info.height);
                let _ = main_window.set_icon(icon);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_accent_color,
            set_mica_effect,
            login,
            authorize,
            login_with_token,
            get_server_status,
            get_libraries,
            get_library,
            get_library_items,
            get_personalized,
            get_item,
            get_current_user,
            update_progress,
            start_playback,
            scan_library,
            sync_session,
            close_session,
            get_filter_data,
            search_library,
            search,
            get_listening_sessions,
            get_listening_stats,
            get_items_in_progress,
            get_media_progress,
            create_bookmark,
            delete_bookmark,
            get_collections,
            get_collection,
            create_collection,
            update_collection,
            delete_collection,
            get_playlists,
            get_playlist,
            create_playlist,
            delete_playlist,
            get_authors,
            get_author,
            update_author,
            get_series,
            get_series_by_id,
            update_item_media,
            match_item,
            check_podcast_new_episodes,
            download_podcast_episodes,
            get_open_sessions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
