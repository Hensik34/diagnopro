import { Calendar, User, FileText, MapPin, Phone, Mail, QrCode, Stethoscope } from 'lucide-react';
import { useLocation } from 'react-router';

interface Parameter {
  name: string;
  result: string;
  unit: string;
  refRange: string;
  isAbnormal: boolean;
  status?: string;
}

interface ReportData {
  lab: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    license: string;
  };
  report: {
    id: string;
    date: string;
    time: string;
  };
  patient: {
    name: string;
    id: string;
    age: number;
    gender: string;
    referringDoctor: string;
    sampleId: string;
    collectionDate: string;
    collectionTime: string;
    reportedDate: string;
  };
  test: {
    name: string;
    category: string;
  };
  parameters: Parameter[];
  technician: {
    name: string;
    signature: string;
  };
  pathologist: {
    name: string;
    title: string;
    license: string;
    signature: string;
  };
}

const MOCK_REPORT_DATA: ReportData = {
  lab: {
    name: 'Central Medical Diagnostics Laboratory',
    address: '1234 Healthcare Avenue, Medical District',
    city: 'New York, NY 10001',
    phone: '+1 (555) 123-4567',
    email: 'lab@centralmedical.com',
    license: 'LAB-NY-2024-001234',
  },
  report: {
    id: 'REP-2024-001234',
    date: 'March 3, 2024',
    time: '10:30 AM',
  },
  patient: {
    name: 'Sarah Jenkins',
    id: 'PT-8901',
    age: 58,
    gender: 'Female',
    referringDoctor: 'Dr. Michael Thompson, MD',
    sampleId: 'SMP-2024-5678',
    collectionDate: 'March 2, 2024',
    collectionTime: '08:15 AM',
    reportedDate: 'March 3, 2024',
  },
  test: {
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
  },
  parameters: [
    { name: 'Hemoglobin', result: '12.8', unit: 'g/dL', refRange: '12.0 - 15.5', isAbnormal: false },
    { name: 'RBC Count', result: '4.3', unit: 'mil/µL', refRange: '4.1 - 5.1', isAbnormal: false },
    { name: 'WBC Count', result: '13.2', unit: 'thou/µL', refRange: '4.5 - 11.0', isAbnormal: true },
    { name: 'Platelet Count', result: '245', unit: 'thou/µL', refRange: '150 - 400', isAbnormal: false },
    { name: 'Hematocrit', result: '39.5', unit: '%', refRange: '36 - 46', isAbnormal: false },
    { name: 'MCV', result: '88', unit: 'fL', refRange: '80 - 96', isAbnormal: false },
    { name: 'MCH', result: '29.5', unit: 'pg', refRange: '27 - 32', isAbnormal: false },
    { name: 'MCHC', result: '33.8', unit: 'g/dL', refRange: '32 - 36', isAbnormal: false },
    { name: 'Neutrophils', result: '72', unit: '%', refRange: '40 - 70', isAbnormal: true },
    { name: 'Lymphocytes', result: '22', unit: '%', refRange: '20 - 40', isAbnormal: false },
    { name: 'Monocytes', result: '4', unit: '%', refRange: '2 - 8', isAbnormal: false },
    { name: 'Eosinophils', result: '2', unit: '%', refRange: '1 - 4', isAbnormal: false },
  ],
  technician: {
    name: 'Lisa Johnson, MLT',
    signature: 'L. Johnson',
  },
  pathologist: {
    name: 'Dr. Emily Rodriguez, MD',
    title: 'Consultant Pathologist',
    license: 'MD-NY-45678',
    signature: 'E. Rodriguez',
  },
};

