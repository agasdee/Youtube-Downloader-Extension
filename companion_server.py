import os
import sys

# Prevent Python from creating __pycache__ folders which violate Chrome Extension rules
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
sys.dont_write_bytecode = True

import re
import threading
import urllib.parse
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import yt_dlp
from datetime import datetime

# Global storage for tracking real-time download status
DOWNLOAD_STATUS = {}
DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Download_Dubplitube")
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server.log')

# Custom logger to output both to command prompt and d:\Dubplitube\server.log
def log_print(*args, **kwargs):
    message = " ".join(map(str, args))
    # Print to normal console
    print(message, **kwargs)
    # Write to server.log
    try:
        clean_msg = message.replace('\r', '').strip()
        if clean_msg:
            with open(LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(clean_msg + '\n')
    except Exception:
        pass

# Clear log file on startup
try:
    with open(LOG_FILE, 'w', encoding='utf-8') as f:
        f.write("=== DUBPLITUBE SERVER LOG START ===\n")
except Exception:
    pass

def check_and_install_ytdlp():
    log_print("[Dubplitube Companion] Checking for yt-dlp installation and updates...")
    try:
        subprocess_cmd = [sys.executable, "-m", "pip", "install", "-U", "yt-dlp"]
        import subprocess
        subprocess.check_call(subprocess_cmd)
        log_print("[Dubplitube Companion] yt-dlp is successfully installed/updated!\n")
    except Exception as e:
        log_print(f"[Warning] yt-dlp check: {e}\n")

# Thread worker for processing direct non-blocking downloads
def download_thread_worker(video_id, quality, type_, title, save_path):
    yt_url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Progress hook called by yt-dlp natively during download
    def progress_hook(d):
        if d['status'] == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
            downloaded = d.get('downloaded_bytes', 0)
            
            percent = 0
            if total > 0:
                percent = int((downloaded / total) * 100)
                
            # Map download progress from 0% - 90% (reserve last 10% for FFmpeg processing)
            mapped_percent = int(percent * 0.9)
            
            # Print beautiful live console logger
            speed = d.get('_speed_str', 'N/A')
            eta = d.get('_eta_str', 'N/A')
            log_print(f"\r[Downloading] {percent}% | Speed: {speed} | ETA: {eta}  ", end="", flush=True)
            
            DOWNLOAD_STATUS[video_id] = {
                "success": True,
                "status": "downloading",
                "percent": mapped_percent,
                "error": None
            }
            
        elif d['status'] == 'finished':
            log_print("\n[Merging] Download finished. Merging formats using FFmpeg...")
            DOWNLOAD_STATUS[video_id] = {
                "success": True,
                "status": "merging",
                "percent": 95,
                "error": None
            }

    # Setup yt-dlp configurations
    download_date = datetime.now().strftime("%d%m%Y")
    ydl_opts = {
        'ffmpeg_location': os.path.dirname(os.path.abspath(__file__)),
        'outtmpl': os.path.join(save_path, f'%(title)s.%(uploader)s.{quality}.%(upload_date.6:8)s%(upload_date.4:6)s%(upload_date.0:4)s.{download_date}.%(ext)s'),
        'no_playlist': True,
        'progress_hooks': [progress_hook],
        'quiet': True,
        'no_warnings': True,
        'color': 'no_color',
        
        # --- ANTI-BAN & ANTI-THROTTLING (GOLDEN RULE) ---
        'geo_bypass': True,
        'sleep_interval_requests': 1,  # Random wait between internal API calls to seem human
        'extractor_retries': 4,        # Retry gracefully if connection is dropped
        'extractor_args': {
            'youtube': ['player_client=android', 'player_skip=web'] # Use Android API (less strict bot detection than Web)
        }
        # ------------------------------------------------
    }
    if type_ == 'audio':
        if quality == 'm4a':
            ydl_opts.update({
                'format': 'bestaudio[ext=m4a]/bestaudio/best',
            })
        else:
            ydl_opts.update({
                'format': 'bestaudio[ext=m4a]/bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '320' if quality == '320kbps' else '128',
                }],
            })
    elif type_ == 'transcript':
        # Subtitle / Transcript extraction
        lang = quality # We passed 'th' or 'en' as the quality parameter
        ydl_opts.update({
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': [lang],
            'subtitlesformat': 'srt',
            # Anti-ban specifically for subtitles
            'extractor_args': {'youtube': ['player_client=android,web']}
        })
    else:
        res = quality.replace('p', '')
        # ULTIMATE FIX FOR ERROR -22 ON ANCIENT FFMPEG:
        # Force download of H.264 video and AAC audio which old FFmpeg can handle.
        # If separate streams aren't available, fallback to pre-merged MP4 ('best[ext=mp4]'), avoiding FFmpeg merge entirely.
        ydl_opts.update({
            'format': f'bestvideo[vcodec^=avc1][height<={res}]+bestaudio[acodec^=mp4a]/best[ext=mp4][height<={res}]/best',
            'merge_output_format': 'mp4'
        })

    try:
        DOWNLOAD_STATUS[video_id] = {
            "success": True,
            "status": "preparing",
            "percent": 5,
            "error": None
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([yt_url])
            
        log_print("[✅ Complete] Download completed successfully!\n")
        DOWNLOAD_STATUS[video_id] = {
            "success": True,
            "status": "complete",
            "percent": 100,
            "error": None
        }
    except Exception as e:
        error_msg = str(e)
        # Strip ANSI escape codes
        error_msg = re.sub(r'\x1b\[[0-9;]*m', '', error_msg)
        
        log_print(f"\n[❌ Failed] Download failed for ID {video_id}: {error_msg}\n")
        DOWNLOAD_STATUS[video_id] = {
            "success": False,
            "status": "failed",
            "percent": 0,
            "error": error_msg
        }

class DubplitubeHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable full CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        if parsed_url.path == '/download':
            self.handle_download(parsed_url.query)
        elif parsed_url.path == '/status':
            self.handle_status(parsed_url.query)
        elif parsed_url.path == '/ping':
            self.handle_ping()
        else:
            self.send_error(404, "Not Found")

    def handle_ping(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "active"}).encode('utf-8'))

    def handle_status(self, query_string):
        params = urllib.parse.parse_qs(query_string)
        video_id = params.get('id', [''])[0]
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        status = DOWNLOAD_STATUS.get(video_id, {
            "success": True,
            "status": "idle",
            "percent": 0,
            "error": None
        })
        self.wfile.write(json.dumps(status).encode('utf-8'))

    def handle_download(self, query_string):
        params = urllib.parse.parse_qs(query_string)
        
        video_id = params.get('id', [''])[0]
        quality = params.get('quality', ['1080p'])[0]
        type_ = params.get('type', ['video'])[0]
        title = params.get('title', ['YouTube Video'])[0]
        save_path = params.get('save_path', [DOWNLOADS_DIR])[0]
        
        if not video_id:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "Missing 'id'"}).encode('utf-8'))
            return

        # Initialize status
        DOWNLOAD_STATUS[video_id] = {
            "success": True,
            "status": "preparing",
            "percent": 0,
            "error": None
        }

        log_print(f"\n[📥 New Download Request] Title: \"{title}\"")
        log_print(f"                         ID: {video_id} | Quality: {quality} | Type: {type_}")
        log_print(f"                         Path: {save_path}")
        
        os.makedirs(save_path, exist_ok=True)
        
        # Spawn download inside a separate thread immediately to prevent blocking the HTTP response
        thread = threading.Thread(target=download_thread_worker, args=(video_id, quality, type_, title, save_path))
        thread.daemon = True
        thread.start()

        # Send instant response back to background script so Chrome doesn't timeout!
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "status": "started",
            "message": "Download thread started successfully."
        }).encode('utf-8'))

def run_server(port=5000):
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    check_and_install_ytdlp()
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, DubplitubeHandler)
    
    log_print("=================================================================")
    log_print("       ⚡ DUBPLITUBE COMPANION SERVER IS READY ⚡")
    log_print("       [v1.0.14 - The Ultimate Edition]")
    log_print("=================================================================")
    log_print(f"  Server Address : http://localhost:{port}")
    log_print(f"  Downloads Path : {DOWNLOADS_DIR}")
    log_print("  Status         : Listening for Chrome Extension calls...")
    log_print("  * Live downloads will stream details to this console window.")
    log_print("=================================================================\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        log_print("\n[Dubplitube Companion] Shutting down gracefully...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
