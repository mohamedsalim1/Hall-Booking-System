use std::fs::OpenOptions;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Mutex, MutexGuard};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const APP_HOST: &str = "127.0.0.1";
const APP_PORT: &str = "4503";
const STARTUP_TIMEOUT_SECS: u64 = 35;

struct BackendState {
  child: Mutex<Option<Child>>,
}

impl BackendState {
  fn lock(&self) -> Result<MutexGuard<'_, Option<Child>>, String> {
    self
      .child
      .lock()
      .map_err(|_| "Failed to lock backend process state.".to_string())
  }
}

fn node_binary() -> String {
  std::env::var("NODE_BINARY").unwrap_or_else(|_| "node".to_string())
}

fn hide_windows_console(command: &mut Command) {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    command.creation_flags(CREATE_NO_WINDOW);
  }
}

fn project_root(app: &AppHandle) -> Result<PathBuf, String> {
  if cfg!(debug_assertions) {
    let from_manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    return from_manifest
      .parent()
      .map(Path::to_path_buf)
      .ok_or_else(|| "Failed to resolve project root in development.".to_string());
  }

  app
    .path()
    .resource_dir()
    .map_err(|e| format!("Failed to resolve resource directory: {e}"))
}

fn resolve_backend_root(app: &AppHandle) -> Result<PathBuf, String> {
  if cfg!(debug_assertions) {
    return Ok(project_root(app)?.join("backend"));
  }

  let resource_dir = app
    .path()
    .resource_dir()
    .map_err(|e| format!("Failed to resolve resource directory: {e}"))?;

  let candidates = [
    resource_dir.clone(),
    resource_dir.join("backend"),
    resource_dir.join("_up_"),
    resource_dir.join("_up_").join("backend"),
    resource_dir.join("resources"),
    resource_dir.join("resources").join("backend"),
    resource_dir.join("_up_").join("resources"),
    resource_dir.join("_up_").join("resources").join("backend"),
  ];

  for candidate in candidates {
    let server = candidate.join("server.js");
    let init_sqlite = candidate.join("scripts").join("initSqlite.js");
    if server.exists() && init_sqlite.exists() {
      return Ok(candidate);
    }
  }

  Err(format!(
    "Backend resources not found under {}",
    resource_dir.display()
  ))
}

fn resolve_frontend_build_path(app: &AppHandle, backend_root: &Path) -> Option<PathBuf> {
  let mut candidates = Vec::new();

  if let Some(parent) = backend_root.parent() {
    candidates.push(parent.join("frontend").join("build"));
    candidates.push(parent.join("build"));
  }

  if let Ok(resource_dir) = app.path().resource_dir() {
    candidates.push(resource_dir.join("build"));
    candidates.push(resource_dir.join("frontend").join("build"));
    candidates.push(resource_dir.join("_up_").join("build"));
    candidates.push(resource_dir.join("_up_").join("frontend").join("build"));
    candidates.push(resource_dir.join("_up_").join("resources").join("build"));
    candidates.push(resource_dir.join("_up_").join("resources").join("frontend").join("build"));
    candidates.push(resource_dir.join("resources").join("frontend").join("build"));
    candidates.push(resource_dir.join("resources").join("build"));
  }

  candidates
    .into_iter()
    .find(|path| path.join("index.html").exists())
}

fn script_path(root: &Path, relative: &str) -> PathBuf {
  let parts = relative.split('/').filter(|part| !part.is_empty());
  parts.fold(root.to_path_buf(), |acc, part| acc.join(part))
}

