// Web Speech API interface declarations for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class AudioSpeechService {
  private recognition: any = null;
  private isListening = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const win = typeof window !== 'undefined' ? (window as unknown as IWindow) : null;
    if (!win) return;

    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES'; // Spanish locale suitable for Latin American & Spanish speech
    }
  }

  public isSpeechSupported(): boolean {
    return !!this.recognition;
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('El reconocimiento de voz no está soportado en este navegador.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.playBeep(600, 0.1); // Sound cue on mic open

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      onError(event.error === 'not-allowed' ? 'Permiso de micrófono denegado' : 'Error en escucha');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      onError('No se pudo iniciar el micrófono');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  // Audio beeps for POS feedback using Web Audio API
  public playBeep(freq = 800, duration = 0.08) {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context might fail silently if user hasn't interacted
    }
  }

  public playSuccessSound() {
    this.playBeep(880, 0.06);
    setTimeout(() => this.playBeep(1320, 0.12), 70);
  }

  public playAlertSound() {
    this.playBeep(400, 0.12);
    setTimeout(() => this.playBeep(300, 0.18), 140);
  }

  // Text to Speech feedback for tendero
  public speak(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const audioSpeech = new AudioSpeechService();
