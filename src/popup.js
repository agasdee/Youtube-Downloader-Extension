document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const noVideoSection = document.getElementById('no-video');
  const videoInfoSection = document.getElementById('video-info');
  const videoThumbnail = document.getElementById('video-thumbnail');
  const videoTitle = document.getElementById('video-title');
  const videoDuration = document.getElementById('video-duration');
  const channelName = document.getElementById('channel-name');
  const videoQualities = document.getElementById('video-qualities');
  const audioQualities = document.getElementById('audio-qualities');
  const progressContainer = document.getElementById('download-progress');
  const progressBar = document.getElementById('progress');
  const progressStatus = document.getElementById('progress-status');
  const progressPercentText = document.getElementById('progress-percent');
  const openYouTubeBtn = document.getElementById('open-youtube');
  const settingsBtn = document.getElementById('settings-btn');
  const engineApiBtn = document.getElementById('engine-api');
  const engineLocalBtn = document.getElementById('engine-local');
  const historyBtn = document.getElementById('history-btn');
  const historyBackBtn = document.getElementById('history-back-btn');
  const historyClearBtn = document.getElementById('history-clear-btn');
  const mainView = document.getElementById('main-view');
  const historyView = document.getElementById('history-view');
  const historyList = document.getElementById('history-list');
  const settingsView = document.getElementById('settings-view');
  const settingsBackBtn = document.getElementById('settings-back-btn');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const localSavePathInput = document.getElementById('local-save-path');
  const cloudFolderInput = document.getElementById('cloud-folder');
  
  // State variables
  let currentVideo = null;
  let activeDownloadInterval = null;

  // Initialize engine switcher from storage
  chrome.storage.local.get(['downloadEngine'], (settings) => {
    const activeEngine = settings.downloadEngine || 'local';
    setEngineActiveState(activeEngine);
  });

  // Switcher Handlers
  engineApiBtn.addEventListener('click', () => {
    chrome.storage.local.set({ downloadEngine: 'api' }, () => {
      setEngineActiveState('api');
    });
  });

  engineLocalBtn.addEventListener('click', () => {
    chrome.storage.local.set({ downloadEngine: 'local' }, () => {
      setEngineActiveState('local');
    });
  });

  // Transcript Handlers
  const transcriptBtns = document.querySelectorAll('#subtitle-qualities button');
  transcriptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      initiateDownload({id: btn.dataset.id, fileSize: 'TXT'}, 'transcript');
    });
  });

  function setEngineActiveState(engine) {
    if (engine === 'local') {
      engineLocalBtn.classList.add('active');
      engineApiBtn.classList.remove('active');
    } else {
      engineApiBtn.classList.add('active');
      engineLocalBtn.classList.remove('active');
    }
  }

  // Check if we're on a YouTube video page
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;
    const currentTab = tabs[0];
    const url = currentTab.url || '';
    
    if (isYouTubeVideoUrl(url)) {
      noVideoSection.classList.add('hidden');
      videoInfoSection.classList.remove('hidden');
      
      // Request video info from content script
      chrome.tabs.sendMessage(currentTab.id, {action: 'getVideoInfo'}, (response) => {
        if (chrome.runtime.lastError) {
          showError('Please refresh the YouTube tab to initialize downloader.');
          return;
        }
        
        if (response && response.videoInfo) {
          displayVideoInfo(response.videoInfo);
        } else {
          showError('Could not retrieve video details. Try re-opening the popup.');
        }
      });
    } else {
      noVideoSection.classList.remove('hidden');
      videoInfoSection.classList.add('hidden');
    }
  });
  
  openYouTubeBtn.addEventListener('click', () => {
    chrome.tabs.create({url: 'https://www.youtube.com'});
  });
  
  settingsBtn.addEventListener('click', () => {
    mainView.classList.add('hidden');
    historyView.classList.add('hidden');
    settingsView.classList.remove('hidden');
    
    // Load existing settings
    chrome.storage.local.get(['localSavePath', 'preferredFolder'], (res) => {
      localSavePathInput.value = res.localSavePath || '';
      cloudFolderInput.value = res.preferredFolder || 'Dubplitube';
    });
  });

  settingsBackBtn.addEventListener('click', () => {
    settingsView.classList.add('hidden');
    mainView.classList.remove('hidden');
  });

  saveSettingsBtn.addEventListener('click', () => {
    const localSavePath = localSavePathInput.value.trim();
    const preferredFolder = cloudFolderInput.value.trim() || 'Dubplitube';
    
    chrome.storage.local.set({ 
      localSavePath: localSavePath,
      preferredFolder: preferredFolder
    }, () => {
      saveSettingsBtn.textContent = '✅ Saved!';
      setTimeout(() => {
        saveSettingsBtn.textContent = '💾 Save Settings';
        settingsView.classList.add('hidden');
        mainView.classList.remove('hidden');
      }, 1000);
    });
  });

  // History Handlers
  historyBtn.addEventListener('click', () => {
    mainView.classList.add('hidden');
    historyView.classList.remove('hidden');
    renderHistory();
  });

  historyBackBtn.addEventListener('click', () => {
    historyView.classList.add('hidden');
    mainView.classList.remove('hidden');
  });

  historyClearBtn.addEventListener('click', () => {
    chrome.storage.local.set({ downloadHistory: [] }, () => {
      renderHistory();
    });
  });

  function saveToHistory(videoInfo, quality, type) {
    chrome.storage.local.get(['downloadHistory'], (res) => {
      let history = res.downloadHistory || [];
      const entry = {
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        quality: quality,
        type: type,
        timestamp: new Date().getTime()
      };
      history.unshift(entry);
      // Keep only last 50
      if (history.length > 50) history.pop();
      chrome.storage.local.set({ downloadHistory: history });
    });
  }

  function renderHistory() {
    chrome.storage.local.get(['downloadHistory'], (res) => {
      const history = res.downloadHistory || [];
      historyList.innerHTML = '';
      
      if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No downloads yet.</div>';
        return;
      }
      
      history.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString() + ' ' + new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const el = document.createElement('div');
        el.className = 'history-item';
        el.innerHTML = `
          <img src="${item.thumbnail}" class="history-thumbnail" alt="thumbnail">
          <div class="history-details">
            <div class="history-title" title="${item.title}">${item.title}</div>
            <div class="history-meta">
              <span class="history-quality">${item.type.toUpperCase()} - ${item.quality}</span>
              <span>${date}</span>
            </div>
          </div>
        `;
        historyList.appendChild(el);
      });
    });
  }
  
  function displayVideoInfo(videoInfo) {
    currentVideo = videoInfo;
    
    videoThumbnail.src = videoInfo.thumbnail;
    videoTitle.textContent = videoInfo.title;
    videoDuration.textContent = formatDuration(videoInfo.duration);
    channelName.textContent = videoInfo.channelName;
    
    // Render video quality buttons
    videoQualities.innerHTML = '';
    videoInfo.videoQualities.forEach(quality => {
      const btn = createQualityButton(quality, 'video');
      videoQualities.appendChild(btn);
    });
    
    // Render audio quality buttons
    audioQualities.innerHTML = '';
    videoInfo.audioQualities.forEach(quality => {
      const btn = createQualityButton(quality, 'audio');
      audioQualities.appendChild(btn);
    });
  }
  
  function createQualityButton(quality, type) {
    const button = document.createElement('button');
    button.classList.add('quality-btn');
    
    const resSpan = document.createElement('span');
    resSpan.classList.add('btn-res');
    resSpan.textContent = type === 'video' ? quality.id : (quality.id === 'm4a' ? 'ORIGINAL M4A' : `${quality.id.toUpperCase()} MP3`);
    
    const sizeSpan = document.createElement('span');
    sizeSpan.classList.add('btn-size');
    sizeSpan.textContent = quality.fileSize;
    
    button.appendChild(resSpan);
    button.appendChild(sizeSpan);
    
    button.addEventListener('click', () => {
      initiateDownload(quality, type);
    });
    
    return button;
  }
  
  function initiateDownload(quality, type) {
    if (activeDownloadInterval) {
      clearInterval(activeDownloadInterval);
    }

    progressContainer.classList.remove('hidden');
    progressStatus.textContent = 'Connecting to downloader engine...';
    progressBar.style.width = '0%';
    progressPercentText.textContent = '0%';
    
    // Send visual notification directly onto the YouTube page context
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'triggerFlashMessage',
          title: currentVideo.title
        });
      }
    });

    // Request background script to process actual download
    chrome.runtime.sendMessage(
      {
        action: 'downloadVideo',
        videoId: currentVideo.id,
        qualityId: quality.id,
        type: type,
        title: currentVideo.title,
        channelName: currentVideo.channelName,
        uploadDate: currentVideo.uploadDate
      },
      (response) => {
        if (response && response.success) {
          if (response.local) {
            // Start polling the server for real-time progress of the local download
            progressStatus.textContent = 'Preparing local download...';
            activeDownloadInterval = setInterval(() => {
              chrome.runtime.sendMessage({ action: 'checkStatus', videoId: currentVideo.id }, (statusResponse) => {
                if (statusResponse) {
                  const state = statusResponse.status;
                  const percent = statusResponse.percent || 0;
                  
                  if (state === 'preparing') {
                    updateProgress(5, 'Preparing stream links...');
                  } else if (state === 'downloading') {
                    updateProgress(percent, `Downloading: ${percent}%`);
                  } else if (state === 'merging') {
                    updateProgress(95, 'Merging formats using FFmpeg...');
                  } else if (state === 'complete') {
                    clearInterval(activeDownloadInterval);
                    updateProgress(100, '🎉 Complete! Saved in Downloads/Dubplitube');
                    saveToHistory(currentVideo, quality.id, type);
                    setTimeout(() => {
                      progressContainer.classList.add('hidden');
                    }, 5000);
                  } else if (state === 'failed') {
                    clearInterval(activeDownloadInterval);
                    showError(statusResponse.error || 'Local download failed.');
                  }
                }
              });
            }, 800);
          } else if (response.downloadId) {
            // Monitor real Chrome download progress
            trackDownloadProgress(response.downloadId);
          }
        } else {
          const errorMsg = (response && response.error) ? response.error : 'Failed to start engine.';
          showError(errorMsg);
        }
      }
    );
  }
  
  // Real-time track download progress bytes using Chrome Downloads API
  function trackDownloadProgress(downloadId) {
    progressStatus.textContent = 'Downloading media files...';
    progressBar.style.backgroundColor = ''; // Reset standard bar color
    
    activeDownloadInterval = setInterval(() => {
      chrome.downloads.search({ id: downloadId }, (items) => {
        if (items && items.length > 0) {
          const item = items[0];
          
          if (item.state === 'in_progress') {
            if (item.totalBytes > 0) {
              const percent = Math.round((item.bytesReceived / item.totalBytes) * 100);
              updateProgress(percent, `Downloading: ${formatBytes(item.bytesReceived)} of ${formatBytes(item.totalBytes)}`);
            } else {
              updateProgress(10, 'Connecting stream...');
            }
          } else if (item.state === 'complete') {
            clearInterval(activeDownloadInterval);
            updateProgress(100, '🎉 Download complete!');
            saveToHistory(currentVideo, "API", "Download"); // We might not have exact quality passed down easily here, so generic API tag
            setTimeout(() => {
              progressContainer.classList.add('hidden');
            }, 3000);
          } else if (item.state === 'interrupted') {
            clearInterval(activeDownloadInterval);
            showError(`Download interrupted: ${item.error || 'Network/Server Error'}`);
          }
        }
      });
    }, 400);
  }

  function updateProgress(percent, statusText) {
    progressBar.style.width = `${percent}%`;
    progressPercentText.textContent = `${percent}%`;
    progressStatus.textContent = statusText;
  }
  
  function showError(message) {
    progressContainer.classList.remove('hidden');
    progressStatus.textContent = message;
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = '#f43f5e'; // neon pink-red error bar
    progressPercentText.textContent = '❌';
  }
  
  function isYouTubeVideoUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts)/.test(url);
  }
  
  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
});
