// Photo Booth Application with Auto-Capture Timer
document.addEventListener('DOMContentLoaded', function() {
  // Application state
  const state = {
    selectedPoses: [],
    selectedTimer: 5, // Default to 5 seconds
    currentPhotoIndex: 0,
    takenPhotos: [],
    autoCaptureTimer: null,
    countdownActive: false,
    cameraStream: null,
    isMirrored: true,
    cameraInitialized: false,
    loadedPoseImages: {}, // Cache for loaded pose images
    isAutoCapturing: false,
    captureInProgress: false,
    cameraFeedSize: { width: 0, height: 0 }
  };

  // Pose data - 20 poses with image references
  const poses = [
    { id: 1, image: "poses/pose1.webp", label: "Peace Sign" },
    { id: 2, image: "poses/pose2.webp", label: "Cool Pose" },
    { id: 3, image: "poses/pose3.webp", label: "Hands on Hips" },
    { id: 4, image: "poses/pose4.webp", label: "Thumbs Up" },
    { id: 5, image: "poses/pose5.webp", label: "Jumping" },
    { id: 6, image: "poses/pose6.webp", label: "Silly Face" },
    { id: 7, image: "poses/pose7.webp", label: "Superhero" },
    { id: 8, image: "poses/pose8.webp", label: "Dancing" },
    { id: 9, image: "poses/pose9.webp", label: "Thinking" },
    { id: 10, image: "poses/pose10.webp", label: "Winking" },
    { id: 11, image: "poses/pose11.webp", label: "Heart Hands" },
    { id: 12, image: "poses/pose12.webp", label: "Surprised" },
    { id: 13, image: "poses/pose13.webp", label: "Flexing" },
    { id: 14, image: "poses/pose14.webp", label: "Blowing Kiss" },
    { id: 15, image: "poses/pose15.webp", label: "Pointing" },
    { id: 16, image: "poses/pose16.webp", label: "Celebration" },
    { id: 17, image: "poses/pose17.webp", label: "Model Pose" },
    { id: 18, image: "poses/pose18.webp", label: "Group Hug" },
    { id: 19, image: "poses/pose19.webp", label: "Sitting Pose" },
    { id: 20, image: "poses/pose20.webp", label: "Action Pose" }
  ];

  // DOM Elements
  const pagePoses = document.getElementById('page-poses');
  const pageCamera = document.getElementById('page-camera');
  const poseGrid = document.querySelector('.pose-grid');
  const bottomSlots = document.querySelectorAll('.slot');
  const startSessionBtn = document.getElementById('startSession');
  const clearSelectionBtn = document.getElementById('clearSelection');
  const cancelSessionBtn = document.getElementById('cancelSession');
  const finishSessionBtn = document.getElementById('finishSession');
  const photoCounter = document.getElementById('photo-counter');
  const timerDisplay = document.getElementById('timer-display');
  const autoCaptureCountdown = document.getElementById('autoCaptureCountdown');
  const autoCountdownNumber = autoCaptureCountdown.querySelector('.auto-countdown-number');
  const autoCaptureStatus = document.getElementById('autoCaptureStatus');
  const flash = document.getElementById('flash');
  const cameraFeed = document.getElementById('cameraFeed');
  const cameraPermission = document.getElementById('cameraPermission');
  const cameraError = document.getElementById('cameraError');
  const errorMessage = document.getElementById('errorMessage');
  const requestCameraBtn = document.getElementById('requestCamera');
  const retryCameraBtn = document.getElementById('retryCamera');
  const takenPhotosGrid = document.getElementById('taken-photos');
  const cameraStatusText = document.getElementById('camera-status-text');
  const currentPoseName = document.getElementById('current-pose-name');
  const poseInstruction = document.getElementById('pose-instruction');
  const statusDot = document.getElementById('statusDot');
  const poseOverlay = document.getElementById('poseOverlay');
  const posePreview = document.getElementById('posePreview');
  const timerOptions = document.querySelectorAll('.timer-option');
  const cameraViewFinder = document.querySelector('.camera-viewfinder');

  // Preload pose images when poses are selected
  function preloadPoseImages() {
    state.selectedPoses.forEach(pose => {
      if (!state.loadedPoseImages[pose.id]) {
        const img = new Image();
        img.src = pose.image;
        img.crossOrigin = "anonymous";
        img.onload = () => {
          console.log(`Loaded pose image: ${pose.label}`);
        };
        img.onerror = (e) => {
          console.error(`Failed to load pose image: ${pose.image}`, e);
        };
        state.loadedPoseImages[pose.id] = img;
      }
    });
  }

  // Initialize the pose selection page
  function initPoseSelection() {
    // Clear the pose grid
    poseGrid.innerHTML = '';
    
    // Create pose boxes
    poses.forEach((pose, index) => {
      const poseBox = document.createElement('div');
      poseBox.className = 'pose-box';
      poseBox.dataset.id = pose.id;
      
      poseBox.innerHTML = `
        <img src="${pose.image}" alt="${pose.label}" class="pose-image">
        <div class="pose-label">${pose.label}</div>
      `;
      
      // Add click event
      poseBox.addEventListener('click', () => selectPose(pose.id, pose));
      
      poseGrid.appendChild(poseBox);
    });
    
    // Initialize timer selection
    timerOptions.forEach(option => {
      option.addEventListener('click', () => selectTimer(parseInt(option.dataset.seconds)));
    });
    
    // Select default timer (5 seconds)
    selectTimer(5);
    
    // Initialize taken photos grid
    initTakenPhotosGrid();
  }

  // Initialize the taken photos grid on camera page
  function initTakenPhotosGrid() {
    takenPhotosGrid.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
      const photoSlot = document.createElement('div');
      photoSlot.className = 'taken-photo';
      photoSlot.dataset.index = i;
      photoSlot.innerHTML = `
        <div class="taken-photo-number">${i + 1}</div>
        <div class="taken-photo-label">Not taken</div>
      `;
      
      // Add click event to navigate to specific photo
      photoSlot.addEventListener('click', () => {
        if (state.takenPhotos[i]) {
          navigateToPhoto(i);
        }
      });
      
      takenPhotosGrid.appendChild(photoSlot);
    }
  }

  // Select a timer
  function selectTimer(seconds) {
    state.selectedTimer = seconds;
    
    // Update UI
    timerOptions.forEach(option => {
      if (parseInt(option.dataset.seconds) === seconds) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
    
    // Update timer display if on camera page
    if (pageCamera.classList.contains('active')) {
      timerDisplay.textContent = seconds;
    }
  }

  // Select a pose
  function selectPose(id, pose) {
    const poseBox = document.querySelector(`.pose-box[data-id="${id}"]`);
    
    // Check if already selected
    const existingIndex = state.selectedPoses.findIndex(p => p.id === id);
    
    if (existingIndex !== -1) {
      // Remove from selection
      state.selectedPoses.splice(existingIndex, 1);
      poseBox.classList.remove('selected');
      
      // Remove pose number indicator
      const poseNumber = poseBox.querySelector('.pose-number');
      if (poseNumber) poseNumber.remove();
      
      // Remove from loaded images
      delete state.loadedPoseImages[id];
    } else {
      // Check if we can add more (max 4)
      if (state.selectedPoses.length >= 4) {
        alert('You can select up to 4 poses only!');
        return;
      }
      
      // Add to selection
      state.selectedPoses.push({ ...pose });
      poseBox.classList.add('selected');
      
      // Preload the image
      const img = new Image();
      img.src = pose.image;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        console.log(`Preloaded pose image: ${pose.label}`);
      };
      state.loadedPoseImages[pose.id] = img;
      
      // Add pose number indicator
      const poseNumber = document.createElement('div');
      poseNumber.className = 'pose-number';
      poseNumber.textContent = state.selectedPoses.length;
      poseBox.appendChild(poseNumber);
    }
    
    updateSelectedSlots();
    updateStartButton();
  }

  // Update the bottom slots with selected poses
  function updateSelectedSlots() {
    // Clear all slots first
    bottomSlots.forEach(slot => {
      slot.classList.remove('filled');
      const image = slot.querySelector('.slot-image');
      const label = slot.querySelector('.slot-label');
      
      image.src = '';
      image.alt = '';
      label.textContent = 'Empty';
    });
    
    // Fill slots with selected poses
    state.selectedPoses.forEach((pose, index) => {
      const slot = bottomSlots[index];
      if (slot) {
        slot.classList.add('filled');
        const image = slot.querySelector('.slot-image');
        const label = slot.querySelector('.slot-label');
        
        image.src = pose.image;
        image.alt = pose.label;
        label.textContent = pose.label;
      }
    });
  }

  // Update the start session button
  function updateStartButton() {
    const count = state.selectedPoses.length;
    startSessionBtn.textContent = `Start Photo Session (${count}/4)`;
    startSessionBtn.disabled = count === 0;
  }

  // Clear all selected poses
  function clearSelection() {
    state.selectedPoses = [];
    state.loadedPoseImages = {};
    
    // Clear all selected pose boxes
    document.querySelectorAll('.pose-box.selected').forEach(box => {
      box.classList.remove('selected');
      const poseNumber = box.querySelector('.pose-number');
      if (poseNumber) poseNumber.remove();
    });
    
    // Reset timer to default
    selectTimer(5);
    
    updateSelectedSlots();
    updateStartButton();
  }

  // Switch to camera page and start auto-capture
  async function goToCameraPage() {
    if (state.selectedPoses.length === 0) {
      alert('Please select at least one pose!');
      return;
    }
    
    pagePoses.classList.remove('active');
    pageCamera.classList.add('active');
    
    // Update timer display
    timerDisplay.textContent = state.selectedTimer;
    
    // Preload all pose images
    preloadPoseImages();
    
    // Reset camera state
    state.currentPhotoIndex = 0;
    state.takenPhotos = [];
    state.isAutoCapturing = false;
    state.captureInProgress = false;
    
    // Update camera page
    updateCameraPage();
    initTakenPhotosGrid();
    
    // Update UI
    finishSessionBtn.disabled = true;
    
    // Show camera permission screen first
    showCameraPermissionScreen();
    
    // Update status
    updateCameraStatus('Camera permission required');
    statusDot.classList.remove('active');
    
    // Hide auto-capture elements initially
    autoCaptureCountdown.style.display = 'none';
    autoCaptureStatus.style.display = 'none';
    
    // Hide pose overlay initially
    hidePoseOverlay();
  }

  // Request camera permission
  async function requestCameraPermission() {
    try {
      // First request basic camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      // Stop the initial stream
      stream.getTracks().forEach(track => track.stop());
      
      console.log("Camera permission granted");
      
      // Now initialize the camera with proper settings
      await initCamera();
      
    } catch (error) {
      console.error("Camera permission denied or error:", error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        showCameraPermissionScreen();
        updateCameraStatus('Camera permission denied');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        showCameraError('No camera found on this device');
      } else {
        showCameraError('Unable to access camera: ' + error.message);
      }
    }
  }

  // Initialize camera - only called after user grants permission
  async function initCamera() {
    updateCameraStatus('Initializing camera...');
    statusDot.classList.remove('active');
    
    try {
      // Start camera
      await startCamera();
      
      // Mark camera as initialized
      state.cameraInitialized = true;
      
      // Update camera feed size
      updateCameraFeedSize();
      
      // Show pose overlay (permanent, 100% opacity)
      showPoseOverlay();
      
      // Start auto-capture sequence
      startAutoCaptureSequence();
      
    } catch (error) {
      console.error('Camera initialization error:', error);
      showCameraError('Failed to initialize camera. Please check permissions.');
    }
  }

  // Update camera feed dimensions
  function updateCameraFeedSize() {
    // Get the display size (what's shown on screen)
    const displayRect = cameraViewFinder.getBoundingClientRect();
    
    // Store both the display size and actual video size
    state.cameraFeedSize = {
      displayWidth: displayRect.width,
      displayHeight: displayRect.height,
      videoWidth: cameraFeed.videoWidth || 640,
      videoHeight: cameraFeed.videoHeight || 480
    };
    
    console.log('Camera feed size updated:', state.cameraFeedSize);
  }

  // Start camera
  async function startCamera() {
    // Stop any existing stream
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => track.stop());
    }
    
    try {
      // Request camera access with constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      };
      
      state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set camera feed source
      cameraFeed.srcObject = state.cameraStream;
      
      // Apply mirror effect
      if (state.isMirrored) {
        cameraFeed.style.transform = 'scaleX(-1)';
      } else {
        cameraFeed.style.transform = 'scaleX(1)';
      }
      
      // Hide permission/error screens
      cameraPermission.style.display = 'none';
      cameraError.style.display = 'none';
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        cameraFeed.onloadedmetadata = () => {
          resolve();
        };
      });
      
      // Update camera feed size after video is loaded
      updateCameraFeedSize();
      
      // Update status
      updateCameraStatus('Camera ready - Auto capture starting...');
      statusDot.classList.add('active');
      
    } catch (error) {
      console.error('Camera error:', error);
      
      // Show appropriate error message
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        showCameraPermissionScreen();
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        showCameraError('No camera found on this device');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        showCameraError('Camera is already in use by another application');
      } else {
        showCameraError('Unable to access camera: ' + error.message);
      }
      
      throw error;
    }
  }

  // Show camera permission screen
  function showCameraPermissionScreen() {
    cameraPermission.style.display = 'flex';
    cameraError.style.display = 'none';
    updateCameraStatus('Camera permission required');
    statusDot.classList.remove('active');
  }

  // Show camera error
  function showCameraError(message) {
    cameraPermission.style.display = 'none';
    cameraError.style.display = 'flex';
    errorMessage.textContent = message;
    updateCameraStatus('Camera error');
    statusDot.classList.remove('active');
  }

  // Update camera status text
  function updateCameraStatus(status) {
    cameraStatusText.textContent = status;
  }

  // Start auto-capture sequence
  function startAutoCaptureSequence() {
    if (!state.cameraInitialized || state.selectedPoses.length === 0) return;
    
    state.isAutoCapturing = true;
    autoCaptureStatus.style.display = 'flex';
    
    // Start with the first pose
    startAutoCaptureForCurrentPose();
  }

  // Start auto-capture for current pose
  function startAutoCaptureForCurrentPose() {
    if (!state.isAutoCapturing || state.captureInProgress) return;
    
    // Update current pose info
    updateCameraPage();
    
    // Show pose overlay for current pose
    showPoseOverlay();
    
    // Show countdown
    autoCaptureCountdown.style.display = 'flex';
    let countdownValue = state.selectedTimer;
    autoCountdownNumber.textContent = countdownValue;
    
    // Update status
    updateCameraStatus(`Auto capture in ${countdownValue} seconds...`);
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      countdownValue--;
      autoCountdownNumber.textContent = countdownValue;
      
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        autoCaptureCountdown.style.display = 'none';
        
        // Capture photo
        capturePhoto();
      }
    }, 1000);
  }

  // Show pose overlay (permanent, 100% opacity) for current pose
  function showPoseOverlay() {
    if (state.cameraInitialized && state.selectedPoses[state.currentPhotoIndex]) {
      const currentPose = state.selectedPoses[state.currentPhotoIndex];
      
      // Check if image is loaded
      const poseImg = state.loadedPoseImages[currentPose.id];
      if (poseImg && poseImg.complete) {
        posePreview.src = currentPose.image;
        posePreview.alt = currentPose.label;
        poseOverlay.style.display = 'flex';
        
        // Set consistent size
        updatePoseOverlaySize();
        
        console.log(`Showing pose overlay: ${currentPose.label}`);
      } else {
        // If not loaded yet, wait for it to load
        if (poseImg) {
          poseImg.onload = () => {
            posePreview.src = currentPose.image;
            posePreview.alt = currentPose.label;
            poseOverlay.style.display = 'flex';
            
            // Set consistent size
            updatePoseOverlaySize();
            
            console.log(`Showing pose overlay after load: ${currentPose.label}`);
          };
        }
      }
    }
  }

  // Update pose overlay size to match display
  function updatePoseOverlaySize() {
    if (!poseOverlay.style.display || poseOverlay.style.display === 'none') return;
    
    // Get the current display size
    const displayRect = cameraViewFinder.getBoundingClientRect();
    
    // Calculate pose size as 80% of the smallest display dimension
    const displaySize = Math.min(displayRect.width, displayRect.height);
    const poseSize = displaySize * 0.8;
    
    // Center the pose
    const poseX = (displayRect.width - poseSize) / 2;
    const poseY = (displayRect.height - poseSize) / 2;
    
    // Apply to pose preview
    posePreview.style.width = `${poseSize}px`;
    posePreview.style.height = `${poseSize}px`;
    posePreview.style.position = 'absolute';
    posePreview.style.left = `${poseX}px`;
    posePreview.style.top = `${poseY}px`;
    posePreview.style.objectFit = 'contain';
  }

  // Hide pose overlay
  function hidePoseOverlay() {
    poseOverlay.style.display = 'none';
  }

  // Capture photo automatically
  function capturePhoto() {
    if (!state.cameraInitialized || !state.cameraStream || state.captureInProgress) return;
    
    state.captureInProgress = true;
    
    // Get current display dimensions
    const displayRect = cameraViewFinder.getBoundingClientRect();
    const displayWidth = displayRect.width;
    const displayHeight = displayRect.height;
    
    // Get video dimensions
    const videoWidth = state.cameraFeedSize.videoWidth;
    const videoHeight = state.cameraFeedSize.videoHeight;
    
    // Create canvas with display dimensions (what user sees on screen)
    const canvas = document.createElement('canvas');
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    const ctx = canvas.getContext('2d');
    
    // Get current pose data
    const currentPoseData = state.selectedPoses[state.currentPhotoIndex];
    const poseImg = state.loadedPoseImages[currentPoseData.id];
    
    // Ensure camera feed is ready
    if (cameraFeed.readyState < 2) {
      console.warn('Camera feed not ready, delaying capture...');
      setTimeout(() => {
        capturePhoto();
      }, 100);
      state.captureInProgress = false;
      return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw camera feed (user photo) as background
    ctx.save();
    
    // Calculate scale to fill the display area
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;
    const scale = Math.max(scaleX, scaleY); // Cover the area
    
    const scaledWidth = videoWidth * scale;
    const scaledHeight = videoHeight * scale;
    const offsetX = (displayWidth - scaledWidth) / 2;
    const offsetY = (displayHeight - scaledHeight) / 2;
    
    // Apply mirror effect if needed
    if (state.isMirrored) {
      ctx.translate(displayWidth, 0);
      ctx.scale(-1, 1);
    }
    
    try {
      // Draw video to fill the display area
      ctx.drawImage(cameraFeed, 
        state.isMirrored ? -offsetX : offsetX, 
        offsetY, 
        scaledWidth, 
        scaledHeight);
    } catch (e) {
      console.error('Error drawing camera feed:', e);
    }
    
    ctx.restore();
    
    // Draw pose overlay on top of user photo (same position as displayed)
    if (poseImg && poseImg.complete && poseImg.naturalWidth > 0) {
      console.log(`Drawing pose overlay: ${currentPoseData.label}`);
      
      // Set global alpha for transparency (semi-transparent overlay)
      ctx.globalAlpha = 0.7; // 70% opacity
      
      // Calculate pose size exactly as displayed (80% of smallest display dimension)
      const displaySize = Math.min(displayWidth, displayHeight);
      const poseSize = displaySize * 0.8;
      const poseX = (displayWidth - poseSize) / 2;
      const poseY = (displayHeight - poseSize) / 2;
      
      // Draw the pose image on top (exactly as displayed)
      ctx.drawImage(poseImg, poseX, poseY, poseSize, poseSize);
      
      // Reset global alpha
      ctx.globalAlpha = 1.0;
    } else {
      console.warn(`Pose image not loaded for: ${currentPoseData.label}`);
    }
    
    // Add photo label at the bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, displayHeight - 60, displayWidth, 60);
    
    ctx.font = 'bold 24px Poppins, sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(currentPoseData.label, displayWidth / 2, displayHeight - 25);
    
    ctx.font = '16px Poppins, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`Photo ${state.currentPhotoIndex + 1} of ${state.selectedPoses.length}`, displayWidth / 2, displayHeight - 5);
    
    // Store the captured photo
    const photoData = canvas.toDataURL('image/jpeg', 0.9);
    state.takenPhotos[state.currentPhotoIndex] = {
      data: photoData,
      label: currentPoseData.label,
      poseId: currentPoseData.id,
      index: state.currentPhotoIndex
    };
    
    console.log(`Captured photo ${state.currentPhotoIndex + 1}: ${currentPoseData.label}`);
    
    // Show flash effect
    showFlash();
    
    // Play capture sound
    playCaptureSound();
    
    // Update taken photos grid
    updateTakenPhotosGrid();
    
    // Update finish button
    updateFinishButton();
    
    // Move to next pose or finish after a brief delay
    setTimeout(() => {
      if (state.currentPhotoIndex < state.selectedPoses.length - 1) {
        // Move to next pose
        state.currentPhotoIndex++;
        state.captureInProgress = false;
        
        // Hide pose overlay briefly before showing next one
        hidePoseOverlay();
        
        // Start auto-capture for next pose after short delay
        setTimeout(() => {
          startAutoCaptureForCurrentPose();
        }, 500);
      } else {
        // All photos captured
        state.captureInProgress = false;
        finishAutoCapture();
      }
    }, 1000);
  }

  // Show flash effect
  function showFlash() {
    flash.style.opacity = '1';
    flash.style.display = 'block';
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        flash.style.display = 'none';
      }, 500);
    }, 100);
  }

  // Play capture sound
  function playCaptureSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("Audio not supported");
    }
  }

  // Update the taken photos grid
  function updateTakenPhotosGrid() {
    const photoSlots = document.querySelectorAll('.taken-photo');
    
    photoSlots.forEach((slot, index) => {
      const photo = state.takenPhotos[index];
      
      if (photo) {
        slot.classList.add('filled');
        slot.innerHTML = `
          <img src="${photo.data}" alt="${photo.label}" class="taken-photo-preview">
          <div class="taken-photo-number">${index + 1}</div>
          <div class="taken-photo-label">${photo.label}</div>
        `;
      } else {
        slot.classList.remove('filled');
        slot.innerHTML = `
          <div class="taken-photo-number">${index + 1}</div>
          <div class="taken-photo-label">Not taken</div>
        `;
      }
      
      // Update click event
      slot.addEventListener('click', () => {
        if (state.takenPhotos[index]) {
          navigateToPhoto(index);
        }
      });
    });
  }

  // Update finish button state
  function updateFinishButton() {
    const allTaken = state.selectedPoses.every((_, index) => state.takenPhotos[index]);
    finishSessionBtn.disabled = !allTaken;
    
    if (allTaken) {
      updateCameraStatus('All photos captured! Ready to finish.');
    }
  }

  // Finish auto-capture sequence
  function finishAutoCapture() {
    state.isAutoCapturing = false;
    autoCaptureStatus.style.display = 'none';
    updateCameraStatus('Session completed! All photos captured.');
    
    // Hide pose overlay
    hidePoseOverlay();
    
    // Show success animation
    document.querySelector('.camera-viewfinder').style.animation = 'flashSuccess 1s 3';
    
    console.log('Photo session completed!');
  }

  // Navigate to a specific photo
  function navigateToPhoto(index) {
    if (index >= 0 && index < state.selectedPoses.length && state.takenPhotos[index]) {
      state.currentPhotoIndex = index;
      updateCameraPage();
      showPoseOverlay();
    }
  }

  // Update camera page with current pose
  function updateCameraPage() {
    if (state.selectedPoses.length === 0) return;
    
    const currentPoseData = state.selectedPoses[state.currentPhotoIndex];
    
    // Update counter
    photoCounter.textContent = `${state.currentPhotoIndex + 1}/${state.selectedPoses.length}`;
    
    // Update pose info in status bar
    currentPoseName.textContent = currentPoseData.label;
    poseInstruction.textContent = getPoseInstruction(currentPoseData.label);
    
    // Update taken photos highlight
    updateTakenPhotosHighlight();
  }

  // Get instruction based on pose
  function getPoseInstruction(poseLabel) {
    const instructions = {
      "Peace Sign": "Show your peace sign with a big smile!",
      "Cool Pose": "Put on your sunglasses attitude!",
      "Hands on Hips": "Stand confidently with hands on your hips",
      "Thumbs Up": "Give a thumbs up and smile!",
      "Jumping": "Jump in the air with excitement!",
      "Silly Face": "Make your funniest face!",
      "Superhero": "Strike a powerful superhero pose!",
      "Dancing": "Show your best dance move!",
      "Thinking": "Look thoughtful with hand on chin",
      "Winking": "Wink at the camera playfully",
      "Heart Hands": "Make a heart shape with your hands",
      "Surprised": "Open your mouth wide in surprise!",
      "Flexing": "Show off your muscles!",
      "Blowing Kiss": "Blow a kiss to the camera",
      "Pointing": "Point at the camera confidently",
      "Celebration": "Throw your hands up in celebration!",
      "Model Pose": "Strike a fashion model pose",
      "Group Hug": "Pretend you're hugging friends",
      "Sitting Pose": "Imagine sitting elegantly",
      "Action Pose": "Show some action movie energy!"
    };
    
    return instructions[poseLabel] || "Get ready for automatic capture!";
  }

  // Update taken photos highlight
  function updateTakenPhotosHighlight() {
    const photoSlots = document.querySelectorAll('.taken-photo');
    
    photoSlots.forEach((slot, index) => {
      slot.classList.remove('current');
      
      if (index === state.currentPhotoIndex) {
        slot.classList.add('current');
      }
    });
  }

  // Switch back to pose selection page
  function goToPoseSelectionPage() {
    // Stop camera stream
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => track.stop());
      state.cameraStream = null;
    }
    
    // Reset camera state
    state.cameraInitialized = false;
    state.isAutoCapturing = false;
    state.captureInProgress = false;
    
    // Clear any active timers
    if (state.autoCaptureTimer) {
      clearTimeout(state.autoCaptureTimer);
    }
    
    // Hide pose overlay
    hidePoseOverlay();
    
    pageCamera.classList.remove('active');
    pagePoses.classList.add('active');
  }

  // Finish the photo session
  function finishSession() {
    if (!state.selectedPoses.every((_, index) => state.takenPhotos[index])) {
      alert('Please wait for all photos to be captured!');
      return;
    }
    
    // Create zip of all photos
    setTimeout(() => {
      alert('Photo session completed! All photos have been captured.');
      
      // Option to download all photos
      if (confirm('Would you like to download all photos?')) {
        state.takenPhotos.forEach((photo, index) => {
          if (photo) {
            const link = document.createElement('a');
            link.href = photo.data;
            link.download = `photo-booth-${index + 1}-${photo.label.toLowerCase().replace(/\s+/g, '-')}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
      }
      
      // Reset and go back to pose selection
      clearSelection();
      goToPoseSelectionPage();
    }, 500);
  }

  // Cancel the photo session
  function cancelSession() {
    if (confirm('Are you sure you want to cancel the photo session? All captured photos will be lost.')) {
      goToPoseSelectionPage();
    }
  }

  // Event Listeners
  startSessionBtn.addEventListener('click', goToCameraPage);
  clearSelectionBtn.addEventListener('click', clearSelection);
  cancelSessionBtn.addEventListener('click', cancelSession);
  finishSessionBtn.addEventListener('click', finishSession);
  
  // Request camera permission when user clicks "Enable Camera"
  requestCameraBtn.addEventListener('click', async () => {
    try {
      await requestCameraPermission();
    } catch (error) {
      console.error('Failed to request camera permission:', error);
    }
  });
  
  retryCameraBtn.addEventListener('click', async () => {
    try {
      await requestCameraPermission();
    } catch (error) {
      console.error('Failed to request camera permission:', error);
    }
  });

  // Handle window resize to update pose overlay size
  window.addEventListener('resize', () => {
    if (state.cameraInitialized) {
      updateCameraFeedSize();
      updatePoseOverlaySize();
    }
  });

  // Initialize the application
  initPoseSelection();
});
