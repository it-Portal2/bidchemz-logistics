import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  quoteId: string;
  token: string;
  onUploadComplete?: (documentId: string) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  quoteId,
  token,
  onUploadComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('MSDS');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Encrypting and uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quoteId', quoteId);
      formData.append('documentType', documentType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast.success('Document uploaded successfully!', { id: toastId });
      setFile(null);
      if (onUploadComplete) {
        onUploadComplete(data.document.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            Upload Document
          </h3>
          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 border border-green-100">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            AES-256 Encrypted
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Document Type
            </label>
            <div className="relative">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block appearance-none transition-colors hover:bg-gray-100"
              >
                <option value="MSDS">MSDS (Material Safety Data Sheet)</option>
                <option value="SDS">SDS (Safety Data Sheet)</option>
                <option value="COA">COA (Certificate of Analysis)</option>
                <option value="OTHER">Other Safety Document</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors group relative cursor-pointer">
              <div className="space-y-1 text-center">
                {!file ? (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC up to 10MB
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg className="h-10 w-10 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setFile(null);
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium z-10 relative"
                    >
                      Remove file
                    </button>
                    {/* Re-enable input click if they want to change it */}
                    <label htmlFor="file-upload-change" className="absolute inset-0 w-full h-full cursor-pointer z-0">
                      <input id="file-upload-change" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            variant="primary"
            fullWidth
            isLoading={uploading}
          >
            {uploading ? 'Uploading...' : 'Secure Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
};
