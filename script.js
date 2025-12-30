// Photo Booth Application with Real Camera and Auto-Capture
document.addEventListener('DOMContentLoaded', function() {
  // Application state
  const state = {
    selectedPoses: [],
    selectedTimer: 5, // Default 5 seconds
    currentPhotoIndex: 0,
    takenPhotos: [],
    isCapturing: false,
    isAutoCaptureActive: false,
    countdownActive: false,
    cameraStream: null,
    cameras: [],
    currentCameraIndex: 0,
    isMirrored: true,
    showGrid: false,
    resolution: 'medium',
    cameraInitialized: false,
    sessionActive: false,
    loadedPoseImages: {}, // Cache for loaded pose images
    autoCaptureTimer: null,
    nextCaptureTimer: null
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
  const pageTimer = document.getElementById('page-timer');
  const pageCamera = document.getElementById('page-camera');
  const poseGrid = document.querySelector('.pose-grid');
  const bottomSlots = document.querySelectorAll('.slot');
  const startSessionBtn = document.getElementById('startSession');
  const clearSelectionBtn = document.getElementById('clearSelection');
  const backToPosesFromTimerBtn = document.getElementById('backToPosesFromTimer');
  const proceedToCameraBtn = document.getElementById('proceedToCamera');
  const backToTimerBtn = document.getElementById('backToTimer');
  const startSessionCameraBtn = document.getElementById('startSessionBtn');
  const pauseSessionBtn = document.getElementById('pauseSessionBtn');
  const restartSessionBtn = document.getElementById('restartSessionBtn');
  const finishSessionBtn = document.getElementById('finishSession');
  const photoCounter = document.getElementById('photo-counter');
  const currentTimerDisplay = document.getElementById('current-timer');
  const countdown = document.getElementById('countdown');
  const countdownNumber = countdown.querySelector('.countdown-number');
  const flash = document.getElementById('flash');
  const photoResult = document.getElementById('photo-result');
  const photoCanvas = document.getElementById('photoCanvas');
  const cameraFeed = document.getElementById('cameraFeed');
  const cameraPermission = document.getElementById('cameraPermission');
  const cameraError = document.getElementById('cameraError');
  const errorMessage = document.getElementById('errorMessage');
  const requestCameraBtn = document.getElementById('requestCamera');
  const retryCameraBtn = document.getElementById('retryCamera');
  const switchCameraBtn = document.getElementById('switchCamera');
  const toggleGridBtn = document.getElementById('toggleGrid');
  const toggleMirrorBtn = document.getElementById('toggleMirror');
  const resolutionSelect = document.getElementById('resolution');
  const retakePhotoBtn = document.getElementById('retakePhoto');
  const continueSessionBtn = document.getElementById('continueSession');
  const takenPhotosGrid = document.getElementById('taken-photos');
  const cameraStatusText = document.getElementById('camera-status-text');
  const currentPoseName = document.getElementById('current-pose-name');
  const poseInstruction = document.getElementById('pose-instruction');
  const statusDot = document.getElementById('statusDot');
  const poseOverlay = document.getElementById('poseOverlay');
  const posePreview = document.getElementById('posePreview');
  const autoCaptureInfo = document.getElementById('autoCaptureInfo');
  const nextCaptureCountdown = document.getElementById('nextCaptureCountdown');
  const selectedTimerDisplay = document.getElementById('selectedTimer');
  const timerOptions = document.querySelectorAll('.timer-option');

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
    
    // Initialize taken photos grid
    initTakenPhotosGrid();
    
    // Initialize timer selection
    initTimerSelection();
  }

  // Initialize timer selection
  function initTimerSelection() {
    timerOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        timerOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Update selected timer
        state.selectedTimer = parseInt(option.dataset.timer);
        selectedTimerDisplay.textContent = `${state.selectedTimer} seconds`;
        currentTimerDisplay.textContent = state.selectedTimer;
      });
    });
    
    // Select 5 seconds by default
    timerOptions[1].classList.add('selected');
    selectedTimerDisplay.textContent = '5 seconds';
    currentTimerDisplay.textContent = '5';
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
    
    updateSelectedSlots();
    updateStartButton();
  }

  // Go to timer selection page
  function goToTimerPage() {
    if (state.selectedPoses.length === 0) {
      alert('Please select at least one pose!');
      return;
    }
    
    pagePoses.classList.remove('active');
    pageTimer.classList.add('active');
  }

  // Go to camera page
  function goToCameraPage() {
    pageTimer.classList.remove('active');
    pageCamera.classList.add('active');
    
    // Preload all pose images
    preloadPoseImages();
    
    // Reset camera state
    state.currentPhotoIndex = 0;
    state.takenPhotos = [];
    state.isCapturing = false;
    state.countdownActive = false;
    state.sessionActive = false;
    state.cameraInitialized = false;
    
    // Update camera page
    updateCameraPage();
    initTakenPhotosGrid();
    
    // Update UI
    updateCameraUI();
    
    // Update buttons
    finishSessionBtn.disabled = true;
    startSessionCameraBtn.style.display = 'flex';
    pauseSessionBtn.style.display = 'none';
    restartSessionBtn.disabled = true;
    
    // Show camera permission screen first
    showCameraPermissionScreen();
    
    // Update status
    updateCameraStatus('Camera permission required');
    statusDot.classList.remove('active');
    
    // Hide auto-capture info initially
    autoCaptureInfo.style.display = 'none';
  }

  // Preload pose images when poses are selected
  function preloadPoseImages() {
    state.selectedPoses.forEach(pose => {
      if (!state.loadedPoseImages[pose.id]) {
        const img = new Image();
        img.src = pose.image;
        img.crossOrigin = "anonymous";
        state.loadedPoseImages[pose.id] = img;
      }
    });
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
      // Get available cameras
      await getCameras();
      
      // Start camera with default settings
      await startCamera();
      
      // Mark camera as initialized
      state.cameraInitialized = true;
      
      // Update pose overlay
      updatePoseOverlay();
      
      // Enable session start button
      startSessionCameraBtn.disabled = false;
      restartSessionBtn.disabled = false;
      
    } catch (error) {
      console.error('Camera initialization error:', error);
      showCameraError('Failed to initialize camera. Please check permissions.');
    }
  }

  // Get available cameras
  async function getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      state.cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (state.cameras.length === 0) {
        showCameraError('No camera found on this device');
        return;
      }
      
      console.log(`Found ${state.cameras.length} camera(s)`);
      
      // Enable camera switch button if multiple cameras
      switchCameraBtn.style.display = state.cameras.length > 1 ? 'flex' : 'none';
      
    } catch (error) {
      console.error('Error enumerating cameras:', error);
    }
  }

  // Start camera
  async function startCamera() {
    // Stop any existing stream
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => track.stop());
    }
    
    // Get constraints based on selected resolution
    const constraints = getCameraConstraints();
    
    try {
      // Request camera access
      state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set camera feed source
      cameraFeed.srcObject = state.cameraStream;
      
      // Apply mirror effect
      if (state.isMirrored) {
        cameraFeed.style.transform = 'scaleX(-1)';
        toggleMirrorBtn.classList.add('active');
      } else {
        cameraFeed.style.transform = 'scaleX(1)';
        toggleMirrorBtn.classList.remove('active');
      }
      
      // Hide permission/error screens
      cameraPermission.style.display = 'none';
      cameraError.style.display = 'none';
      
      // Update status
      updateCameraStatus('Camera ready - Start session when ready');
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
      
      // Re-throw error to be caught by initCamera
      throw error;
    }
  }

  // Get camera constraints based on resolution
  function getCameraConstraints() {
    let videoConstraints = {
      facingMode: 'user' // Use front camera by default
    };
    
    // Set resolution
    switch(state.resolution) {
      case 'low':
        videoConstraints.width = { ideal: 640 };
        videoConstraints.height = { ideal: 480 };
        break;
      case 'medium':
        videoConstraints.width = { ideal: 1280 };
        videoConstraints.height = { ideal: 720 };
        break;
      case 'high':
        videoConstraints.width = { ideal: 1920 };
        videoConstraints.height = { ideal: 1080 };
        break;
    }
    
    // If we have specific camera selected
    if (state.cameras.length > 0 && state.currentCameraIndex < state.cameras.length) {
      videoConstraints.deviceId = { exact: state.cameras[state.currentCameraIndex].deviceId };
    }
    
    return {
      video: videoConstraints,
      audio: false
    };
  }

  // Show camera permission screen
  function showCameraPermissionScreen() {
    cameraPermission.style.display = 'flex';
    cameraError.style.display = 'none';
    updateCameraStatus('Camera permission required');
    statusDot.classList.remove('active');
    startSessionCameraBtn.disabled = true;
  }

  // Show camera error
  function showCameraError(message) {
    cameraPermission.style.display = 'none';
    cameraError.style.display = 'flex';
    errorMessage.textContent = message;
    updateCameraStatus('Camera error');
    statusDot.classList.remove('active');
    startSessionCameraBtn.disabled = true;
  }

  // Update camera status text
  function updateCameraStatus(status) {
    cameraStatusText.textContent = status;
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
    state.sessionActive = false;
    
    // Clear timers
    if (state.autoCaptureTimer) {
      clearTimeout(state.autoCaptureTimer);
      state.autoCaptureTimer = null;
    }
    if (state.nextCaptureTimer) {
      clearInterval(state.nextCaptureTimer);
      state.nextCaptureTimer = null;
    }
    
    pageTimer.classList.remove('active');
    pagePoses.classList.add('active');
  }

  // Switch back to timer page
  function goBackToTimer() {
    // Stop camera stream
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => track.stop());
      state.cameraStream = null;
    }
    
    // Reset camera state
    state.cameraInitialized = false;
    state.sessionActive = false;
    
    // Clear timers
    if (state.autoCaptureTimer) {
      clearTimeout(state.autoCaptureTimer);
      state.autoCaptureTimer = null;
    }
    if (state.nextCaptureTimer) {
      clearInterval(state.nextCaptureTimer);
      state.nextCaptureTimer = null;
    }
    
    pageCamera.classList.remove('active');
    pageTimer.classList.add('active');
  }

  // Update camera page with current pose
  function updateCameraPage() {
    if (state.selectedPoses.length === 0) return;
    
    const currentPoseData = state.selectedPoses[state.currentPhotoIndex];
    
    // Update counter
    photoCounter.textContent = `${state.currentPhotoIndex + 1}/${state.selectedPoses.length}`;
    
    // Update timer display
    currentTimerDisplay.textContent = state.selectedTimer;
    
    // Update pose overlay
    updatePoseOverlay();
    
    // Update pose info in status bar
    currentPoseName.textContent = currentPoseData.label;
    poseInstruction.textContent = getPoseInstruction(currentPoseData.label);
    
    // Update navigation buttons
    restartSessionBtn.disabled = false;
    
    // Update taken photos highlight
    updateTakenPhotosHighlight();
  }

  // Update pose overlay
  function updatePoseOverlay() {
    if (state.selectedPoses.length === 0) return;
    
    const currentPoseData = state.selectedPoses[state.currentPhotoIndex];
    posePreview.src = currentPoseData.image;
    posePreview.alt = currentPoseData.label;
    
    // Always show pose overlay at 100% opacity
    poseOverlay.style.display = 'flex';
    posePreview.style.opacity = '1';
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
    
    return instructions[poseLabel] || "Get ready for the photo!";
  }

  // Update camera UI based on state
  function updateCameraUI() {
    const isTaken = state.takenPhotos[state.currentPhotoIndex];
    
    if (isTaken) {
      // Show captured photo
      photoResult.style.display = 'block';
      autoCaptureInfo.style.display = 'none';
    } else {
      // Show camera view
      photoResult.style.display = 'none';
    }
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

  // Start the photo session
  function startPhotoSession() {
    if (!state.cameraInitialized) {
      alert('Please enable camera first!');
      return;
    }
    
    if (state.sessionActive) return;
    
    state.sessionActive = true;
    state.isAutoCaptureActive = true;
    
    // Update UI
    startSessionCameraBtn.style.display = 'none';
    pauseSessionBtn.style.display = 'flex';
    restartSessionBtn.disabled = true;
    
    // Show auto-capture info
    autoCaptureInfo.style.display = 'flex';
    
    // Start the auto-capture sequence
    startAutoCapture();
  }

  // Pause the photo session
  function pausePhotoSession() {
    if (!state.sessionActive) return;
    
    state.sessionActive = false;
    state.isAutoCaptureActive = false;
    
    // Update UI
    startSessionCameraBtn.style.display = 'flex';
    pauseSessionBtn.style.display = 'none';
    restartSessionBtn.disabled = false;
    
    // Hide auto-capture info
    autoCaptureInfo.style.display = 'none';
    
    // Clear timers
    if (state.autoCaptureTimer) {
      clearTimeout(state.autoCaptureTimer);
      state.autoCaptureTimer = null;
    }
    if (state.nextCaptureTimer) {
      clearInterval(state.nextCaptureTimer);
      state.nextCaptureTimer = null;
    }
    
    updateCameraStatus('Session paused');
  }

  // Restart the photo session
  function restartPhotoSession() {
    // Clear all taken photos
    state.takenPhotos = [];
    state.currentPhotoIndex = 0;
    state.sessionActive = false;
    state.isAutoCaptureActive = false;
    
    // Update UI
    updateTakenPhotosGrid();
    updateCameraPage();
    updateCameraUI();
    
    // Clear timers
    if (state.autoCaptureTimer) {
      clearTimeout(state.autoCaptureTimer);
      state.autoCaptureTimer = null;
    }
    if (state.nextCaptureTimer) {
      clearInterval(state.nextCaptureTimer);
      state.nextCaptureTimer = null;
    }
    
    // Hide auto-capture info
    autoCaptureInfo.style.display = 'none';
    
    // Update status
    updateCameraStatus('Ready to start session');
    
    // Update finish button
    updateFinishButton();
  }

  // Start auto-capture sequence
  function startAutoCapture() {
    if (!state.isAutoCaptureActive || state.currentPhotoIndex >= state.selectedPoses.length) return;
    
    // Check if current photo is already taken
    if (state.takenPhotos[state.currentPhotoIndex]) {
      // Move to next photo
      navigateToNextPhoto();
      return;
    }
    
    // Update status
    updateCameraStatus(`Auto-capture active - Next photo in ${state.selectedTimer} seconds`);
    
    // Start countdown for next capture
    startNextCaptureCountdown();
  }

  // Start countdown for next capture
  function startNextCaptureCountdown() {
    let timeLeft = state.selectedTimer;
    nextCaptureCountdown.textContent = timeLeft;
    
    // Update countdown every second
    state.nextCaptureTimer = setInterval(() => {
      timeLeft--;
      nextCaptureCountdown.textContent = timeLeft;
      
      if (timeLeft <= 0) {
        clearInterval(state.nextCaptureTimer);
        state.nextCaptureTimer = null;
        
        // Start the capture countdown
        startCaptureCountdown();
      }
    }, 1000);
  }

  // Start the capture countdown (3, 2, 1, SMILE!)
  function startCaptureCountdown() {
    state.countdownActive = true;
    updateCameraStatus('Get ready...');
    
    // Hide auto-capture info during countdown
    autoCaptureInfo.style.display = 'none';
    
    // Show countdown
    let count = 3;
    countdownNumber.textContent = count;
    countdown.style.display = 'flex';
    
    const countdownInterval = setInterval(() => {
      count--;
      countdownNumber.textContent = count > 0 ? count : 'SMILE!';
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        
        // Hide countdown
        countdown.style.display = 'none';
        state.countdownActive = false;
        
        // Take the photo
        takePhoto();
      }
    }, 1000);
  }

  // Take the photo
  function takePhoto() {
    state.isCapturing = true;
    updateCameraStatus('Capturing...');
    
    const videoWidth = cameraFeed.videoWidth;
    const videoHeight = cameraFeed.videoHeight;
    photoCanvas.width = videoWidth;
    photoCanvas.height = videoHeight;
    
    const ctx = photoCanvas.getContext('2d');
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    
    const currentPoseData = state.selectedPoses[state.currentPhotoIndex];
    const poseImg = state.loadedPoseImages[currentPoseData.id];
    
    // Draw pose background at 100% opacity
    if (poseImg && poseImg.complete) {
      const poseAspect = poseImg.width / poseImg.height;
      const canvasAspect = videoWidth / videoHeight;
      
      let sx, sy, sWidth, sHeight;
      
      if (poseAspect > canvasAspect) {
        sWidth = poseImg.height * canvasAspect;
        sHeight = poseImg.height;
        sx = (poseImg.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = poseImg.width;
        sHeight = poseImg.width / canvasAspect;
        sx = 0;
        sy = (poseImg.height - sHeight) / 2;
      }
      
      // Draw background pose
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(poseImg, sx, sy, sWidth, sHeight, 0, 0, videoWidth, videoHeight);
    }
    
    // Draw user camera feed
    ctx.save();
    
    if (state.isMirrored) {
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.globalAlpha = 1;
    ctx.drawImage(cameraFeed, 0, 0, videoWidth, videoHeight);
    ctx.restore();
    
    // Add photo info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, videoHeight - 60, videoWidth, 60);
    
    ctx.font = 'bold 24px Poppins';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(currentPoseData.label, videoWidth / 2, videoHeight - 25);
    
    ctx.font = '16px Poppins';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`Photo ${state.currentPhotoIndex + 1} of ${state.selectedPoses.length}`, videoWidth / 2, videoHeight - 5);
    
    // Complete the photo capture
    completePhotoCapture();
  }

  // Complete the photo capture process
  function completePhotoCapture() {
    // Show flash effect
    flash.style.opacity = '1';
    
    // Play capture sound
    playCaptureSound();
    
    // Hide flash after delay
    setTimeout(() => {
      flash.style.opacity = '0';
      
      // Store the captured photo as data URL
      const photoData = photoCanvas.toDataURL('image/jpeg', 0.9);
      state.takenPhotos[state.currentPhotoIndex] = {
        data: photoData,
        label: state.selectedPoses[state.currentPhotoIndex].label,
        poseId: state.selectedPoses[state.currentPhotoIndex].id
      };
      
      // Update taken photos grid
      updateTakenPhotosGrid();
      
      // Show captured photo
      showCapturedPhoto();
      
      state.isCapturing = false;
      updateCameraStatus('Photo captured!');
      
      // Auto-advance to next pose after 3 seconds
      setTimeout(() => {
        if (state.isAutoCaptureActive) {
          navigateToNextPhoto();
        }
      }, 3000);
      
      // Update finish button
      updateFinishButton();
    }, 500);
  }

  // Play capture sound
  function playCaptureSound() {
    // Create a simple beep sound using Web Audio API
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

  // Show the captured photo
  function showCapturedPhoto() {
    // Show photo result
    photoResult.style.display = 'block';
    autoCaptureInfo.style.display = 'none';
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
  }

  // Navigate to a specific photo
  function navigateToPhoto(index) {
    if (index >= 0 && index < state.selectedPoses.length) {
      state.currentPhotoIndex = index;
      updateCameraPage();
      updateCameraUI();
      
      // If session is active, resume auto-capture
      if (state.sessionActive && !state.takenPhotos[index]) {
        state.isAutoCaptureActive = true;
        autoCaptureInfo.style.display = 'flex';
        startAutoCapture();
      } else if (state.sessionActive) {
        // If photo is already taken, move to next
        navigateToNextPhoto();
      }
    }
  }

  // Navigate to next photo
  function navigateToNextPhoto() {
    if (state.currentPhotoIndex < state.selectedPoses.length - 1) {
      state.currentPhotoIndex++;
      updateCameraPage();
      updateCameraUI();
      
      // Resume auto-capture if session is active
      if (state.sessionActive && state.isAutoCaptureActive) {
        startAutoCapture();
      }
    } else {
      // All photos taken, pause session
      state.sessionActive = false;
      state.isAutoCaptureActive = false;
      startSessionCameraBtn.style.display = 'flex';
      pauseSessionBtn.style.display = 'none';
      autoCaptureInfo.style.display = 'none';
      
      if (state.nextCaptureTimer) {
        clearInterval(state.nextCaptureTimer);
        state.nextCaptureTimer = null;
      }
      
      updateCameraStatus('All photos captured!');
    }
  }

  // Retake the current photo
  function retakeCurrentPhoto() {
    // Remove the current photo from taken photos
    delete state.takenPhotos[state.currentPhotoIndex];
    
    // Update UI
    updateTakenPhotosGrid();
    updateCameraUI();
    
    // Resume auto-capture if session is active
    if (state.sessionActive && state.isAutoCaptureActive) {
      autoCaptureInfo.style.display = 'flex';
      startAutoCapture();
    } else {
      updateCameraStatus('Ready to capture');
    }
    
    // Update finish button
    updateFinishButton();
  }

  // Continue session after viewing photo
  function continueSession() {
    photoResult.style.display = 'none';
    
    // Resume auto-capture if session is active
    if (state.sessionActive && state.isAutoCaptureActive) {
      autoCaptureInfo.style.display = 'flex';
      startAutoCapture();
    }
  }

  // Switch to next camera
  async function switchCamera() {
    if (!state.cameraInitialized || state.cameras.length <= 1) return;
    
    state.currentCameraIndex = (state.currentCameraIndex + 1) % state.cameras.length;
    updateCameraStatus(`Switching to ${state.currentCameraIndex === 0 ? 'front' : 'rear'} camera...`);
    
    await startCamera();
    
    // Resume session if it was active
    if (state.sessionActive && state.isAutoCaptureActive) {
      startAutoCapture();
    }
  }

  // Toggle grid visibility
  function toggleGrid() {
    if (!state.cameraInitialized) return;
    
    state.showGrid = !state.showGrid;
    const grid = document.querySelector('.alignment-grid');
    
    if (state.showGrid) {
      grid.classList.add('show');
      toggleGridBtn.classList.add('active');
    } else {
      grid.classList.remove('show');
      toggleGridBtn.classList.remove('active');
    }
  }

  // Toggle mirror effect
  function toggleMirror() {
    state.isMirrored = !state.isMirrored;
    
    if (state.cameraInitialized) {
      if (state.isMirrored) {
        cameraFeed.style.transform = 'scaleX(-1)';
        toggleMirrorBtn.classList.add('active');
      } else {
        cameraFeed.style.transform = 'scaleX(1)';
        toggleMirrorBtn.classList.remove('active');
      }
    }
  }

  // Change resolution
  async function changeResolution() {
    if (!state.cameraInitialized) return;
    
    state.resolution = resolutionSelect.value;
    updateCameraStatus(`Changing to ${state.resolution} resolution...`);
    
    await startCamera();
    
    // Resume session if it was active
    if (state.sessionActive && state.isAutoCaptureActive) {
      startAutoCapture();
    }
  }

  // Finish the photo session
  function finishSession() {
    if (!state.selectedPoses.every((_, index) => state.takenPhotos[index])) {
      alert('Please capture all photos before finishing!');
      return;
    }
    
    // Show completion message
    updateCameraStatus('Session completed!');
    
    // Create a simple celebration effect
    if (state.cameraInitialized) {
      document.querySelector('.camera-viewfinder').style.animation = 'flashSuccess 1s 3';
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
            link.click();
          }
        });
      }
      
      // Reset and go back to pose selection
      clearSelection();
      goToPoseSelectionPage();
    }, 1000);
  }

  // Event Listeners
  startSessionBtn.addEventListener('click', goToTimerPage);
  clearSelectionBtn.addEventListener('click', clearSelection);
  backToPosesFromTimerBtn.addEventListener('click', goToPoseSelectionPage);
  proceedToCameraBtn.addEventListener('click', goToCameraPage);
  backToTimerBtn.addEventListener('click', goBackToTimer);
  startSessionCameraBtn.addEventListener('click', startPhotoSession);
  pauseSessionBtn.addEventListener('click', pausePhotoSession);
  restartSessionBtn.addEventListener('click', restartPhotoSession);
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
  
  switchCameraBtn.addEventListener('click', switchCamera);
  toggleGridBtn.addEventListener('click', toggleGrid);
  toggleMirrorBtn.addEventListener('click', toggleMirror);
  resolutionSelect.addEventListener('change', changeResolution);
  retakePhotoBtn.addEventListener('click', retakeCurrentPhoto);
  continueSessionBtn.addEventListener('click', continueSession);

  // Initialize the application
  initPoseSelection();
});
