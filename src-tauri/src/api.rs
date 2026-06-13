use crate::models::*;
use reqwest::Client;
use serde_json::Value;
use std::collections::HashMap;

fn build_url(server_url: &str, path: &str) -> String {
    format!("{}{}", server_url.trim_end_matches('/'), path)
}

fn build_headers(token: &str) -> reqwest::header::HeaderMap {
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
        "Authorization",
        format!("Bearer {}", token).parse().unwrap(),
    );
    headers
}

/// Build a reqwest Client that handles self-hosted endpoints including Cloudflare tunnels.
/// - Follows redirects (HTTP→HTTPS, Cloudflare tunnel routing)
/// - Accepts invalid/self-signed certificates (common with self-hosted instances)
/// - Uses system native TLS root certificates for Cloudflare tunnel endpoints
fn build_client() -> Result<Client, String> {
    Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))
}

pub async fn api_login(
    server_url: &str,
    username: &str,
    password: &str,
) -> Result<LoginResponse, String> {
    let client = build_client()?;
    let mut body = HashMap::new();
    body.insert("username", username);
    body.insert("password", password);

    let response = client
        .post(build_url(server_url, "/api/login"))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Login failed ({}): {}", status, text));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    let data: Value = serde_json::from_str(&body).map_err(|e| {
        format!(
            "JSON parse error: {}\\nBody: {}",
            e,
            &body[..body.len().min(500)]
        )
    })?;

    // Try wrapped format first: { user: { ... } }
    if let Some(user_value) = data.get("user") {
        let user: User = serde_json::from_value(user_value.clone()).map_err(|e| {
            format!(
                "User parse error: {}\\nBody: {}",
                e,
                &body[..body.len().min(500)]
            )
        })?;
        Ok(LoginResponse { user })
    } else {
        // Try direct format: the response IS the user object
        let user: User = serde_json::from_value(data).map_err(|e| {
            format!(
                "User parse error: {}\\nBody: {}",
                e,
                &body[..body.len().min(500)]
            )
        })?;
        Ok(LoginResponse { user })
    }
}

pub async fn api_authorize(server_url: &str, token: &str) -> Result<LoginResponse, String> {
    let client = build_client()?;
    let response = client
        .post(build_url(server_url, "/api/authorize"))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!(
            "Authorization failed ({}): {}",
            status,
            &body[..body.len().min(500)]
        ));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    // The /api/authorize endpoint may return the user object directly or wrapped in { user: ... }
    let data: Value = serde_json::from_str(&body).map_err(|e| {
        format!(
            "JSON parse error: {}\\nBody: {}",
            e,
            &body[..body.len().min(500)]
        )
    })?;

    // Try wrapped format first: { user: { ... } }
    if let Some(user_value) = data.get("user") {
        let user: User = serde_json::from_value(user_value.clone()).map_err(|e| {
            format!(
                "User parse error: {}\\nBody: {}",
                e,
                &body[..body.len().min(500)]
            )
        })?;
        Ok(LoginResponse { user })
    } else {
        // Try direct format: the response IS the user object
        let user: User = serde_json::from_value(data).map_err(|e| {
            format!(
                "User parse error: {}\\nBody: {}",
                e,
                &body[..body.len().min(500)]
            )
        })?;
        Ok(LoginResponse { user })
    }
}

pub async fn api_get_server_status(server_url: &str) -> Result<ServerStatus, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/status"))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Status check failed ({})", response.status()));
    }

    response
        .json::<ServerStatus>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_get_libraries(server_url: &str, token: &str) -> Result<Vec<Library>, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/libraries"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Failed to get libraries ({}): {}", status, body));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    let data: Value = serde_json::from_str(&body).map_err(|e| {
        format!(
            "JSON parse error: {}\nBody: {}",
            e,
            &body[..body.len().min(500)]
        )
    })?;

    let libraries_value = data.get("libraries").cloned().unwrap_or(Value::Null);
    let libraries: Vec<Library> = serde_json::from_value(libraries_value).map_err(|e| {
        format!(
            "Library parse error: {}\nLibraries JSON: {}",
            e,
            &body[..body.len().min(500)]
        )
    })?;
    Ok(libraries)
}

