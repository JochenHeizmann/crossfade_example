function CrossfadePlayer() {
    this.playing = false;  

    this.sampleBuffer1 = null;
    this.sampleBuffer2 = null;

    this.ctl1 = null;
    this.ctl2 = null;

    if (CrossfadePlayer.audioContext == null) {
        this.initAudioCtx();
    }

    this.onReady = function() {};
}

CrossfadePlayer.prototype.initAudioCtx = function() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        CrossfadePlayer.audioContext = new AudioContext();
    } catch(e) {
        alert('Web Audio API is not supported in this browser');
    }
};

CrossfadePlayer.prototype.loadSounds = function(soundUrl1, soundUrl2) { 
    var playerInstance = this;
    playerInstance.sampleBuffer1 = null;
    playerInstance.sampleBuffer2 = null;
    this.loadSound(function(buffer) { playerInstance.sampleBuffer1 = buffer; playerInstance.checkIfAllSoundsLoaded(); }, soundUrl1);
    this.loadSound(function(buffer) { playerInstance.sampleBuffer2 = buffer; playerInstance.checkIfAllSoundsLoaded(); }, soundUrl2);
};

CrossfadePlayer.prototype.checkIfAllSoundsLoaded = function() {
    if (this.sampleBuffer1 != null && this.sampleBuffer2 != null) {
        this.onReady();
    } else {
        // console.log("Not loaded yet");
    }
};

CrossfadePlayer.prototype.loadSound = function(assignBuffer, url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    // Decode asynchronously
    request.onload = function() {
        CrossfadePlayer.audioContext.decodeAudioData(request.response, assignBuffer);
    }

    request.onerror = function() {
        alert("Error when loading " + url);
    }

    request.send();
}

CrossfadePlayer.prototype.play = function() {
    var playerInstance = this;

    if (!playerInstance.sampleBuffer1 instanceof AudioBuffer) {
        alert("Error! SampleBuffer1 is empty");
        return;
    }

    if (!playerInstance.sampleBuffer2 instanceof AudioBuffer) {
        alert("Error! SampleBuffer2 is empty");
        return;
    }

    this.ctl1 = createSource(playerInstance.sampleBuffer1);
    this.ctl2 = createSource(playerInstance.sampleBuffer2);

    this.ctl1.gainNode.gain.value = 0;

    if (!this.ctl1.source.start) {
        this.ctl1.source.noteOn(0);
        this.ctl2.source.noteOn(0);
    } else {
        this.ctl1.source.start(0);
        this.ctl2.source.start(0);
    }

    function createSource(buffer) {                
        if (!buffer instanceof AudioBuffer) {
            alert("Error! Cannot create Source. (Buffer not loaded yet?)");
        }
        
        var source = CrossfadePlayer.audioContext.createBufferSource();
        var gainNode = CrossfadePlayer.audioContext.createGain ? CrossfadePlayer.audioContext.createGain() : CrossfadePlayer.audioContext.createGainNode();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        gainNode.connect(CrossfadePlayer.audioContext.destination);
        return {
            source: source,
            gainNode: gainNode
        };
    }
};

CrossfadePlayer.prototype.stop = function() {
    if (!this.ctl1.source.stop) {
        this.ctl1.source.noteOff(0);
        this.ctl2.source.noteOff(0);
    } else {
        this.ctl1.source.stop(0);
        this.ctl2.source.stop(0);
    }
};

CrossfadePlayer.prototype.crossfade = function(element) {
    var x = parseInt(element.value) / parseInt(element.max);
    // Use an equal-power crossfading curve:
    var gain1 = Math.cos(x * 0.5*Math.PI);
    var gain2 = Math.cos((1.0 - x) * 0.5*Math.PI);
    this.ctl1.gainNode.gain.value = gain1;
    this.ctl2.gainNode.gain.value = gain2;
};

CrossfadePlayer.prototype.toggle = function() {
    this.playing ? this.stop() : this.play();
    this.playing = !this.playing;
};

CrossfadePlayer.audioContext = null;
