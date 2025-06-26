'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { receiptScanner } from '@/lib/services/receipt-service';
import { ReceiptScanResult } from '@/types/receipt';
import { RECEIPT_CONFIG } from '@/lib/constants/receipt-notification-config';
import { useAuth } from '@/lib/firebase/auth-context';
import { useToast } from '@/hooks/useToast';
import { Buffer } from 'buffer';

interface ReceiptScannerProps {
  onScanComplete: (result: ReceiptScanResult) => void;
  onClose: () => void;
}

export function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toastError('Could not access the camera. Please check permissions.');
      setMode('upload');
    }
  }, [toastError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedImage(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  }, [stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!RECEIPT_CONFIG.supportedFormats.some(format => 
      file.type.includes(format) || file.name.toLowerCase().endsWith(`.${format}`)
    )) {
      toastError('Unsupported file format.');
      return;
    }

    if (file.size > RECEIPT_CONFIG.maxImageSize) {
      toastError('File is too large.');
      return;
    }

    setCapturedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [toastError]);

  // Process the captured/uploaded image
  const processImage = useCallback(async () => {
    if (!capturedImage || !user) return;

    setIsProcessing(true);
    setProcessingStatus('Processing receipt...');
    
    try {
      // Initialize scanner if needed
      await receiptScanner.initialize();
      
      const imageBuffer = await capturedImage.arrayBuffer();
      
      // Scan the image
      const result = await receiptScanner.scanReceipt(
        Buffer.from(imageBuffer),
        user.uid,
        capturedImage.type
      );
      
      // Pass result to parent
      onScanComplete(result);
      
    } catch (error: any) {
      console.error('Receipt scan failed:', error);
      toastError(`Scan failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  }, [capturedImage, onScanComplete, user, toastError]);

  // Effect to manage camera state
  useEffect(() => {
    if (mode === 'camera' && !previewUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup on unmount
    return () => stopCamera();
  }, [mode, previewUrl, startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Scan Receipt</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mode Toggles */}
        <div className="p-2 bg-gray-100 flex gap-2">
          <Button
            variant={mode === 'camera' ? 'secondary' : 'ghost'}
            onClick={() => setMode('camera')}
            className="flex-1"
            disabled={isProcessing}
          >
            <Camera className="w-4 h-4 mr-2" />
            Camera
          </Button>
          <Button
            variant={mode === 'upload' ? 'secondary' : 'ghost'}
            onClick={() => setMode('upload')}
            className="flex-1"
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {!previewUrl ? (
            <>
              {/* Camera View */}
              {mode === 'camera' && (
                <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-lg" />
                    </div>
                    <p className="absolute bottom-8 left-0 right-0 text-center text-white text-sm px-4">
                      Align receipt in the frame
                    </p>
                  </div>

                  {/* Capture Button */}
                  <Button
                    onClick={capturePhoto}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-navy hover:bg-gray-100"
                  >
                    Capture
                  </Button>
                </div>
              )}

              {/* Upload View */}
              {mode === 'upload' && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={RECEIPT_CONFIG.supportedFormats.map(f => `.${f}`).join(',')}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors"
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 text-center">
                      Click to upload a file
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Supported formats: {RECEIPT_CONFIG.supportedFormats.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Preview View */
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewUrl(null);
                    setCapturedImage(null);
                    if (mode === 'camera') {
                      startCamera();
                    }
                  }}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Retake
                </Button>
                <Button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex-1 !bg-navy !hover:bg-navy/90 !text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {processingStatus || 'Processing...'}
                    </>
                  ) : (
                    'Process'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 