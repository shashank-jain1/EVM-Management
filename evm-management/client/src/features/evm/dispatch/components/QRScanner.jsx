import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { VideoOff, Volume2, VolumeX, Camera, RotateCcw, Keyboard, Flashlight } from 'lucide-react';
import Button from '@/components/common/Button';
import { useTranslation } from '@/components/common/LanguageContext';

const SUPPORTED_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.PDF_417,
];

export default function QRScanner({ onScanSuccess, hideManualOption = false }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState('init');   // init | scanning | error | noCam
  const [errorMsg, setErrorMsg] = useState('');
  const [errorName, setErrorName] = useState('');
  const [cameras, setCameras] = useState([]);
  const [camIndex, setCamIndex] = useState(0);
  const [lastCode, setLastCode] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const callbackRef = useRef(onScanSuccess);
  const lastCodeRef = useRef('');
  const lastTimeRef = useRef(0);
  const activeInitIdRef = useRef(0);
  const isLockedRef = useRef(false);

  useEffect(() => { callbackRef.current = onScanSuccess; }, [onScanSuccess]);

  // ── Beep ────────────────────────────────────────────────────────────────────
  const playBeep = useCallback(() => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }, [soundOn]);

  // ── On decode success ────────────────────────────────────────────────────────
  const handleDecode = useCallback((text) => {
    const code = (text || '').trim();
    if (!code) return;
    if (isLockedRef.current) return;

    const now = Date.now();
    // Same-code cooldown of 4 seconds to prevent duplicate scan events
    if (code === lastCodeRef.current && now - lastTimeRef.current < 4000) return;

    // Lock scanning for 2 seconds globally
    isLockedRef.current = true;
    setTimeout(() => {
      isLockedRef.current = false;
    }, 2000);

    lastCodeRef.current = code;
    lastTimeRef.current = now;
    playBeep();
    setFlashOn(true);
    setTimeout(() => setFlashOn(false), 300);
    setLastCode(code);
    callbackRef.current?.(code);
  }, [playBeep]);

  // ── Stop Camera Stream ──────────────────────────────────────────────────────
  const stopCameraStream = useCallback(() => {
    try {
      const stream = videoRef.current?.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn('[QRScanner] Error stopping track:', e);
          }
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.warn('[QRScanner] Error releasing camera stream:', err);
    }
  }, []);

  // ── Check Torch Support ──────────────────────────────────────────────────────
  const checkTorchSupport = useCallback(() => {
    try {
      const stream = videoRef.current?.srcObject;
      const track = stream?.getVideoTracks?.()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        const supported = !!capabilities.torch;
        setTorchSupported(supported);
        if (supported && track.getSettings) {
          const settings = track.getSettings();
          setTorchOn(!!settings.torch);
        }
      } else {
        setTorchSupported(false);
      }
    } catch (e) {
      console.warn('[QRScanner] Error checking torch support:', e);
      setTorchSupported(false);
    }
  }, []);

  // ── Toggle Torch / Flashlight ───────────────────────────────────────────────
  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject;
      const track = stream?.getVideoTracks?.()[0];
      if (track) {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      }
    } catch (err) {
      console.error('[QRScanner] Failed to toggle torch:', err);
    }
  };

  // ── Start scanning ───────────────────────────────────────────────────────────
  const startScanning = useCallback(async (deviceId) => {
    if (!videoRef.current) return;

    stopCameraStream();

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (_) {}
    }

    setTorchSupported(false);
    setTorchOn(false);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);

    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;

    try {
      setPhase('scanning');
      
      const scanCallback = (result, error) => {
        if (result) {
          handleDecode(result.text);
        }
      };

      if (deviceId) {
        await codeReader.decodeFromVideoDevice(deviceId, videoRef.current, scanCallback);
      } else {
        // Try multiple camera constraint strategies for cross-platform compatibility
        let started = false;
        
        // Strategy 1: Try rear camera (works on most mobile devices)
        try {
          const rearConstraints = {
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          };
          await codeReader.decodeFromConstraints(rearConstraints, videoRef.current, scanCallback);
          started = true;
        } catch (rearErr) {
          console.warn('[QRScanner] Rear camera failed, trying fallback:', rearErr);
        }

        // Strategy 2: If rear camera failed, try any available camera
        if (!started) {
          try {
            const anyConstraints = {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            };
            await codeReader.decodeFromConstraints(anyConstraints, videoRef.current, scanCallback);
            started = true;
          } catch (anyErr) {
            console.warn('[QRScanner] Any camera fallback failed:', anyErr);
          }
        }

        // Strategy 3: If all constraints failed, try with minimal constraints
        if (!started) {
          try {
            await codeReader.decodeFromConstraints({ video: true }, videoRef.current, scanCallback);
            started = true;
          } catch (minErr) {
            console.error('[QRScanner] All camera strategies failed:', minErr);
            throw minErr;
          }
        }
      }

      // Enumerate cameras after the stream has started, ensuring permissions and labels are fully loaded
      setTimeout(async () => {
        try {
          let deviceList = await codeReader.listVideoInputDevices();
          
          // Fallback retry if list is empty or labels are missing
          const hasLabels = deviceList && deviceList.length > 0 && deviceList.some(d => d.label);
          if (!deviceList || deviceList.length === 0 || !hasLabels) {
            await new Promise(resolve => setTimeout(resolve, 500));
            deviceList = await codeReader.listVideoInputDevices();
          }

          setCameras(deviceList);

          const stream = videoRef.current?.srcObject;
          const activeTrack = stream?.getVideoTracks?.()[0];
          const activeLabel = activeTrack?.label;

          if (activeLabel) {
            const matchIndex = deviceList.findIndex(d => d.label === activeLabel);
            if (matchIndex >= 0) {
              setCamIndex(matchIndex);
            }
          } else if (deviceId) {
            const matchIndex = deviceList.findIndex(d => d.deviceId === deviceId);
            if (matchIndex >= 0) {
              setCamIndex(matchIndex);
            }
          }
        } catch (listErr) {
          console.warn('[QRScanner] Device enumeration after start failed:', listErr);
        }
      }, 300);

    } catch (err) {
      console.error('[QRScanner] Start error:', err);
      setPhase('error');
      setErrorMsg(`Could not start camera stream: ${err?.message || err}`);
    }
  }, [handleDecode]);

  // ── Initialize Camera ────────────────────────────────────────────────────────
  const initializeCamera = useCallback(async () => {
    const myId = ++activeInitIdRef.current;
    
    setErrorMsg('');
    setErrorName('');
    setPhase('init');
    setTorchSupported(false);
    setTorchOn(false);

    stopCameraStream();

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (_) {}
      codeReaderRef.current = null;
    }

    if (myId !== activeInitIdRef.current) return;

    await startScanning(null);
  }, [startScanning, stopCameraStream]);

  // ── Mount: auto-start ────────────────────────────────────────────────────────
  useEffect(() => {
    initializeCamera();

    return () => {
      stopCameraStream();
      if (codeReaderRef.current) {
        try {
          codeReaderRef.current.reset();
        } catch (_) {}
      }
    };
  }, [initializeCamera, stopCameraStream]);

  // ── Handle camera selection change ──────────────────────────────────────────
  const handleCameraChange = async (e) => {
    const idx = parseInt(e.target.value, 10);
    setCamIndex(idx);
    
    if (cameras[idx]) {
      setPhase('init');
      await new Promise(resolve => setTimeout(resolve, 50));
      await startScanning(cameras[idx].deviceId);
    }
  };

  // ── Retry after error ────────────────────────────────────────────────────────
  const retry = () => {
    initializeCamera();
  };

  // ── Manual submit ────────────────────────────────────────────────────────────
  const handleManual = (e) => {
    e.preventDefault();
    const code = manualText.trim();
    if (!code) return;
    handleDecode(code);
    setManualText('');
  };

  // ── Render: no camera / permission denied ────────────────────────────────────
  if (phase === 'noCam') {
    const isPermissionError = errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError';
    const isAlreadyInUse = errorName === 'NotReadableError' || errorName === 'TrackStartError';
    const isNotFoundError = errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError';

    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-3 p-6 border border-amber-200 rounded-xl bg-amber-50 shadow-sm text-center">
          <VideoOff size={32} className="text-amber-500 animate-pulse" />
          <h5 className="text-sm font-bold text-amber-900 font-sans">Camera Access Failed</h5>
          
          <div className="text-left w-full space-y-3 mt-2 bg-white/60 p-3 rounded-lg border border-amber-100/50">
            <p className="text-xs font-bold text-amber-800 font-sans">
              Status: <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">{errorName || 'Error'}</span>
            </p>
            <p className="text-xs text-amber-700 font-sans leading-relaxed">
              {errorMsg}
            </p>
            
            <hr className="border-amber-100" />
            
            <p className="text-[11px] font-bold text-amber-900 font-sans uppercase tracking-wider">Troubleshooting Steps:</p>
            <ul className="text-xs text-amber-800 space-y-1.5 list-decimal list-inside font-sans">
              {isPermissionError && (
                <>
                  <li><strong>Browser Access:</strong> Click the camera/shield icon in the left side of Firefox's address bar and change block to <span className="font-semibold text-emerald-700">"Allow"</span>.</li>
                  <li><strong>macOS Settings:</strong> Open <em>System Settings &gt; Privacy &amp; Security &gt; Camera</em>, and make sure Firefox is turned on.</li>
                </>
              )}
              {isAlreadyInUse && (
                <>
                  <li><strong>Close Other Apps:</strong> Check if Zoom, MS Teams, Skype, OBS, or another camera app is running and close it.</li>
                  <li><strong>Close Other Tabs:</strong> Close any other browser tabs that might be using the camera.</li>
                  <li><strong>macOS Settings:</strong> Make sure Firefox has system-level camera access enabled under System Settings.</li>
                </>
              )}
              {isNotFoundError && (
                <>
                  <li>Check if the webcam is physically connected or turned on.</li>
                  <li>Restart your browser or system if the device was recently plugged in.</li>
                </>
              )}
              {!isPermissionError && !isAlreadyInUse && !isNotFoundError && (
                <>
                  <li>Ensure the website is running on <span className="font-mono font-semibold">https://</span> or <span className="font-mono font-semibold">localhost</span>.</li>
                  <li>Check browser permissions and restart the camera.</li>
                </>
              )}
              <li>After fixing, click the <strong>"Retry Camera"</strong> button below.</li>
            </ul>
          </div>

          <Button 
            onClick={retry} 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 border border-amber-300 text-amber-800 hover:bg-amber-100 font-sans font-bold flex items-center justify-center gap-1.5 h-9 bg-white cursor-pointer shadow-sm text-xs"
          >
            <RotateCcw size={14} /> Retry Camera Connection
          </Button>
        </div>
        <ManualEntry value={manualText} onChange={setManualText} onSubmit={handleManual} />
      </div>
    );
  }

  // ── Render: scanning / error / init ──────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* ── Scanner viewport ─────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-lg bg-black border border-gray-300">

        <video
          ref={videoRef}
          onPlay={checkTorchSupport}
          className="w-full h-full object-cover"
          style={{ minHeight: 260 }}
          playsInline
          muted
        />

        {/* Floating Torch/Flashlight Button */}
        {phase === 'scanning' && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`absolute top-3 right-3 z-20 h-10 w-10 rounded-full flex items-center justify-center border transition-all shadow-md cursor-pointer ${
              torchOn
                ? 'bg-saffron-500 border-saffron-600 text-white scale-110'
                : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
            }`}
            title={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
          >
            <Flashlight size={18} className={torchOn ? 'animate-pulse' : ''} />
          </button>
        )}

        {/* Loading overlay when initializing */}
        {phase === 'init' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-300 text-center gap-3 z-10 h-full">
            <Camera size={32} className="text-gray-400 animate-pulse" />
            <p className="text-xs text-gray-500 font-sans">Starting camera scanner…</p>
            <p className="text-[10px] text-gray-400 font-sans">Allow camera access if your browser asks</p>
          </div>
        )}

        {/* Success flash overlay */}
        {flashOn && (
          <div className="absolute inset-0 bg-emerald-400/30 flex items-center justify-center z-30 pointer-events-none">
            <span className="font-mono text-emerald-900 text-sm font-bold tracking-widest uppercase bg-emerald-100 border-2 border-emerald-400 px-4 py-1.5 rounded-lg shadow-xl">
              ✓ SCANNED
            </span>
          </div>
        )}

        {/* Target guide box overlay */}
        {phase === 'scanning' && !flashOn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-60 h-36 border-2 border-dashed border-saffron-500 rounded-lg bg-black/10 flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-saffron-500 -mt-1 -ml-1" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-saffron-500 -mt-1 -mr-1" />
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-saffron-500 -mb-1 -ml-1" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-saffron-500 -mb-1 -mr-1" />
              </div>
            </div>
          </div>
        )}

        {/* Status pill */}
        {phase === 'scanning' && !flashOn && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono uppercase tracking-widest pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('Hold barcode steady inside frame')}
          </div>
        )}

        {/* Error overlay */}
        {phase === 'error' && (
          <div className="absolute inset-0 bg-navy-955/90 flex flex-col items-center justify-center gap-3 p-5 text-center z-20">
            <VideoOff size={26} className="text-red-400" />
            <p className="text-[11px] text-red-300 font-sans leading-relaxed max-w-xs">{errorMsg}</p>
            <Button onClick={retry} variant="ghost" size="sm" className="text-white border border-white/25 text-[11px] cursor-pointer">
              <RotateCcw size={13} className="mr-1.5" /> {t('Retry Camera')}
            </Button>
          </div>
        )}
      </div>

      {/* ── Last scanned code ─────────────────────────────────────────────────── */}
      {lastCode && (
        <div className="max-w-lg mx-auto p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-700 font-sans shrink-0">{t('Last scan:')}</span>
          <code className="flex-1 text-xs font-mono font-bold text-navy-950 bg-white border border-emerald-200 px-2 py-0.5 rounded shadow-sm truncate">
            {lastCode}
          </code>
        </div>
      )}

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto bg-gray-50 border border-gray-200 rounded-xl p-2 px-3 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Mute / unmute beep */}
          <button
            type="button"
            onClick={() => setSoundOn(s => !s)}
            className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
              soundOn 
                ? 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100' 
                : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
            }`}
            title={soundOn ? t('Mute scan sound') : t('Unmute scan sound')}
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Manual entry toggle */}
          {!hideManualOption && (
            <button
              type="button"
              onClick={() => setManualOpen(o => !o)}
              className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                manualOpen 
                  ? 'border-saffron-300 bg-saffron-50 text-saffron-700 hover:bg-saffron-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Keyboard size={13} />
              <span>{t('Type Code')}</span>
            </button>
          )}
        </div>

        {/* Camera Selector Dropdown or Label */}
        {cameras.length > 1 ? (
          <div className="flex items-center gap-1.5 shrink-0 max-w-[180px] sm:max-w-[220px]">
            <Camera size={13} className="text-gray-400 shrink-0" />
            <select
              value={camIndex}
              onChange={handleCameraChange}
              className="h-8 pl-2 pr-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-saffron-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234B5563%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_8px_center] bg-no-repeat w-full truncate"
            >
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={i}>
                  {cam.label?.split('(')[0]?.trim() || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          cameras[camIndex] && (
            <span className="text-[10px] text-gray-400 font-sans font-medium truncate max-w-[150px] sm:max-w-[200px]" title={cameras[camIndex].label}>
              📷 {cameras[camIndex].label?.split('(')[0]?.trim() || `Camera ${camIndex + 1}`}
            </span>
          )
        )}
      </div>

      {/* ── Manual entry panel ───────────────────────────────────────────────── */}
      {manualOpen && (
        <ManualEntry value={manualText} onChange={setManualText} onSubmit={handleManual} />
      )}
    </div>
  );
}

// ── Manual Entry sub-component ───────────────────────────────────────────────
function ManualEntry({ value, onChange, onSubmit }) {
  const { t } = useTranslation();
  return (
    <form
      onSubmit={onSubmit}
      className="max-w-lg mx-auto flex gap-2 items-end bg-gray-50 border border-gray-250 rounded-xl p-3"
    >
      <div className="flex-1">
        <label className="block text-[10px] text-gray-400 uppercase font-bold font-sans mb-1">
          {t('Enter Unit Code Manually')}
        </label>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g. EVM-12345"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 focus:outline-none bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={!value.trim()}
        className="h-10 px-4 bg-navy-950 text-white text-xs font-bold rounded-lg hover:bg-navy-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        {t('Add Code')}
      </button>
    </form>
  );
}