fn normalize_windows_path(path: &Path) -> PathBuf {
  let raw = path.to_string_lossy();

  if cfg!(target_os = "windows") && raw.starts_with(r"\\?\") {
    return PathBuf::from(raw.trim_start_matches(r"\\?\"));
  }

  path.to_path_buf()
}

fn sqlite_url(path: &Path) -> String {
  let normalized = normalize_windows_path(path);
  let raw = normalized.to_string_lossy().replace('\\', "/");

  format!("file:{raw}")
}

fn startup_log_path(app: &AppHandle) -> Option<PathBuf> {
  let data_dir = app.path().app_data_dir().ok()?;
  if std::fs::create_dir_all(&data_dir).is_err() {
    return None;
  }
  Some(data_dir.join("startup.log"))
}

fn log_line(log_path: Option<&Path>, message: &str) {
  let Some(path) = log_path else {
    return;
  };
  let ts = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_secs())
    .unwrap_or(0);
  let line = format!("[{ts}] {message}\n");
  let _ = OpenOptions::new()
    .create(true)
    .append(true)
    .open(path)
    .and_then(|mut f| f.write_all(line.as_bytes()));
}

fn pipe_output_to_log<R: Read + Send + 'static>(reader: R, prefix: &'static str, log_path: PathBuf) {
  thread::spawn(move || {
    let mut line_reader = BufReader::new(reader);
    let mut line = String::new();
    loop {
      line.clear();
      match line_reader.read_line(&mut line) {
        Ok(0) => break,
        Ok(_) => log_line(Some(log_path.as_path()), &format!("[{prefix}] {}", line.trim_end())),
        Err(_) => break,
      }
    }
  });
}

fn run_node_script(script: &Path, envs: &[(&str, String)], log_path: Option<&Path>) -> Result<(), String> {
  let script = normalize_windows_path(script);

  if !script.exists() {
    return Err(format!("Missing script: {}", script.display()));
  }

  let mut command = Command::new(node_binary());
  command.arg(&script);
  command.env("ELECTRON_RUN_AS_NODE", "1");
  command.env("APP_PORT", APP_PORT);
  hide_windows_console(&mut command);

  for (key, value) in envs {
    command.env(key, value);
  }

  let output = command
    .output()
    .map_err(|error| format!("Failed running {}: {error}", script.display()))?;

  let stdout = String::from_utf8_lossy(&output.stdout);
  let stderr = String::from_utf8_lossy(&output.stderr);
  if !stdout.trim().is_empty() {
    log_line(log_path, &format!("Script stdout ({}): {}", script.display(), stdout.trim()));
  }
  if !stderr.trim().is_empty() {
    log_line(log_path, &format!("Script stderr ({}): {}", script.display(), stderr.trim()));
  }

  if !output.status.success() {
    return Err(format!("Script failed ({}): {}", output.status, script.display()));
  }

  Ok(())
}

fn wait_for_health(url_path: &str, timeout: Duration) -> Result<(), String> {
  let started = Instant::now();

  while started.elapsed() < timeout {
    if let Ok(mut stream) = TcpStream::connect((APP_HOST, APP_PORT.parse::<u16>().unwrap_or(4503))) {
      let request = format!(
        "GET {url_path} HTTP/1.1\r\nHost: {APP_HOST}:{APP_PORT}\r\nConnection: close\r\n\r\n"
      );

      if stream.write_all(request.as_bytes()).is_ok() {
        let mut response = String::new();
        if stream.read_to_string(&mut response).is_ok() && response.starts_with("HTTP/1.1 200") {
          return Ok(());
        }
      }
    }

    thread::sleep(Duration::from_millis(500));
  }

  Err("Timed out waiting for backend health endpoint.".to_string())
}

fn prepare_database(app: &AppHandle, backend_root: &Path, log_path: Option<&Path>) -> Result<(), String> {
  let data_dir = app
    .path()
    .app_data_dir()
    .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;

  std::fs::create_dir_all(&data_dir)
    .map_err(|e| format!("Failed to create app data dir: {e}"))?;

  let db_file = data_dir.join("hall-booking.db");
  let db_url = sqlite_url(&db_file);

  let init_script = script_path(backend_root, "scripts/initSqlite.js");
  let seed_script = script_path(backend_root, "prisma/seed.js");

  let envs = [("DATABASE_URL", db_url)];
  run_node_script(&init_script, &envs, log_path)?;
  run_node_script(&seed_script, &envs, log_path)?;

  Ok(())
}

