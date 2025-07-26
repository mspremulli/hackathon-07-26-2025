import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';

interface DataUploadProps {
  onUploadComplete: () => void;
}

export default function DataUpload({ onUploadComplete }: DataUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.name.endsWith('.csv') ? 'csv' : 'json');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload result:', result);
        setUploadStatus('success');
        setTimeout(() => {
          onUploadComplete();
          setUploadStatus('idle');
        }, 2000);
      } else {
        console.error('Upload failed:', response.status);
        const error = await response.text();
        console.error('Error details:', error);
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const handleGoogleAnalyticsConnect = async () => {
    setUploading(true);
    try {
      // In a real app, this would open OAuth flow
      const response = await fetch('/api/google-analytics/connect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setUploadStatus('success');
        setTimeout(() => {
          onUploadComplete();
          setUploadStatus('idle');
        }, 2000);
      }
    } catch (error) {
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Your Data</h3>
      
      {/* CSV Upload */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Upload CSV File</h4>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          
          {uploading ? (
            <div className="flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Upload className="w-6 h-6 text-primary-600" />
              </motion.div>
              <span className="ml-2 text-sm text-gray-600">Uploading...</span>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="flex items-center justify-center text-green-600">
              <CheckCircle className="w-6 h-6" />
              <span className="ml-2 text-sm">Upload successful!</span>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="flex items-center justify-center text-red-600">
              <AlertCircle className="w-6 h-6" />
              <span className="ml-2 text-sm">Upload failed. Please try again.</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports customer data, user feedback, NPS scores, etc.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Google Analytics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Google Analytics(coming soon)</h4>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleAnalyticsConnect}
          disabled={uploading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
          Connect Google Analytics
        </motion.button>
      </div>

      {/* Sample Data Templates */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Start Templates</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Customer Survey CSV
          </button>
          <button className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            NPS Scores CSV
          </button>
        </div>
      </div>
    </motion.div>
  );
}