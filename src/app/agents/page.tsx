'use client'

import { useState } from 'react';
import { extractTextFromPDF, extractPropertiesFromText } from '@/actions/agents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function AgentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'extracting_text' | 'extracting_properties' | 'done'>('idle');
  const [extractedText, setExtractedText] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setStep('idle');
      setExtractedText('');
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setStep('extracting_text');

    try {
      // Agent 1: Extract Text
      const formData = new FormData();
      formData.append('file', file);
      
      const textResult = await extractTextFromPDF(formData);
      
      if (!textResult.success || !textResult.text) {
        throw new Error(textResult.error || 'Failed to extract text');
      }

      setExtractedText(textResult.text);
      setStep('extracting_properties');

      // Agent 2: Extract Properties
      const propsResult = await extractPropertiesFromText(textResult.text);
      
      if (!propsResult.success || !propsResult.data) {
        throw new Error(propsResult.error || 'Failed to extract properties');
      }

      setResult(propsResult.data);
      setStep('done');

    } catch (err: any) {
      setError(err.message);
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>AI Document Agents</CardTitle>
          <CardDescription>
            Upload a PDF to extract Price and Estimated Price using our dual-agent system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pdf-upload">Upload PDF</Label>
            <Input 
              id="pdf-upload" 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={handleProcess} 
            disabled={!file || loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {step === 'extracting_text' ? 'Agent 1: Reading PDF...' : 'Agent 2: Analyzing Data...'}
              </>
            ) : (
              'Start Processing'
            )}
          </Button>

          {extractedText && (
            <div className="space-y-2">
              <Label>Extracted Text Preview (Agent 1 Output)</Label>
              <div className="bg-slate-50 p-4 rounded-md text-xs font-mono h-40 overflow-y-auto border">
                {extractedText}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 border-t pt-4">
              <Label className="text-lg font-semibold">Final Result (Agent 2 Output)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-md bg-green-50">
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="text-xl font-bold text-green-700">
                    {result.price || 'N/A'}
                  </div>
                </div>
                <div className="p-4 border rounded-md bg-blue-50">
                  <div className="text-sm text-gray-500">Estimated Price</div>
                  <div className="text-xl font-bold text-blue-700">
                    {result.estimatedPrice || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
