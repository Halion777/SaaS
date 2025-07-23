import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import Icon from './AppIcon';
import { transcribeAudio } from '../services/openaiService';

const VoiceInput = ({ onTranscription, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const transcription = await transcribeAudio(audioBlob);
          onTranscription?.(transcription);
        } catch (error) {
          console.error('Transcription error:', error);
          onTranscription?.('');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        iconName={isRecording ? "Square" : "Mic"}
        iconPosition="left"
      >
        {isRecording ? 'Arrêter' : isProcessing ? 'Traitement...' : 'Dicter'}
      </Button>
      
      {isRecording && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Enregistrement...</span>
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center space-x-1">
          <Icon name="Loader2" size={16} className="animate-spin" />
          <span className="text-sm text-muted-foreground">Transcription...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;