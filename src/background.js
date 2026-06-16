/* ----------------------------------------------------
 * DUBPLITUBE - background.js (Service Worker Downloader)
 * ---------------------------------------------------- */

// Default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    downloadEngine: 'local', // 'api' (Cloud) or 'local' (yt-dlp local host)
    preferredFolder: 'Dubplitube',
    audioFormat: 'mp3_320'
  });
});

// Listener for message passing between popup, content script, and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'triggerDownloadFlow') {
    // Bring up popup or instruct user to click extension popup icon
    chrome.action.openPopup ? chrome.action.openPopup() : null;
    sendResponse({ success: true });
  } else if (request.action === 'downloadVideo') {
    const { videoId, qualityId, type, title, channelName, uploadDate } = request;
    
    // Retrieve download settings
    chrome.storage.local.get(['downloadEngine', 'preferredFolder', 'localSavePath'], (settings) => {
      let engine = settings.downloadEngine || 'local';
      if (type === 'transcript') engine = 'local';
      const folder = settings.preferredFolder || 'Dubplitube';
      
      const cleanTitle = sanitizeFilename(title);
      const cleanChannel = sanitizeFilename(channelName || 'Unknown');
      const cleanUpload = sanitizeFilename(uploadDate || 'UnknownDate');
      
      const d = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const downloadDate = `${pad(d.getDate())}${pad(d.getMonth()+1)}${d.getFullYear()}`;
      
      let ext = 'mp4';
      if (type === 'audio') ext = (qualityId === 'm4a' ? 'm4a' : 'mp3');
      if (type === 'transcript') ext = `${qualityId}.srt`;
      
      const filename = `${folder}/${cleanTitle}.${cleanChannel}.${qualityId}.${cleanUpload}.${downloadDate}.${ext}`;

      if (engine === 'local') {
        // Option B: Local companion yt-dlp server (downloads directly on PC)
        handleLocalDownload(videoId, qualityId, type, cleanTitle, settings.localSavePath, sendResponse);
      } else {
        // Option A: Free cloud conversion API
        handleCloudApiDownload(videoId, qualityId, type, filename, sendResponse);
      }
    });
    
    return true; // Keep message channel open for async response
  } else if (request.action === 'checkStatus') {
    const { videoId } = request;
    fetch(`http://localhost:5000/status?id=${videoId}`)
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

// Handle Cloud API Download (Option A)
// Utilizes public reliable media extraction and conversion interfaces
async function handleCloudApiDownload(videoId, qualityId, type, filename, sendResponse) {
  try {
    let downloadUrl = '';
    
    if (type === 'audio') {
      downloadUrl = `https://api.vevioz.com/download/mp3/${videoId}`;
    } else {
      const res = qualityId.replace('p', '');
      downloadUrl = `https://api.vevioz.com/download/mp4/${videoId}/${res}`;
    }
    
    if (!downloadUrl) {
      throw new Error("Unable to obtain direct download link.");
    }
    
    chrome.downloads.download({
      url: downloadUrl,
      filename: filename,
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Downloads error:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId: downloadId });
      }
    });

  } catch (error) {
    console.error("Cloud download failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle Local Companion yt-dlp Download (Option B)
async function handleLocalDownload(videoId, qualityId, type, title, savePath, sendResponse) {
  const localCompanionUrl = 'http://localhost:5000/download';
  
  try {
    const encodedTitle = encodeURIComponent(title);
    const encodedPath = savePath ? `&save_path=${encodeURIComponent(savePath)}` : '';
    const response = await fetch(`${localCompanionUrl}?id=${videoId}&quality=${qualityId}&type=${type}&title=${encodedTitle}${encodedPath}`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.success) {
        sendResponse({ success: true, local: true, filename: data.filename });
      } else {
        sendResponse({ success: false, error: data.error || "Local companion failed to download." });
      }
    } else {
      sendResponse({ success: false, error: "Local companion server returned an error state." });
    }
  } catch (error) {
    console.error("Local companion connection failed:", error);
    sendResponse({ 
      success: false, 
      error: "Companion server NOT detected! Please double-click 'run_companion.bat' to start the local yt-dlp server first."
    });
  }
}

// File name cleaner to avoid OS file system conflicts
function sanitizeFilename(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, '') // remove illegal characters
    .replace(/\s+/g, ' ')         // merge spaces
    .trim();
}
