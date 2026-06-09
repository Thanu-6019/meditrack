'use client';
import { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { ArrowLeft, Upload, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ScannerPage() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use ref to track worker for proper cleanup
  const workerRef = useRef<Tesseract.Worker | null>(null);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (image) URL.revokeObjectURL(image); // Cleanup previous
      const url = URL.createObjectURL(file);
      setImage(url);
      setText('');
      setConfidence(null);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    
    try {
      const worker = await createWorker('eng');
      workerRef.current = worker;
      
      const ret = await worker.recognize(image);
      setText(ret.data.text);
      setConfidence(ret.data.confidence);
      
      await worker.terminate();
      workerRef.current = null;
    } catch (err) {
      console.error("OCR Error:", err);
      setText("Failed to process image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 mb-6">
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText /> Prescription Scanner</h2>
        
        <div className="mb-6">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-teal-200 rounded-xl bg-teal-50 hover:bg-teal-100 cursor-pointer transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-teal-500 mb-2" />
              <p className="text-sm text-teal-700 font-medium">Click to upload prescription image</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {image && (
          <div className="space-y-4">
            <img src={image} alt="Preview" className="max-h-64 object-contain rounded-lg border bg-slate-50 w-full" />
            <button 
              onClick={processImage} 
              disabled={isProcessing}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Extracting Text (Please wait)...' : 'Extract Text with AI'}
            </button>
          </div>
        )}

        {text && (
          <div className="mt-8 p-4 bg-slate-50 border rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">Extraction Results</h3>
              {confidence !== null && (
                <span className={`text-sm font-medium px-2 py-1 rounded ${confidence < 70 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  Confidence: {confidence.toFixed(1)}%
                </span>
              )}
            </div>
            
            {confidence !== null && confidence < 70 && (
              <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg mb-4 text-sm">
                <AlertTriangle size={18} className="shrink-0" />
                <p>Low confidence score. Please verify the extracted text carefully.</p>
              </div>
            )}
            
            <textarea 
              readOnly 
              value={text} 
              className="w-full h-48 p-3 border rounded-lg bg-white text-sm font-mono text-slate-700" 
            />
          </div>
        )}
      </div>
    </div>
  );
}