fn start_backend(app: &AppHandle, backend_root: &Path, log_path: Option<&Path>) -> Result<Child, String> {
  let data_dir = app
    .path()
    .app_data_dir()
    .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;
  let db_file = data_dir.join("hall-booking.db");
  let db_url = sqlite_url(&db_file);
  let server_path = normalize_windows_path(&script_path(backend_root, "server.js"));

  if !server_path.exists() {
    return Err(format!("Missing backend server: {}", server_path.display()));
  }

  let frontend_build_path = resolve_frontend_build_path(app, backend_root);

  let frontend_build_path = frontend_build_path.map(|p| normalize_windows_path(&p));

  let mut command = Command::new(node_binary());
  command
    .arg(&server_path)
    .env("PORT", APP_PORT)
    .env("HOST", APP_HOST)
    .env("CLIENT_URL", format!("http://{APP_HOST}:{APP_PORT}"))
    .env("DATABASE_URL", db_url)
    .env(
      "FRONTEND_BUILD_PATH",
      frontend_build_path
        .unwrap_or_else(|| normalize_windows_path(&backend_root.join("..").join("frontend").join("build")))
        .to_string_lossy()
        .to_string(),
    )
    .env("NODE_ENV", "production")
    .env("ELECTRON_RUN_AS_NODE", "1")
    .stdout(Stdio::piped())
    .stderr(Stdio::piped());

  hide_windows_console(&mut command);

  let mut child = command
    .spawn()
    .map_err(|error| format!("Failed to start backend: {error}"))?;

  if let Some(path) = log_path {
    if let Some(stdout) = child.stdout.take() {
      pipe_output_to_log(stdout, "backend stdout", path.to_path_buf());
    }
    if let Some(stderr) = child.stderr.take() {
      pipe_output_to_log(stderr, "backend stderr", path.to_path_buf());
    }
  }

  Ok(child)
}

fn open_main_window(app: &AppHandle) -> Result<(), String> {
  let target = format!("http://{APP_HOST}:{APP_PORT}")
    .parse()
    .map_err(|error| format!("Invalid app URL: {error}"))?;

  WebviewWindowBuilder::new(app, "main", WebviewUrl::External(target))
    .title("Hall Booking System")
    .inner_size(1440.0, 900.0)
    .min_inner_size(1100.0, 720.0)
    .build()
    .map_err(|error| format!("Failed to create main window: {error}"))?;

  Ok(())
}

fn kill_backend(state: &BackendState) {
  if let Ok(mut guard) = state.lock() {
    if let Some(child) = guard.as_mut() {
      let _ = child.kill();
    }
    *guard = None;
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let app = tauri::Builder::default()
    .manage(BackendState {
      child: Mutex::new(None),
    })
    .setup(|app| {
      let log_path = startup_log_path(&app.handle());
      log_line(log_path.as_deref(), "Application startup started.");

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let root = project_root(&app.handle()).map_err(|e| {
        log_line(log_path.as_deref(), &format!("project_root failed: {e}"));
        e
      })?;
      log_line(log_path.as_deref(), &format!("Resolved project root: {}", root.display()));

      let backend_root = resolve_backend_root(&app.handle()).map_err(|e| {
        log_line(log_path.as_deref(), &format!("resolve_backend_root failed: {e}"));
        e
      })?;
      log_line(
        log_path.as_deref(),
        &format!("Resolved backend root: {}", backend_root.display()),
      );

      prepare_database(&app.handle(), &backend_root, log_path.as_deref()).map_err(|e| {
        log_line(log_path.as_deref(), &format!("prepare_database failed: {e}"));
        e
      })?;
      log_line(log_path.as_deref(), "Database prepared.");

      let child = start_backend(&app.handle(), &backend_root, log_path.as_deref()).map_err(|e| {
        log_line(log_path.as_deref(), &format!("start_backend failed: {e}"));
        e
      })?;
      log_line(log_path.as_deref(), "Backend process started.");

      {
        let state = app.state::<BackendState>();
        let mut guard = state.lock()?;
        *guard = Some(child);
      }

      wait_for_health("/health", Duration::from_secs(STARTUP_TIMEOUT_SECS)).map_err(|e| {
        log_line(log_path.as_deref(), &format!("wait_for_health failed: {e}"));
        e
      })?;
      log_line(log_path.as_deref(), "Backend health check succeeded.");

      open_main_window(&app.handle()).map_err(|e| {
        log_line(log_path.as_deref(), &format!("open_main_window failed: {e}"));
        e
      })?;
      log_line(log_path.as_deref(), "Main window created. Startup completed.");

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while running tauri application");

  app.run(|app, event| {
    if matches!(event, tauri::RunEvent::Exit) {
      let log_path = startup_log_path(app);
      log_line(log_path.as_deref(), "Application exiting. Stopping backend process.");
      let state = app.state::<BackendState>();
      kill_backend(&state);
    }
  });
}
