document.addEventListener('DOMContentLoaded', function() {

    // --- Loading screen handling ---
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        // Hide it after animation ends to prevent it from blocking interaction
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500); // 这个时间应该匹配 CSS 中的 transition 时间
    }, 1500); // Start fading out after 1.5 seconds
    
    // Get required DOM elements
    let video1 = document.getElementById('video1');
    let video2 = document.getElementById('video2');
    const micButton = document.getElementById('mic-button');
    const favorabilityBar = document.getElementById('favorability-bar');

    let activeVideo = video1;
    let inactiveVideo = video2;

    // Video list
    const videoList = [
        'video-resources/3d-modeling-image-creation.mp4',
        'video-resources/jimeng-2025-07-16-1043-smiling-elegantly-swaying-hand-on-chin.mp4',
        'video-resources/jimeng-2025-07-16-4437-peace-sign-then-smiling-elegant-sway.mp4',
        'video-resources/generate-cheering-video.mp4',
        'video-resources/generate-dancing-video.mp4',
        'video-resources/negative/jimeng-2025-07-16-9418-hands-on-hips-mumbling-slightly-angry.mp4'
    ];

    // --- Video crossfade playback function ---
    function switchVideo() {
        // 1. Select next video
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        let nextVideoSrc = currentVideoSrc;
        while (nextVideoSrc === currentVideoSrc) {
            const randomIndex = Math.floor(Math.random() * videoList.length);
            nextVideoSrc = videoList[randomIndex];
        }

        // 2. Set source for inactive video element
        inactiveVideo.querySelector('source').setAttribute('src', nextVideoSrc);
        inactiveVideo.load();

        // 3. Execute switch when inactive video can play
        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            // Ensure event only triggers once
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);

            // 4. Play new video
            inactiveVideo.play().catch(error => {
                console.error("Video play failed:", error);
            });

            // 5. Switch active class to trigger CSS transition
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');

            // 6. Update roles
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];

            // Bind ended event to new activeVideo
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true }); // Use { once: true } to ensure event is only processed once
    }

    // Initial startup
    activeVideo.addEventListener('ended', switchVideo, { once: true });


    // --- Speech recognition core ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    // Check if browser supports speech recognition
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Continuous recognition
        recognition.lang = 'zh-CN'; // Set language to Chinese
        recognition.interimResults = true; // Get interim results

        recognition.onresult = (event) => {
            const transcriptContainer = document.getElementById('transcript');
            let final_transcript = '';
            let interim_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            
            // Display final recognition result
            transcriptContainer.textContent = final_transcript || interim_transcript;
            
            // Keyword-based emotion analysis and video switching
            if (final_transcript) {
                analyzeAndReact(final_transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

    } else {
        console.log('Your browser does not support speech recognition.');
        // You can provide user notification on the interface
    }

    // --- Microphone button interaction ---
    let isListening = false;

    micButton.addEventListener('click', function() {
        if (!SpeechRecognition) return; // If not supported, don't perform any action

        isListening = !isListening;
        micButton.classList.toggle('is-listening', isListening);
        const transcriptContainer = document.querySelector('.transcript-container');
        const transcriptText = document.getElementById('transcript');

        if (isListening) {
            transcriptText.textContent = 'Listening...'; // Show prompt immediately
            transcriptContainer.classList.add('visible');
            recognition.start();
        } else {
            recognition.stop();
            transcriptContainer.classList.remove('visible');
            transcriptText.textContent = ''; // Clear text
        }
    });


    // --- Emotion analysis and reaction ---
    const positiveWords = ['happy', 'joyful', 'like', 'great', 'hello', 'beautiful', '开心', '高兴', '喜欢', '太棒了', '你好', '漂亮'];
    const negativeWords = ['sad', 'angry', 'hate', 'upset', '难过', '生气', '讨厌', '伤心'];

    const positiveVideos = [
        'video-resources/jimeng-2025-07-16-1043-smiling-elegantly-swaying-hand-on-chin.mp4',
        'video-resources/jimeng-2025-07-16-4437-peace-sign-then-smiling-elegant-sway.mp4',
        'video-resources/generate-cheering-video.mp4',
        'video-resources/generate-dancing-video.mp4'
    ];
    const negativeVideo = 'video-resources/negative/jimeng-2025-07-16-9418-hands-on-hips-mumbling-slightly-angry.mp4';

    function analyzeAndReact(text) {
        let reaction = 'neutral'; // Default to neutral

        if (positiveWords.some(word => text.includes(word))) {
            reaction = 'positive';
        } else if (negativeWords.some(word => text.includes(word))) {
            reaction = 'negative';
        }

        if (reaction !== 'neutral') {
            switchVideoByEmotion(reaction);
        }
    }

    function switchVideoByEmotion(emotion) {
        let nextVideoSrc;
        if (emotion === 'positive') {
            const randomIndex = Math.floor(Math.random() * positiveVideos.length);
            nextVideoSrc = positiveVideos[randomIndex];
        } else { // negative
            nextVideoSrc = negativeVideo;
        }

        // Avoid playing the same video repeatedly
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        if (nextVideoSrc === currentVideoSrc) return;

        // --- The following logic is similar to switchVideo function for switching videos ---
        inactiveVideo.querySelector('source').setAttribute('src', nextVideoSrc);
        inactiveVideo.load();

        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);
            inactiveVideo.play().catch(error => console.error("Video play failed:", error));
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
            // Return to random playback after emotion-triggered video ends
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true });
    }

});