pub async fn api_get_library(
    server_url: &str,
    token: &str,
    library_id: &str,
) -> Result<Library, String> {
    let client = build_client()?;
    let path = format!("/api/libraries/{}", library_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get library ({})", response.status()));
    }

    response
        .json::<Library>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_get_library_items(
    server_url: &str,
    token: &str,
    library_id: &str,
) -> Result<LibraryItemsResponse, String> {
    let client = build_client()?;
    let path = format!(
        "/api/libraries/{}/items?limit=100&sort=addedAt&desc=1",
        library_id
    );
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!(
            "Failed to get library items ({}): {}",
            status,
            &body[..body.len().min(500)]
        ));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    serde_json::from_str::<LibraryItemsResponse>(&body).map_err(|e| {
        format!(
            "Library items parse error: {}\\nBody: {}",
            e,
            &body[..body.len().min(500)]
        )
    })
}

pub async fn api_get_personalized(
    server_url: &str,
    token: &str,
    library_id: &str,
) -> Result<Vec<PersonalizedShelf>, String> {
    let client = build_client()?;
    let path = format!("/api/libraries/{}/personalized", library_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to get personalized ({})",
            response.status()
        ));
    }

    let data: Value = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;
    // The response is an object with shelf names as keys
    let shelves: Vec<PersonalizedShelf> =
        serde_json::from_value(data).map_err(|e| format!("Parse error: {}", e))?;
    Ok(shelves)
}

pub async fn api_get_item(
    server_url: &str,
    token: &str,
    item_id: &str,
) -> Result<LibraryItem, String> {
    let client = build_client()?;
    let path = format!("/api/items/{}?expanded=1", item_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get item ({})", response.status()));
    }

    response
        .json::<LibraryItem>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_get_current_user(server_url: &str, token: &str) -> Result<User, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/me"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get user ({})", response.status()));
    }

    response
        .json::<User>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_update_progress(
    server_url: &str,
    token: &str,
    library_item_id: &str,
    current_time: f64,
    duration: f64,
    is_finished: bool,
    episode_id: Option<&str>,
) -> Result<(), String> {
    let client = build_client()?;
    let mut path = format!("/api/me/progress/{}", library_item_id);
    if let Some(ep_id) = episode_id {
        path = format!("{}/{}", path, ep_id);
    }

    let mut body = HashMap::new();
    body.insert("currentTime", current_time.to_string());
    body.insert("duration", duration.to_string());
    body.insert("isFinished", is_finished.to_string());

    let response = client
        .patch(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to update progress ({})", response.status()));
    }

    Ok(())
}