export function ReportPreview() {
  const location = useLocation();
  
  // Get report data from navigation state, fall back to mock data if not provided
  const reportData: ReportData = (location.state as { reportData?: ReportData })?.reportData || MOCK_REPORT_DATA;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[210mm] mx-auto">
        {/* Action Buttons */}
        <div className="mb-4 flex justify-end gap-2 print:hidden">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            Print Report
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Download PDF
          </button>
        </div>

        {/* A4 Report Container */}
        <div 
          className="bg-white shadow-lg"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            fontFamily: 'Georgia, serif',
          }}
        >
          {/* Header Section */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <div className="flex items-start justify-between">
              {/* Lab Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {reportData.lab.name}
                </h1>
                <p className="text-sm text-gray-700 mb-0.5">{reportData.lab.address}</p>
                <p className="text-sm text-gray-700 mb-0.5">{reportData.lab.city}</p>
                <p className="text-sm text-gray-700 mb-0.5">
                  Tel: {reportData.lab.phone} | Email: {reportData.lab.email}
                </p>
                <p className="text-xs text-gray-600 mt-1">License No: {reportData.lab.license}</p>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex flex-col items-end">
                <div className="w-20 h-20 border-2 border-gray-300 flex items-center justify-center mb-1">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-xs text-gray-600">Scan to verify</p>
              </div>
            </div>
          </div>

          {/* Report Info Bar */}
          <div className="bg-gray-100 border border-gray-300 p-3 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-0.5">Report ID</p>
                <p className="text-sm font-bold text-gray-900">{reportData.report.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-0.5">Report Date</p>
                <p className="text-sm font-bold text-gray-900">
                  {reportData.report.date} {reportData.report.time}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-0.5">Test Type</p>
                <p className="text-sm font-bold text-gray-900">{reportData.test.name}</p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-3 pb-1 border-b border-gray-300">
              PATIENT INFORMATION
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex">
                <span className="text-sm text-gray-700 font-semibold w-40">Patient Name:</span>
                <span className="text-sm text-gray-900">{reportData.patient.name}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-700 font-semibold w-40">Patient ID:</span>
                <span className="text-sm text-gray-900">{reportData.patient.id}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-700 font-semibold w-40">Age / Gender:</span>
                <span className="text-sm text-gray-900">
                  {reportData.patient.age} Years / {reportData.patient.gender}
                </span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-700 font-semibold w-40">Sample ID:</span>
                <span className="text-sm text-gray-900">{reportData.patient.sampleId}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-700 font-semibold w-40">Referring Doctor:</span>
                <span className="text-sm text-gray-900">{reportData.patient.referringDoctor}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-700 font-semibold w-40">Collection Date:</span>
                <span className="text-sm text-gray-900">
                  {reportData.patient.collectionDate} at {reportData.patient.collectionTime}
                </span>
              </div>
            </div>
          </div>

          {/* Test Results Table */}
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-900 mb-3 pb-1 border-b border-gray-300">
              TEST RESULTS
            </h2>
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Parameter
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Reference Range
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.parameters.map((param, index) => {
                  // Determine arrow indicator based on status
                  const getArrowIndicator = () => {
                    if (param.status?.includes('critical-high') || param.status === 'high') {
                      return <span className="ml-1 text-xs">↑</span>;
                    }
                    if (param.status?.includes('critical-low') || param.status === 'low') {
                      return <span className="ml-1 text-xs">↓</span>;
                    }
                    return null;
                  };

                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        {param.name}
                      </td>
                      <td className={`border border-gray-300 px-3 py-2 text-sm text-center ${param.isAbnormal ? 'font-bold' : ''}`}>
                        {param.result}
                        {param.isAbnormal && getArrowIndicator()}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-700 text-center">
                        {param.unit}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-700 text-center">
                        {param.refRange}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-600 mt-2 italic">
              * Bold values with arrows indicate results outside reference range
            </p>
          </div>

          {/* Notes Section */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Clinical Notes:</h3>
            <div className="border border-gray-300 p-3 min-h-[60px] bg-gray-50">
              <p className="text-sm text-gray-700 italic">No additional clinical notes.</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-bold text-gray-900">{reportData.technician.name}</p>
                <p className="text-xs text-gray-600">Medical Laboratory Technician</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-bold text-gray-900">{reportData.pathologist.name}</p>
                <p className="text-xs text-gray-600">{reportData.pathologist.title}</p>
                <p className="text-xs text-gray-600">License: {reportData.pathologist.license}</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase">Important Disclaimer</h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              This report is based on the specimen(s) received and tested as per the information provided. 
              Results should be correlated with clinical findings. Test results are valid only for the specimen tested. 
              This report is generated electronically and is valid without signature. For any queries, please contact 
              the laboratory at {reportData.lab.phone} or {reportData.lab.email}.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500">
              Report generated on {reportData.patient.reportedDate} | Page 1 of 1
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {reportData.lab.name} - Committed to Quality Healthcare
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}