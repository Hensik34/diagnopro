import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { useReportStore, useTestStore, useSampleStore } from '../../../stores';
import type { UpdateTestResultData, SampleTest } from '../../../types';

/**
 * Report Entry Component
 * Demonstrates report and test store usage for entering test results
 */
export function ReportEntryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { selectedReport, fetchReportById, updateReport, isLoading: reportLoading } = useReportStore();
  const { sampleTests, fetchTestsForSample, updateTestResult, isLoading: testLoading } = useTestStore();
  const { selectedSample, fetchSampleById } = useSampleStore();
  
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [testResults, setTestResults] = useState<Record<string, UpdateTestResultData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch report and related data
  useEffect(() => {
    if (id) {
      fetchReportById(id);
    }
  }, [id, fetchReportById]);

  // Fetch sample tests when report is loaded
  useEffect(() => {
    if (selectedReport?.sample_id) {
      fetchSampleById(selectedReport.sample_id);
      fetchTestsForSample(selectedReport.sample_id);
    }
  }, [selectedReport?.sample_id, fetchSampleById, fetchTestsForSample]);

  // Initialize form with report data
  useEffect(() => {
    if (selectedReport) {
      setFindings(selectedReport.findings || '');
      setRecommendations(selectedReport.recommendations || '');
    }
  }, [selectedReport]);

  // Initialize test results from fetched data
  useEffect(() => {
    const initialResults: Record<string, UpdateTestResultData> = {};
    sampleTests.forEach((st) => {
      initialResults[st.id] = {
        result: st.result || '',
        result_unit: st.result_unit || '',
        reference_range: st.reference_range || '',
      };
    });
    setTestResults(initialResults);
  }, [sampleTests]);

  const handleTestResultChange = (sampleTestId: string, field: keyof UpdateTestResultData, value: string) => {
    setTestResults((prev) => ({
      ...prev,
      [sampleTestId]: {
        ...prev[sampleTestId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    
    try {
      // Update report findings and recommendations
      await updateReport(id, { findings, recommendations });
      
      // Update all test results
      for (const [sampleTestId, resultData] of Object.entries(testResults)) {
        if (resultData.result) {
          await updateTestResult(sampleTestId, resultData);
        }
      }
      
      // Navigate back to reports list
      navigate('/app/reports');
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (reportLoading || !selectedReport) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading report...
      </div>
    );
  }

  const isReadOnly = selectedReport.status === 'approved';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/reports')}
            className="p-2 hover:bg-accent rounded"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-foreground text-lg">
              Report Entry - {selectedReport.patient_name || 'Unknown Patient'}
            </h1>
            <p className="text-muted-foreground text-xs">
              Status: {selectedReport.status} | Type: {selectedReport.report_type || 'Lab Report'}
            </p>
          </div>
        </div>
        
        {!isReadOnly && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 px-3 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save Report'}
          </button>
        )}
      </div>

      {/* Read-only Notice */}
      {isReadOnly && (
        <div className="p-3 bg-muted border border-border rounded text-muted-foreground text-sm">
          This report has been approved and cannot be edited.
        </div>
      )}

      {/* Test Results Section */}
      <div className="bg-card border border-border rounded">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Test Results</h2>
        </div>
        
        {testLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Loading tests...
          </div>
        ) : sampleTests.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No tests assigned to this sample.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sampleTests.map((sampleTest) => (
              <div key={sampleTest.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {sampleTest.test_name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({sampleTest.test_code})
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    sampleTest.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sampleTest.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Result</label>
                    <input
                      type="text"
                      value={testResults[sampleTest.id]?.result || ''}
                      onChange={(e) => handleTestResultChange(sampleTest.id, 'result', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full h-8 px-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Unit</label>
                    <input
                      type="text"
                      value={testResults[sampleTest.id]?.result_unit || ''}
                      onChange={(e) => handleTestResultChange(sampleTest.id, 'result_unit', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full h-8 px-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Reference Range</label>
                    <input
                      type="text"
                      value={testResults[sampleTest.id]?.reference_range || ''}
                      onChange={(e) => handleTestResultChange(sampleTest.id, 'reference_range', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full h-8 px-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Findings & Recommendations */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Findings</h2>
          </div>
          <div className="p-3">
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              disabled={isReadOnly}
              rows={5}
              className="w-full p-2 bg-background border border-border rounded text-sm resize-none focus:outline-none focus:border-primary disabled:opacity-50"
              placeholder="Enter clinical findings..."
            />
          </div>
        </div>
        
        <div className="bg-card border border-border rounded">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Recommendations</h2>
          </div>
          <div className="p-3">
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              disabled={isReadOnly}
              rows={5}
              className="w-full p-2 bg-background border border-border rounded text-sm resize-none focus:outline-none focus:border-primary disabled:opacity-50"
              placeholder="Enter recommendations..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