pub async fn api_start_playback(
    server_url: &str,
    token: &str,
    item_id: &str,
    episode_id: Option<&str>,
) -> Result<PlaybackSession, String> {
    let client = build_client()?;
    let path = if let Some(ep_id) = episode_id {
        format!("/api/items/{}/play/{}", item_id, ep_id)
    } else {
        format!("/api/items/{}/play", item_id)
    };

    let body = serde_json::json!({
        "mediaPlayer": "booklight",
        "forceDirectPlay": true,
        "forceTranscode": false,
        "deviceInfo": {
            "clientName": "Booklight",
            "deviceId": "booklight-desktop"
        }
    });

    let response = client
        .post(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to start playback ({})", response.status()));
    }

    response
        .json::<PlaybackSession>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_scan_library(
    server_url: &str,
    token: &str,
    library_id: &str,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/libraries/{}/scan", library_id);
    let response = client
        .post(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to scan library ({})", response.status()));
    }

    Ok(())
}

pub async fn api_sync_session(
    server_url: &str,
    token: &str,
    session_id: &str,
    current_time: f64,
    duration: f64,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/sessions/{}/sync", session_id);

    let mut body = HashMap::new();
    body.insert("currentTime", current_time.to_string());
    body.insert("duration", duration.to_string());

    let response = client
        .post(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to sync session ({})", response.status()));
    }

    Ok(())
}

pub async fn api_close_session(
    server_url: &str,
    token: &str,
    session_id: &str,
    current_time: f64,
    duration: f64,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/sessions/{}/close", session_id);

    let mut body = HashMap::new();
    body.insert("currentTime", current_time.to_string());
    body.insert("duration", duration.to_string());

    let response = client
        .post(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to close session ({})", response.status()));
    }

    Ok(())
}

// ============================================================
// Library Filter Data
// ============================================================

pub async fn api_get_filter_data(
    server_url: &str,
    token: &str,
    library_id: &str,
) -> Result<LibraryFilterData, String> {
    let client = build_client()?;
    let path = format!("/api/libraries/{}/filterdata", library_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get filter data ({})", response.status()));
    }

    response
        .json::<LibraryFilterData>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

// ============================================================
// Library Search
// ============================================================

pub async fn api_search_library(
    server_url: &str,
    token: &str,
    library_id: &str,
    query: &str,
) -> Result<serde_json::Value, String> {
    let client = build_client()?;
    let path = format!(
        "/api/libraries/{}/search?q={}",
        library_id,
        urlencoding::encode(query)
    );
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to search library ({})", response.status()));
    }

    response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

// ============================================================
// Global Search
// ============================================================

pub async fn api_search(
    server_url: &str,
    token: &str,
    query: &str,
) -> Result<serde_json::Value, String> {
    let client = build_client()?;
    let path = format!("/api/search?q={}", urlencoding::encode(query));
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to search ({})", response.status()));
    }

    response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

// ============================================================
// Me (Current User) endpoints
// ============================================================

pub async fn api_get_listening_sessions(
    server_url: &str,
    token: &str,
) -> Result<serde_json::Value, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/me/listening-sessions"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to get listening sessions ({})",
            response.status()
        ));
    }

    response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_get_listening_stats(
    server_url: &str,
    token: &str,
) -> Result<ListeningStats, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/me/listening-stats"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to get listening stats ({})",
            response.status()
        ));
    }

    response
        .json::<ListeningStats>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_get_items_in_progress(
    server_url: &str,
    token: &str,
) -> Result<serde_json::Value, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/me/items-in-progress"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to get items in progress ({})",
            response.status()
        ));
    }

    response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_get_media_progress(
    server_url: &str,
    token: &str,
    library_item_id: &str,
    episode_id: Option<&str>,
) -> Result<serde_json::Value, String> {
    let client = build_client()?;
    let path = if let Some(ep_id) = episode_id {
        format!("/api/me/progress/{}/{}", library_item_id, ep_id)
    } else {
        format!("/api/me/progress/{}", library_item_id)
    };
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to get media progress ({})",
            response.status()
        ));
    }

    response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_create_bookmark(
    server_url: &str,
    token: &str,
    library_item_id: &str,
    time: f64,
    title: String,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/me/item/{}/bookmark", library_item_id);
    let body = serde_json::json!({
        "time": time,
        "title": title
    });
    let response = client
        .post(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to create bookmark ({})", response.status()));
    }

    Ok(())
}

pub async fn api_delete_bookmark(
    server_url: &str,
    token: &str,
    library_item_id: &str,
    time: f64,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/me/item/{}/bookmark/{}", library_item_id, time);
    let response = client
        .delete(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to delete bookmark ({})", response.status()));
    }

    Ok(())
}

// ============================================================
// Collections
// ============================================================

pub async fn api_get_collections(server_url: &str, token: &str) -> Result<Vec<Collection>, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/collections"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get collections ({})", response.status()));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    // Response may be { collections: [...] } or just [...]
    let data: Value = serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))?;
    if let Some(collections_value) = data.get("collections") {
        serde_json::from_value(collections_value.clone()).map_err(|e| format!("Parse error: {}", e))
    } else {
        serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
    }
}

