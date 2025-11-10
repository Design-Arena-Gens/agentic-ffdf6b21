"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildResponse } from "@/lib/responseEngine";

function getMarathiVoice(): SpeechSynthesisVoice | null {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!synth) return null;
  const voices = synth.getVoices();
  // Prefer Marathi, then Hindi-India, then any Indian English
  const byLang = (code: string) => voices.find(v => v.lang?.toLowerCase().startsWith(code));
  return (
    byLang("mr") ||
    voices.find(v => v.lang?.toLowerCase() === "mr-in") ||
    byLang("hi-") ||
    byLang("en-in") ||
    voices[0] ||
    null
  );
}

export function VoiceAssistant() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [support, setSupport] = useState({ tts: false, stt: false });

  useEffect(() => {
    const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;
    const hasSTT = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    setSupport({ tts: hasTTS, stt: hasSTT });
  }, []);

  useEffect(() => {
    if (!support.stt) return;
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.lang = "mr-IN"; // Try Marathi first
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e: any) => {
      let combined = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        combined += e.results[i][0].transcript;
      }
      setTranscript(combined.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
  }, [support.stt]);

  const speak = useMemo(() => {
    return (text: string) => {
      if (!support.tts || typeof window === "undefined") return;
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      const ensureVoice = () => {
        const voice = getMarathiVoice();
        if (voice) utter.voice = voice;
        utter.lang = voice?.lang || "mr-IN";
        utter.rate = 1;
        utter.pitch = 1;
        setSpeaking(true);
        synth.speak(utter);
        utter.onend = () => setSpeaking(false);
      };
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = ensureVoice;
      } else {
        ensureVoice();
      }
    };
  }, [support.tts]);

  const handleListenToggle = () => {
    if (!support.stt) return;
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    setTranscript("");
    try {
      recognitionRef.current?.start?.();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const handleSend = (input?: string) => {
    const text = (input ?? transcript).trim();
    if (!text) return;
    const resp = buildResponse(text);
    setHistory(prev => [...prev, { role: "user", text }, { role: "assistant", text: resp }]);
    setTranscript("");
    if (support.tts) speak(resp);
  };

  return (
    <div className="container">
      <div className="panel">
        <div className="messages" role="log" aria-live="polite">
          {history.length === 0 && (
            <div className="hint">
              <p>???????, ?? ????. ????, ?????? ??? ???????? ?????.</p>
              <p>???? ????? ????. ????, ????, ????? ????? ??????</p>
            </div>
          )}
          {history.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="controls">
          <div className="input-row">
            <input
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="???? ?????? ??? ???? ????? ?????????? ????"
            />
            <button onClick={() => handleSend()} className="send" aria-label="Send">????</button>
          </div>
          <div className="actions">
            <button
              onClick={handleListenToggle}
              disabled={!support.stt}
              className={`mic ${listening ? "active" : ""}`}
              aria-pressed={listening}
            >{listening ? "?????? ??????" : support.stt ? "??????????" : "STT ?????? ????"}</button>
            <button onClick={() => speak("???? ???. ???? ????.")} disabled={!support.tts}>
              ???? ?????
            </button>
            <button onClick={() => handleSend("?????? ????????? ???? ??? ???????")}>??????</button>
          </div>
        </div>
        {speaking && <div className="speaking">???? ???? ????</div>}
      </div>
    </div>
  );
}
