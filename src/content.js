/* ----------------------------------------------------
 * DUBPLITUBE - content.js (YouTube Scraper & DOM Injector)
 * ---------------------------------------------------- */

// --- Hot Reload Cleanup ---
if (window.dubplitubeObserver) {
  window.dubplitubeObserver.disconnect();
}
const oldBtn = document.getElementById('dubplitube-watch-btn');
if (oldBtn) oldBtn.remove();
document.querySelectorAll('.dubplitube-shorts-btn-wrapper').forEach(el => el.remove());
const oldStyle = document.getElementById('dubplitube-style');
if (oldStyle) oldStyle.remove();
// --------------------------

// Inject custom CSS styles for the native-looking YouTube download buttons
const style = document.createElement('style');
style.id = 'dubplitube-style';
style.textContent = `
  /* Watch Video injected button */
  .dubplitube-download-btn {
    background: linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%) !important;
    color: #ffffff !important;
    border: none !important;
    padding: 0 16px !important;
    height: 36px !important;
    border-radius: 18px !important;
    font-family: Roboto, Arial, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    margin-left: 8px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35) !important;
    z-index: 9999 !important;
  }
  .dubplitube-download-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.5) !important;
    filter: brightness(1.1) !important;
  }
  .dubplitube-download-btn:active {
    transform: translateY(0) !important;
  }
  
  /* Shorts injected action button */
  .dubplitube-shorts-btn-wrapper {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    margin-bottom: 16px !important;
    cursor: pointer !important;
    z-index: 9999 !important;
  }
  .dubplitube-shorts-btn {
    width: 48px !important;
    height: 48px !important;
    border-radius: 50% !important;
    background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%) !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4) !important;
    transition: all 0.25s ease !important;
  }
  .dubplitube-shorts-btn:hover {
    transform: scale(1.1) !important;
    box-shadow: 0 0 16px rgba(6, 182, 212, 0.7) !important;
  }
  .dubplitube-shorts-text {
    color: #ffffff !important;
    font-family: Roboto, Arial, sans-serif !important;
    font-size: 12px !important;
    margin-top: 6px !important;
    text-align: center !important;
    font-weight: 500 !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6) !important;
  }
`;
document.head.appendChild(style);