pub async fn api_get_collection(
    server_url: &str,
    token: &str,
    collection_id: &str,
) -> Result<Collection, String> {
    let client = build_client()?;
    let path = format!("/api/collections/{}", collection_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get collection ({})", response.status()));
    }

    response
        .json::<Collection>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_create_collection(
    server_url: &str,
    token: &str,
    library_id: &str,
    name: &str,
    description: Option<&str>,
    books: Vec<String>,
) -> Result<Collection, String> {
    let client = build_client()?;
    let mut body = serde_json::json!({
        "libraryId": library_id,
        "name": name,
        "books": books
    });
    if let Some(desc) = description {
        body["description"] = serde_json::Value::String(desc.to_string());
    }
    let response = client
        .post(build_url(server_url, "/api/collections"))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to create collection ({})",
            response.status()
        ));
    }

    response
        .json::<Collection>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_update_collection(
    server_url: &str,
    token: &str,
    collection_id: &str,
    name: Option<&str>,
    description: Option<&str>,
    books: Option<Vec<String>>,
) -> Result<Collection, String> {
    let client = build_client()?;
    let path = format!("/api/collections/{}", collection_id);
    let mut body = serde_json::json!({});
    if let Some(n) = name {
        body["name"] = serde_json::Value::String(n.to_string());
    }
    if let Some(d) = description {
        body["description"] = serde_json::Value::String(d.to_string());
    }
    if let Some(b) = books {
        body["books"] = serde_json::to_value(b).unwrap_or_default();
    }
    let response = client
        .patch(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to update collection ({})",
            response.status()
        ));
    }

    response
        .json::<Collection>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_delete_collection(
    server_url: &str,
    token: &str,
    collection_id: &str,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/collections/{}", collection_id);
    let response = client
        .delete(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to delete collection ({})",
            response.status()
        ));
    }

    Ok(())
}

// ============================================================
// Playlists
// ============================================================

pub async fn api_get_playlists(server_url: &str, token: &str) -> Result<Vec<Playlist>, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/playlists"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get playlists ({})", response.status()));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    let data: Value = serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))?;
    if let Some(playlists_value) = data.get("playlists") {
        serde_json::from_value(playlists_value.clone()).map_err(|e| format!("Parse error: {}", e))
    } else {
        serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
    }
}

pub async fn api_get_playlist(
    server_url: &str,
    token: &str,
    playlist_id: &str,
) -> Result<Playlist, String> {
    let client = build_client()?;
    let path = format!("/api/playlists/{}", playlist_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get playlist ({})", response.status()));
    }

    response
        .json::<Playlist>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_create_playlist(
    server_url: &str,
    token: &str,
    library_id: &str,
    name: &str,
    description: Option<&str>,
    items: Vec<PlaylistItem>,
) -> Result<Playlist, String> {
    let client = build_client()?;
    let mut body = serde_json::json!({
        "libraryId": library_id,
        "name": name,
        "items": items
    });
    if let Some(desc) = description {
        body["description"] = serde_json::Value::String(desc.to_string());
    }
    let response = client
        .post(build_url(server_url, "/api/playlists"))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to create playlist ({})", response.status()));
    }

    response
        .json::<Playlist>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_delete_playlist(
    server_url: &str,
    token: &str,
    playlist_id: &str,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/playlists/{}", playlist_id);
    let response = client
        .delete(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to delete playlist ({})", response.status()));
    }

    Ok(())
}

// ============================================================
// Authors
// ============================================================

pub async fn api_get_authors(server_url: &str, token: &str) -> Result<Vec<Author>, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/authors"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get authors ({})", response.status()));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    let data: Value = serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))?;
    if let Some(authors_value) = data.get("authors") {
        serde_json::from_value(authors_value.clone()).map_err(|e| format!("Parse error: {}", e))
    } else {
        serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
    }
}

