import { useState } from 'react';
import { 
  Calendar,
  User,
  MapPin,
  Clock,
  PlayCircle,
  StopCircle,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Navigation,
  Activity,
  FileText,
  Camera,
  TrendingUp
} from 'lucide-react';

interface Collection {
  id: string;
  patientName: string;
  patientId: string;
  location: string;
  timeCollected: string;
  testName: string;
  status: 'collected' | 'pending' | 'issue';
  distance?: string;
}

const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'COL-2024-0891',
    patientName: 'Sarah Jenkins',
    patientId: 'PT-8901',
    location: '123 Oak Street, Downtown',
    timeCollected: '08:30 AM',
    testName: 'Complete Blood Count',
    status: 'collected',
    distance: '3.2 km',
  },
  {
    id: 'COL-2024-0892',
    patientName: 'Michael Chen',
    patientId: 'PT-7823',
    location: '456 Maple Avenue, North District',
    timeCollected: '09:15 AM',
    testName: 'Lipid Profile',
    status: 'collected',
    distance: '5.1 km',
  },
  {
    id: 'COL-2024-0893',
    patientName: 'Robert Williams',
    patientId: 'PT-6745',
    location: '789 Pine Road, East Side',
    timeCollected: '10:00 AM',
    testName: 'Thyroid Profile',
    status: 'collected',
    distance: '4.8 km',
  },
  {
    id: 'COL-2024-0894',
    patientName: 'Emma Davis',
    patientId: 'PT-5667',
    location: '321 Cedar Lane, West End',
    timeCollected: '11:30 AM',
    testName: 'HbA1c',
    status: 'collected',
    distance: '6.3 km',
  },
  {
    id: 'COL-2024-0895',
    patientName: 'David Martinez',
    patientId: 'PT-4589',
    location: '654 Elm Street, South Zone',
    timeCollected: '02:15 PM',
    testName: 'Liver Function Test',
    status: 'collected',
    distance: '7.2 km',
  },
  {
    id: 'COL-2024-0896',
    patientName: 'Jennifer Lee',
    patientId: 'PT-3421',
    location: '987 Birch Court, Central',
    timeCollected: '-',
    testName: 'Kidney Function Test',
    status: 'pending',
  },
  {
    id: 'COL-2024-0897',
    patientName: 'Patricia Brown',
    patientId: 'PT-2356',
    location: '147 Spruce Drive, North',
    timeCollected: '-',
    testName: 'Complete Blood Count',
    status: 'pending',
  },
];

