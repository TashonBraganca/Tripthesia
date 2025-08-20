"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Sparkles,
  MapPin,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  pulseVariants,
  statusVariants
} from "@/lib/motion";

interface VoiceSearchProps {
  onResult: (destination: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  className?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Extend the Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: SpeechGrammarList;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Voice command patterns for better recognition
const DESTINATION_PATTERNS = [
  /(?:I want to go to|take me to|visit|travel to|plan a trip to)\s+(.+)/i,
  /(?:destination|place).*?(?:is|:)\s*(.+)/i,
  /^(.+)(?:\s+please)?$/i
];

const SAMPLE_COMMANDS = [
  "I want to go to Tokyo",
  "Take me to Paris, France", 
  "Visit New York City",
  "Plan a trip to Bali",
  "Tokyo, Japan",
  "London"
];

export function VoiceSearch({ onResult, onError, placeholder = "Try saying 'Take me to Tokyo'", className }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [showCommands, setShowCommands] = useState(false);

  // Check for browser support and initialize
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript("");
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            setConfidence(result[0].confidence);
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          processVoiceCommand(finalTranscript, event.results[event.resultIndex][0].confidence);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = "Speech recognition error";
        
        switch (event.error) {
          case 'network':
            errorMessage = "Network error - check your connection";
            break;
          case 'not-allowed':
            errorMessage = "Microphone access denied";
            setHasPermission(false);
            break;
          case 'service-not-allowed':
            errorMessage = "Speech service not allowed";
            break;
          case 'bad-grammar':
            errorMessage = "Speech not recognized - try again";
            break;
          case 'language-not-supported':
            errorMessage = "Language not supported";
            break;
          case 'no-speech':
            errorMessage = "No speech detected - try speaking louder";
            break;
          case 'audio-capture':
            errorMessage = "Microphone not available";
            break;
          default:
            errorMessage = `Speech error: ${event.error}`;
        }
        
        setError(errorMessage);
        setIsListening(false);
        onError?.(errorMessage);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError("Speech recognition not supported in this browser");
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onError]);

  const processVoiceCommand = (command: string, confidence: number) => {
    // Extract destination from voice command
    let destination = "";
    
    for (const pattern of DESTINATION_PATTERNS) {
      const match = command.match(pattern);
      if (match && match[1]) {
        destination = match[1].trim();
        break;
      }
    }
    
    // If no pattern matched, use the whole command as destination
    if (!destination) {
      destination = command.trim();
    }
    
    // Clean up common speech artifacts
    destination = destination
      .replace(/\b(please|thanks?|thank you)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (destination && confidence > 0.5) {
      onResult(destination);
    } else if (confidence <= 0.5) {
      setError("Low confidence - please try speaking more clearly");
    } else {
      setError("Couldn't understand destination - please try again");
    }
  };

  const startListening = async () => {
    if (!isSupported || !recognitionRef.current) return;
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      
      recognitionRef.current.start();
    } catch (err) {
      setHasPermission(false);
      setError("Microphone access required for voice search");
      onError?.("Microphone access denied");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Card className={cn("border-amber-200 bg-amber-50/50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Voice search not available</p>
              <p className="text-sm">Your browser doesn't support speech recognition</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Voice Search Interface */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        isListening && "border-emerald-500 shadow-lg shadow-emerald-500/25",
        error && "border-red-300 bg-red-50/50"
      )}>
        <CardContent className="p-6">
          <div className="text-center">
            {/* Voice Button */}
            <motion.div className="relative mb-4">
              <motion.button
                onClick={toggleListening}
                disabled={hasPermission === false}
                className={cn(
                  "relative w-16 h-16 rounded-full border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                  isListening 
                    ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/25" 
                    : "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg shadow-emerald-500/25"
                )}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MicOff className="h-6 w-6 mx-auto" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Mic className="h-6 w-6 mx-auto" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              
              {/* Listening Animation */}
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Status Text */}
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="listening-text"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <h3 className="text-lg font-semibold text-red-600 mb-1">Listening...</h3>
                  <p className="text-sm text-muted-foreground">{placeholder}</p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle-text"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <h3 className="text-lg font-semibold mb-1">Voice Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the microphone and say your destination
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Transcript */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">I heard:</span>
                  {confidence > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(confidence * 100)}% confident
                    </Badge>
                  )}
                </div>
                <p className="text-emerald-800 font-medium">"{transcript}"</p>
              </motion.div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                variants={statusVariants}
                className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Example Commands */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Try these voice commands
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommands(!showCommands)}
              className="text-xs"
            >
              {showCommands ? "Hide" : "Show"} examples
            </Button>
          </div>
          
          <AnimatePresence>
            {showCommands && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_COMMANDS.map((command, index) => (
                    <motion.div
                      key={command}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 p-2 rounded bg-background/50 border border-border/50"
                    >
                      <Mic className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">"{command}"</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}