pub async fn api_get_author(
    server_url: &str,
    token: &str,
    author_id: &str,
) -> Result<Author, String> {
    let client = build_client()?;
    let path = format!("/api/authors/{}", author_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get author ({})", response.status()));
    }

    response
        .json::<Author>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_update_author(
    server_url: &str,
    token: &str,
    author_id: &str,
    name: Option<&str>,
    description: Option<&str>,
    asin: Option<&str>,
) -> Result<Author, String> {
    let client = build_client()?;
    let path = format!("/api/authors/{}", author_id);
    let mut body = serde_json::json!({});
    if let Some(n) = name {
        body["name"] = serde_json::Value::String(n.to_string());
    }
    if let Some(d) = description {
        body["description"] = serde_json::Value::String(d.to_string());
    }
    if let Some(a) = asin {
        body["asin"] = serde_json::Value::String(a.to_string());
    }
    let response = client
        .patch(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to update author ({})", response.status()));
    }

    response
        .json::<Author>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

// ============================================================
// Series
// ============================================================

pub async fn api_get_series(
    server_url: &str,
    token: &str,
    library_id: &str,
) -> Result<Vec<Series>, String> {
    let client = build_client()?;
    let path = format!("/api/libraries/{}/series", library_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get series ({})", response.status()));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    let data: Value = serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))?;
    if let Some(series_value) = data.get("series") {
        serde_json::from_value(series_value.clone()).map_err(|e| format!("Parse error: {}", e))
    } else {
        serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
    }
}

pub async fn api_get_series_by_id(
    server_url: &str,
    token: &str,
    series_id: &str,
) -> Result<Series, String> {
    let client = build_client()?;
    let path = format!("/api/series/{}", series_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to get series ({})", response.status()));
    }

    response
        .json::<Series>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

// ============================================================
// Item metadata update
// ============================================================

pub async fn api_update_item_media(
    server_url: &str,
    token: &str,
    item_id: &str,
    metadata: serde_json::Value,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/items/{}/media", item_id);
    let body = serde_json::json!({ "metadata": metadata });
    let response = client
        .patch(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to update item media ({})",
            response.status()
        ));
    }

    Ok(())
}

pub async fn api_match_item(
    server_url: &str,
    token: &str,
    item_id: &str,
    provider: &str,
    query: Option<&str>,
) -> Result<serde_json::Value, String> {
    let client = build_client()?;
    let path = format!("/api/items/{}/match", item_id);
    let mut body = serde_json::json!({ "provider": provider });
    if let Some(q) = query {
        body["query"] = serde_json::Value::String(q.to_string());
    }
    let response = client
        .post(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to match item ({})", response.status()));
    }

    response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

// ============================================================
// Podcast endpoints
// ============================================================

pub async fn api_check_podcast_new_episodes(
    server_url: &str,
    token: &str,
    podcast_id: &str,
) -> Result<serde_json::Value, String> {
    let client = build_client()?;
    let path = format!("/api/podcasts/{}/checknew", podcast_id);
    let response = client
        .get(build_url(server_url, &path))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to check new episodes ({})",
            response.status()
        ));
    }

    response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

pub async fn api_download_podcast_episodes(
    server_url: &str,
    token: &str,
    podcast_id: &str,
    episodes: Vec<serde_json::Value>,
) -> Result<(), String> {
    let client = build_client()?;
    let path = format!("/api/podcasts/{}/download-episodes", podcast_id);
    let body = serde_json::json!({ "episodes": episodes });
    let response = client
        .post(build_url(server_url, &path))
        .headers(build_headers(token))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to download episodes ({})",
            response.status()
        ));
    }

    Ok(())
}

// ============================================================
// Open Sessions
// ============================================================

pub async fn api_get_open_sessions(
    server_url: &str,
    token: &str,
) -> Result<Vec<PlaybackSession>, String> {
    let client = build_client()?;
    let response = client
        .get(build_url(server_url, "/api/sessions/open"))
        .headers(build_headers(token))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to get open sessions ({})",
            response.status()
        ));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    let data: Value = serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))?;
    if let Some(sessions_value) = data.get("sessions") {
        serde_json::from_value(sessions_value.clone()).map_err(|e| format!("Parse error: {}", e))
    } else {
        serde_json::from_str(&body).map_err(|e| format!("Parse error: {}", e))
    }
}