export function SampleCollection() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState('staff-001');
  const [dayStarted, setDayStarted] = useState(false);
  const [dayEnded, setDayEnded] = useState(false);
  const [startKM, setStartKM] = useState('15234');
  const [endKM, setEndKM] = useState('15260');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'start' | 'end'>('start');

  const collections = MOCK_COLLECTIONS;
  const collectedCount = collections.filter(c => c.status === 'collected').length;
  const pendingCount = collections.filter(c => c.status === 'pending').length;
  const totalDistance = parseInt(endKM) - parseInt(startKM);

  const getStatusBadge = (status: Collection['status']) => {
    const styles = {
      collected: { bg: 'var(--success)', text: 'var(--success-foreground)', icon: CheckCircle },
      pending: { bg: 'var(--warning)', text: 'var(--warning-foreground)', icon: Clock },
      issue: { bg: 'var(--destructive)', text: 'var(--destructive-foreground)', icon: AlertCircle },
    };

    const style = styles[status];
    const Icon = style.icon;
    
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        <Icon className="w-2.5 h-2.5" />
        {status}
      </span>
    );
  };

  const handleStartDay = () => {
    setDayStarted(true);
    // In real app, this would record timestamp and start KM
  };

  const handleEndDay = () => {
    setDayEnded(true);
    // In real app, this would record timestamp and end KM
  };

  const handleUploadMeter = (type: 'start' | 'end') => {
    setUploadType(type);
    setShowUploadModal(true);
  };

  const handleDownloadReport = () => {
    // In real app, this would generate and download PDF report
    console.log('Downloading daily collection report...');
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Sample Collection Tracking</h1>
          <p className="text-muted-foreground text-xs">
            Monitor field staff collection activities and routes
          </p>
        </div>
        <button 
          onClick={handleDownloadReport}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Download Report
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-card border border-border rounded p-3">
        <div className="grid grid-cols-5 gap-3 mb-3">
          {/* Date Selector */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Collection Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input 
                type="date"
                className="w-full h-8 pl-8 pr-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Staff Selector */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Collection Staff</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select 
                className="w-full h-8 pl-8 pr-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="staff-001">John Anderson</option>
                <option value="staff-002">Maria Santos</option>
                <option value="staff-003">Robert Taylor</option>
                <option value="staff-004">David Kim</option>
              </select>
            </div>
          </div>

          {/* Start KM */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Start KM</label>
            <div className="flex gap-1">
              <input 
                type="text"
                className="flex-1 h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                value={startKM}
                onChange={(e) => setStartKM(e.target.value)}
                disabled={dayStarted}
              />
              <button 
                onClick={() => handleUploadMeter('start')}
                className="h-8 w-8 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
                title="Upload meter image"
              >
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* End KM */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">End KM</label>
            <div className="flex gap-1">
              <input 
                type="text"
                className="flex-1 h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                value={endKM}
                onChange={(e) => setEndKM(e.target.value)}
                disabled={!dayEnded}
              />
              <button 
                onClick={() => handleUploadMeter('end')}
                className="h-8 w-8 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
                title="Upload meter image"
                disabled={!dayEnded}
              >
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Day Control</label>
            <div className="flex gap-1">
              {!dayStarted ? (
                <button 
                  onClick={handleStartDay}
                  className="flex-1 h-8 px-2 flex items-center justify-center gap-1 bg-success text-white rounded hover:opacity-90 transition-opacity text-xs"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Start
                </button>
              ) : !dayEnded ? (
                <button 
                  onClick={handleEndDay}
                  className="flex-1 h-8 px-2 flex items-center justify-center gap-1 bg-destructive text-white rounded hover:opacity-90 transition-opacity text-xs"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  End
                </button>
              ) : (
                <div className="flex-1 h-8 px-2 flex items-center justify-center gap-1 bg-muted text-muted-foreground rounded text-xs">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Ended
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">Status:</span>
          {!dayStarted ? (
            <span className="text-muted-foreground">Day not started</span>
          ) : !dayEnded ? (
            <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
              <Activity className="w-3 h-3" />
              Collection in progress - Started at 08:00 AM
            </span>
          ) : (
            <span className="text-muted-foreground">Day completed at 03:30 PM</span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Start KM</span>
            <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{startKM}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Odometer</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">End KM</span>
            <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{endKM}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Odometer</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Distance</span>
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{totalDistance}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Kilometers</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Collections</span>
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{collectedCount}/{collections.length}</div>
          <div className="text-[10px] text-success mt-0.5">Completed</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Assigned Branch</span>
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-sm">Central Lab</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Downtown</div>
        </div>
      </div>

      {/* Daily Route Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-2.5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Route Start</div>
          <div className="text-xs text-foreground">08:00 AM</div>
        </div>
        <div className="bg-card border border-border rounded p-2.5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Route End</div>
          <div className="text-xs text-foreground">{dayEnded ? '03:30 PM' : 'In Progress'}</div>
        </div>
        <div className="bg-card border border-border rounded p-2.5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Duration</div>
          <div className="text-xs text-foreground">{dayEnded ? '7h 30m' : '6h 15m elapsed'}</div>
        </div>
        <div className="bg-card border border-border rounded p-2.5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Avg. Distance/Collection</div>
          <div className="text-xs text-foreground">{(totalDistance / collectedCount).toFixed(1)} km</div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between">
          <h3 className="text-foreground text-sm flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Today's Collections
          </h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-muted-foreground">
              <span className="text-success">{collectedCount} collected</span> • 
              <span className="text-warning ml-1">{pendingCount} pending</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Collection ID</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Patient</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Location</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Time</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Test Name</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Distance</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {collections.map((collection) => (
                <tr 
                  key={collection.id} 
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-foreground tabular-nums">{collection.id}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground">{collection.patientName}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{collection.patientId}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="line-clamp-1">{collection.location}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-xs text-foreground tabular-nums flex items-center justify-center gap-1">
                      {collection.timeCollected !== '-' && <Clock className="w-3 h-3 text-muted-foreground" />}
                      {collection.timeCollected}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground">{collection.testName}</td>
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground tabular-nums">
                    {collection.distance || '-'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getStatusBadge(collection.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Total route distance: <span className="text-foreground tabular-nums">{totalDistance} km</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing <span className="text-foreground">{collections.length}</span> scheduled collections
          </div>
        </div>
      </div>

      {/* Upload Meter Image Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-foreground text-sm flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Upload {uploadType === 'start' ? 'Start' : 'End'} Meter Reading
              </h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-xs text-muted-foreground mb-3">
                Upload a clear photo of your vehicle's odometer reading for verification.
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/30 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-foreground mb-1">Click to upload or drag and drop</p>
                <p className="text-[10px] text-muted-foreground">JPG, PNG up to 5MB</p>
              </div>

              {/* KM Reading Input */}
              <div>
                <label className="text-xs text-foreground block mb-1.5">Odometer Reading (KM)</label>
                <input 
                  type="text"
                  className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-right tabular-nums"
                  placeholder="Enter reading"
                  value={uploadType === 'start' ? startKM : endKM}
                  onChange={(e) => uploadType === 'start' ? setStartKM(e.target.value) : setEndKM(e.target.value)}
                />
              </div>

              <div className="bg-info/10 border border-info/20 rounded p-2.5 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
                <p className="text-[11px]" style={{ color: 'var(--info)' }}>
                  Ensure the odometer reading is clearly visible in the photo for audit purposes.
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="h-8 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity"
              >
                Upload & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