// Helper function to extract Video ID from standard YouTube URL or Shorts URL
function getVideoId(url = window.location.href) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Scrape video information from the active page DOM
function scrapeVideoInfo() {
  const videoId = getVideoId();
  if (!videoId) return null;

  // Retrieve title
  let title = "Unknown Title";
  const titleEl = document.querySelector('h1.ytd-watch-metadata') || 
                  document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer') ||
                  document.querySelector('yt-formatted-string.ytd-video-primary-info-renderer');
  if (titleEl && titleEl.innerText) {
    title = titleEl.innerText.trim();
  } else if (document.title) {
    title = document.title.replace(" - YouTube", "").trim();
  }

  // Retrieve channel name
  let channelName = "Unknown Channel";
  const channelEl = document.querySelector('ytd-channel-name a') || 
                    document.querySelector('#channel-name a') || 
                    document.querySelector('.ytd-channel-name');
  if (channelEl && channelEl.innerText) {
    channelName = channelEl.innerText.trim();
  }

  // Retrieve upload date
  let uploadDate = "UnknownDate";
  const dateMeta = document.querySelector('meta[itemprop="uploadDate"]');
  if (dateMeta && dateMeta.content) {
    // Expected format: YYYY-MM-DD
    const parts = dateMeta.content.split('-');
    if (parts.length === 3) {
      uploadDate = `${parts[2]}${parts[1]}${parts[0]}`; // DDMMYYYY
    } else {
      uploadDate = dateMeta.content.replace(/-/g, '');
    }
  }

  // Retrieve duration
  let duration = 0;
  const videoEl = document.querySelector('video');
  if (videoEl && videoEl.duration) {
    duration = Math.round(videoEl.duration);
  } else {
    const durationTextEl = document.querySelector('.ytp-time-duration');
    if (durationTextEl && durationTextEl.innerText) {
      const parts = durationTextEl.innerText.split(':').map(Number);
      if (parts.length === 2) duration = parts[0] * 60 + parts[1];
      else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  if (!duration) duration = 180; // fallback to 3 minutes

  // Calculate file sizes (estimated based on duration in seconds)
  const durationMin = duration / 60;
  const videoQualities = [
    { id: '2160p', label: '4K Ultra HD (2160p)', fileSize: formatSize(durationMin * 25) },
    { id: '1080p', label: 'Full HD (1080p)', fileSize: formatSize(durationMin * 12) },
    { id: '720p', label: 'HD Ready (720p)', fileSize: formatSize(durationMin * 7) },
    { id: '360p', label: 'SD Quality (360p)', fileSize: formatSize(durationMin * 3) }
  ];

  const audioQualities = [
    { id: '320kbps', label: 'Studio Audio (320kbps)', fileSize: formatSize(durationMin * 2.4) },
    { id: '128kbps', label: 'Standard Audio (128kbps)', fileSize: formatSize(durationMin * 1.0) },
    { id: 'm4a', label: 'Original AAC (M4A)', fileSize: formatSize(durationMin * 1.0) }
  ];

  return {
    id: videoId,
    title: title,
    channelName: channelName,
    uploadDate: uploadDate,
    duration: duration,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    videoQualities: videoQualities,
    audioQualities: audioQualities
  };
}

// Convert MB size to human-readable string
function formatSize(sizeInMB) {
  if (sizeInMB >= 1024) {
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  }
  return `${Math.round(sizeInMB)} MB`;
}

// Inject button into normal video page
function injectVideoDownloadButton() {
  // Check if button is already injected
  if (document.getElementById('dubplitube-watch-btn')) return;

  // Locate native actions bar container
  // YouTube watch layout: `#top-row #actions` or `#actions-inner`
  const actionsInner = document.querySelector('#top-row #actions #actions-inner #menu ytd-menu-renderer #items') ||
                       document.querySelector('ytd-watch-metadata #actions #actions-inner') ||
                       document.querySelector('#actions-inner');
                       
  if (!actionsInner) return;

  // Create our custom download button
  const button = document.createElement('button');
  button.id = 'dubplitube-watch-btn';
  button.className = 'dubplitube-download-btn';
  button.innerHTML = '<span>📥</span> Download';
  button.title = 'Download video/audio with Dubplitube';

  button.addEventListener('click', () => {
    // Open Chrome extension popup or options/settings page
    // For MV3 content script, we can ping background worker to launch options or just alert
    chrome.runtime.sendMessage({ action: 'triggerDownloadFlow' });
  });

  // Insert our button
  actionsInner.appendChild(button);
}

// Inject button into Shorts page
function injectShortsDownloadButton() {
  // Locate active Shorts renderer side panels
  const shortsPanels = document.querySelectorAll('ytd-reel-video-renderer[is-active] #like-button, ytd-reel-video-renderer #like-button');
  
  shortsPanels.forEach(panel => {
    const parentContainer = panel.closest('#actions');
    if (!parentContainer || parentContainer.querySelector('.dubplitube-shorts-btn-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'dubplitube-shorts-btn-wrapper';
    
    const button = document.createElement('button');
    button.className = 'dubplitube-shorts-btn';
    button.innerHTML = '<span style="font-size: 20px;">📥</span>';
    button.title = 'Download Shorts with Dubplitube';

    const label = document.createElement('span');
    label.className = 'dubplitube-shorts-text';
    label.innerText = 'Download';

    wrapper.appendChild(button);
    wrapper.appendChild(label);

    wrapper.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'triggerDownloadFlow' });
    });

    // Insert above Share / comments or at bottom of actions container
    parentContainer.appendChild(wrapper);
  });
}

// Observe URL and DOM shifts since YouTube is an SPA
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
  }
  
  if (currentUrl.includes('/watch')) {
    injectVideoDownloadButton();
  } else if (currentUrl.includes('/shorts')) {
    injectShortsDownloadButton();
  }
});

// Start observing YouTube body mutations
observer.observe(document.body, { childList: true, subtree: true });
window.dubplitubeObserver = observer;

// Run initial injection check
if (window.location.href.includes('/watch')) {
  setTimeout(injectVideoDownloadButton, 1500);
} else if (window.location.href.includes('/shorts')) {
  setTimeout(injectShortsDownloadButton, 1500);
}

// Message listener to reply with scraped details to popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoInfo') {
    const videoInfo = scrapeVideoInfo();
    if (videoInfo) {
      sendResponse({ videoInfo: videoInfo });
    } else {
      sendResponse({ error: 'Could not extract metadata.' });
    }
  } else if (request.action === 'triggerFlashMessage') {
    // Show visual indicator when download starts
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%);
      color: white;
      padding: 14px 24px;
      border-radius: 12px;
      z-index: 999999;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.2);
      transition: all 0.5s ease;
    `;
    alertDiv.innerText = `📥 Dubplitube: Preparing download for "${request.title}"`;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      alertDiv.style.transform = 'translateY(-20px)';
      setTimeout(() => alertDiv.remove(), 500);
    }, 3000);
    
    sendResponse({ success: true });
  }
  return true; // Keep response channel open asynchronously
});
