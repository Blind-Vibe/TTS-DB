import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  UserPlus, 
  Calendar, 
  Clock, 
  CreditCard, 
  Star, 
  Upload, 
  Download,
  CheckCircle,
  XCircle,
  Edit,
  Trash,
  Tag,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Award,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  CalendarDays,
  Timer,
  Target,
  Zap
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import Breadcrumbs, { useBreadcrumbs } from '../components/navigation/Breadcrumbs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useStaffManagement } from '../hooks/useStaffManagement';
import { toast } from 'react-hot-toast';
import { StaffMember, Shift } from '../types';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialStaff?: StaffMember;
  isSubmitting: boolean;
}

const StaffFormModal: React.FC<StaffFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialStaff, 
  isSubmitting 
}) => {
  const [formData, setFormData] = useState<Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>>({
    firstName: initialStaff?.firstName || '',
    lastName: initialStaff?.lastName || '',
    email: initialStaff?.email || '',
    phone: initialStaff?.phone || null,
    position: initialStaff?.position || '',
    department: initialStaff?.department || '',
    hourlyRate: initialStaff?.hourlyRate || null,
    isActive: initialStaff?.isActive ?? true,
    hireDate: initialStaff?.hireDate || format(new Date(), 'yyyy-MM-dd'),
    skills: initialStaff?.skills || [],
    notes: initialStaff?.notes || null
  });

  const [skillInput, setSkillInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value || null }));
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 shadow-2xl border border-zinc-700/50">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
        <div className="relative">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-700/50 bg-zinc-900/90 backdrop-blur-sm px-6 py-4">
          <h2 className="text-xl font-semibold text-white font-playfair">
            {initialStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
            onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
          >
            <XCircle size={20} />
          </button>
        </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                    className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                    placeholder="Enter first name"
                />
              </div>
              
              <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                    className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                    placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                    className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                    placeholder="Enter email address"
                />
              </div>
              
              <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                    className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                    placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
                    Position <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                    className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                    placeholder="Enter position"
                />
              </div>
              
              <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-2">
                    Department <span className="text-red-400">*</span>
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                    className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                >
                  <option value="">Select Department</option>
                    <option value="Operations">Operations</option>
                    <option value="Customer Service">Customer Service</option>
                  <option value="Security">Security</option>
                    <option value="Maintenance">Maintenance</option>
                  <option value="Administration">Administration</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                  <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-300 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                    className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                    placeholder="Enter hourly rate"
                />
              </div>
              
              <div>
                  <label htmlFor="hireDate" className="block text-sm font-medium text-gray-300 mb-2">
                    Hire Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="hireDate"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  required
                    className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                />
              </div>
            </div>
            
              {/* Skills Section */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                Skills
              </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-sm border border-amber-500/30"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-amber-400 hover:text-amber-300"
                      >
                        <XCircle size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-2 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                    placeholder="Add a skill..."
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors border border-amber-500/30"
                  >
                    Add
                  </button>
                </div>
            </div>
            
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                  className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all resize-none"
                  placeholder="Add any additional notes..."
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                  className="h-4 w-4 rounded border-zinc-700/50 bg-zinc-800/50 text-amber-500 focus:ring-amber-500/20"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
                  Active Employee
              </label>
          </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-700/50">
            <button
              type="button"
              onClick={onClose}
                  className="px-6 py-3 rounded-xl border border-zinc-600/50 text-gray-300 hover:bg-zinc-800/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      {initialStaff ? 'Update Staff' : 'Add Staff'}
                    </>
                  )}
            </button>
              </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => void;
  staff: StaffMember[];
  initialShift?: Shift;
  isSubmitting: boolean;
}

const ShiftFormModal: React.FC<ShiftFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  staff,
  initialShift, 
  isSubmitting 
}) => {
  const [formData, setFormData] = useState<Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>>({
    staffId: initialShift?.staffId || '',
    eventId: initialShift?.eventId || null,
    startTime: initialShift?.startTime || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: initialShift?.endTime || format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    position: initialShift?.position || '',
    status: initialShift?.status || 'scheduled',
    notes: initialShift?.notes || null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-zinc-900 shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4 py-4">
          <h2 className="text-xl font-semibold text-white font-playfair">
            {initialShift ? 'Edit Shift' : 'Add New Shift'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-zinc-800 hover:text-white"
          >
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="staffId" className="block text-sm font-medium text-gray-300">
                Staff Member <span className="text-red-500">*</span>
              </label>
              <select
                id="staffId"
                name="staffId"
                value={formData.staffId}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              >
                <option value="">Select Staff Member</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName} ({member.position})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-300">
                Position for this Shift <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              />
            </div>
            
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-300">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              />
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-300">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : (initialShift ? 'Update Shift' : 'Add Shift')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Analytics interfaces
interface StaffAnalytics {
  totalStaff: number;
  activeStaff: number;
  activeShifts: number;
  monthlyPayroll: number;
  averageAttendance: number;
  totalDepartments: number;
  overtimeHours: number;
  productivityScore: number;
}

interface PerformanceMetrics {
  staffId: string;
  name: string;
  department: string;
  performanceScore: number;
  attendanceRate: number;
  overtimeHours: number;
  totalHours: number;
  productivity: number;
  customerRating: number;
  tasksCompleted: number;
}

interface PayrollSummary {
  department: string;
  totalHours: number;
  regularPay: number;
  overtimePay: number;
  bonuses: number;
  totalPay: number;
  staffCount: number;
}

interface DepartmentMetrics {
  name: string;
  staffCount: number;
  avgPerformance: number;
  totalHours: number;
  payroll: number;
  activeShifts: number;
}

// Enhanced Staff Analytics Dashboard
const StaffAnalyticsDashboard: React.FC<{ analytics: StaffAnalytics; departments: DepartmentMetrics[] }> = ({ analytics, departments }) => {
  const performanceData = useMemo(() => [
    { name: 'Mon', productivity: 85, attendance: 92 },
    { name: 'Tue', productivity: 88, attendance: 94 },
    { name: 'Wed', productivity: 82, attendance: 89 },
    { name: 'Thu', productivity: 91, attendance: 96 },
    { name: 'Fri', productivity: 89, attendance: 93 },
    { name: 'Sat', productivity: 87, attendance: 91 },
    { name: 'Sun', productivity: 84, attendance: 88 }
  ], []);

  const departmentColors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#f97316'];

  return (
    <div className="space-y-6 mb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-500/20 backdrop-blur-sm">
                <Users className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{analytics.totalStaff}</p>
                <p className="text-sm text-gray-400">Total Staff</p>
              </div>
            </div>
            <div className="flex items-center text-green-400 text-sm">
              <TrendingUp size={14} className="mr-1" />
              <span>{analytics.activeStaff} Active</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20 backdrop-blur-sm">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{analytics.activeShifts}</p>
                <p className="text-sm text-gray-400">Active Shifts</p>
              </div>
            </div>
            <div className="flex items-center text-blue-400 text-sm">
              <Activity size={14} className="mr-1" />
              <span>{analytics.overtimeHours}h Overtime</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/20 backdrop-blur-sm">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">${(analytics.monthlyPayroll / 1000).toFixed(0)}K</p>
                <p className="text-sm text-gray-400">Monthly Payroll</p>
              </div>
            </div>
            <div className="flex items-center text-green-400 text-sm">
              <TrendingUp size={14} className="mr-1" />
              <span>+5.2% vs last month</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 backdrop-blur-sm">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{analytics.averageAttendance}%</p>
                <p className="text-sm text-gray-400">Attendance</p>
              </div>
            </div>
            <div className="flex items-center text-purple-400 text-sm">
              <Award size={14} className="mr-1" />
              <span>{analytics.productivityScore}% Productivity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-amber-400" />
              Weekly Performance Trends
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="productivity" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-400" />
              Department Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={departments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="staffCount"
                >
                  {departments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={departmentColors[index % departmentColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Staff Card Component
const EnhancedStaffCard: React.FC<{
  member: StaffMember & { metrics: PerformanceMetrics };
  onView: () => void;
  onEdit: () => void;
  onMessage: () => void;
  onCall: () => void;
}> = ({ member, onView, onEdit, onMessage, onCall }) => {
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-400/20';
    if (score >= 75) return 'text-amber-400 bg-amber-400/20';
    return 'text-red-400 bg-red-400/20';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-400 text-green-900' : 'bg-gray-400 text-gray-900';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50 hover:border-amber-500/50 transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-semibold text-lg">
              {member.firstName[0]}{member.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{member.firstName} {member.lastName}</h3>
              <p className="text-sm text-gray-400">{member.position}</p>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.isActive)}`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="ml-2 text-xs text-gray-500">{member.department}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getPerformanceColor(member.metrics.performanceScore)}`}>
              <Star size={12} className="mr-1" />
              {member.metrics.performanceScore}%
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{member.metrics.attendanceRate}%</p>
            <p className="text-xs text-gray-400">Attendance</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{member.metrics.totalHours}h</p>
            <p className="text-xs text-gray-400">This Month</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{member.metrics.tasksCompleted}</p>
            <p className="text-xs text-gray-400">Tasks Done</p>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {member.skills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="px-2 py-1 bg-zinc-700/50 text-xs text-gray-300 rounded-md">
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="px-2 py-1 bg-zinc-700/50 text-xs text-gray-300 rounded-md">
                +{member.skills.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={onMessage}
              className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              title="Send Message"
            >
              <MessageSquare size={14} />
            </button>
            <button
              onClick={onCall}
              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              title="Call"
            >
              <Phone size={14} />
            </button>
            <button
              onClick={onView}
              className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
              title="View Details"
            >
              <Activity size={14} />
            </button>
          </div>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Payroll Component
const PayrollSummaryPanel: React.FC<{ payrollData: PayrollSummary[] }> = ({ payrollData }) => {
  const totalPayroll = payrollData.reduce((sum, dept) => sum + dept.totalPay, 0);
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
      <div className="relative">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <CreditCard className="mr-2 h-5 w-5 text-green-400" />
          Payroll Summary
        </h3>
        
        <div className="mb-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Total Monthly Payroll</span>
            <span className="text-2xl font-bold text-green-400">${totalPayroll.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-3">
          {payrollData.map((dept, index) => (
            <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-zinc-800/30">
              <div>
                <p className="text-white font-medium">{dept.department}</p>
                <p className="text-xs text-gray-400">{dept.staffCount} employees • {dept.totalHours}h total</p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">${dept.totalPay.toLocaleString()}</p>
                <p className="text-xs text-gray-400">
                  Reg: ${dept.regularPay.toLocaleString()} | OT: ${dept.overtimePay.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Calendar View Component
const CalendarView: React.FC<{ shifts: any[]; onShiftClick: (shift: any) => void }> = ({ shifts, onShiftClick }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => 
      format(new Date(shift.startTime), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
      <div className="relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-blue-400" />
            Weekly Schedule
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              className="px-3 py-1.5 rounded-lg bg-zinc-700/50 text-white hover:bg-zinc-700 transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              className="px-3 py-1.5 rounded-lg bg-zinc-700/50 text-white hover:bg-zinc-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            return (
              <div key={index} className="min-h-[120px] p-2 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                <div className="text-center mb-2">
                  <p className="text-xs text-gray-400">{format(day, 'EEE')}</p>
                  <p className="text-sm font-semibold text-white">{format(day, 'd')}</p>
                </div>
                <div className="space-y-1">
                  {dayShifts.map((shift, shiftIndex) => (
                    <div 
                      key={shiftIndex}
                      onClick={() => onShiftClick(shift)}
                      className="p-1.5 rounded bg-amber-500/20 border border-amber-500/30 cursor-pointer hover:bg-amber-500/30 transition-colors"
                    >
                      <p className="text-xs text-amber-300 font-medium truncate">{shift.title}</p>
                      <p className="text-xs text-gray-400">{format(new Date(shift.startTime), 'HH:mm')}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StaffManagement: React.FC = () => {
  useBreadcrumbs([
    { label: 'Staff Management', path: '/staff' }
  ]);

  const navigate = useNavigate();
  const { 
    staff, 
    isLoading, 
    shifts, 
    isLoadingShifts, 
    addStaff, 
    updateStaff,
    addShift, 
    updateShift,
    timeEntries,
    addTimeEntry,
    updateTimeEntry
  } = useStaffManagement();
  
  const [activeTab, setActiveTab] = useState<'staff' | 'schedule' | 'timetracking' | 'performance'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const analytics = useMemo((): StaffAnalytics => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.isActive).length;
    const activeShifts = shifts.filter(s => new Date(s.startTime) <= Date.now() && new Date(s.endTime) >= Date.now()).length;
    const monthlyPayroll = staff.reduce((sum, s) => sum + (s.hourlyRate || 0) * 160, 0);
    const attendanceEntries = timeEntries.length;
    const averageAttendance = attendanceEntries ?
      (timeEntries.filter(e => e.clockOutTime).length / attendanceEntries) * 100 : 0;
    const totalDepartments = new Set(staff.map(s => s.department)).size;
    const overtimeHours = timeEntries.reduce((sum, e) => sum + Math.max((e.totalHours || 0) - 8, 0), 0);
    return {
      totalStaff,
      activeStaff,
      activeShifts,
      monthlyPayroll,
      averageAttendance,
      totalDepartments,
      overtimeHours,
      productivityScore: 0
    };
  }, [staff, shifts, timeEntries]);

  const departmentMetrics = useMemo((): DepartmentMetrics[] => {
    const deptMap: Record<string, DepartmentMetrics> = {};
    staff.forEach(member => {
      if (!deptMap[member.department]) {
        deptMap[member.department] = {
          name: member.department,
          staffCount: 0,
          avgPerformance: 0,
          totalHours: 0,
          payroll: 0,
          activeShifts: 0
        };
      }
      const dept = deptMap[member.department];
      dept.staffCount += 1;
      dept.payroll += (member.hourlyRate || 0) * 160;
    });
    shifts.forEach(shift => {
      const dept = deptMap[staff.find(s => s.id === shift.staffId)?.department || ''];
      if (dept) {
        dept.activeShifts += 1;
      }
    });
    return Object.values(deptMap);
  }, [staff, shifts]);

  const performanceMetrics = useMemo((): PerformanceMetrics[] =>
    staff.map(member => {
      const entries = timeEntries.filter(e => e.staffId === member.id);
      const totalHours = entries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
      const overtimeHours = entries.reduce((sum, e) => sum + Math.max((e.totalHours || 0) - 8, 0), 0);
      const attendanceRate = entries.length ? (entries.filter(e => e.clockOutTime).length / entries.length) * 100 : 100;
      return {
        staffId: member.id,
        name: `${member.firstName} ${member.lastName}`,
        department: member.department,
        performanceScore: 0,
        attendanceRate,
        overtimeHours,
        totalHours,
        productivity: 0,
        customerRating: 0,
        tasksCompleted: 0
      };
    }), [staff, timeEntries]);

  const payrollData = useMemo((): PayrollSummary[] =>
    departmentMetrics.map(dept => ({
      department: dept.name,
      totalHours: dept.totalHours,
      regularPay: dept.payroll,
      overtimePay: 0,
      bonuses: 0,
      totalPay: dept.payroll,
      staffCount: dept.staffCount
    })), [departmentMetrics]);

  // Enhanced staff with performance metrics
  const enhancedStaff = useMemo(() =>
    staff.map(member => {
      const metrics = performanceMetrics.find(m => m.staffId === member.id) || {
        staffId: member.id,
        name: `${member.firstName} ${member.lastName}`,
        department: member.department,
        performanceScore: 85,
        attendanceRate: 90,
        overtimeHours: 10,
        totalHours: 160,
        productivity: 85,
        customerRating: 4.2,
        tasksCompleted: 25
      };
      return { ...member, metrics };
    }), [staff, performanceMetrics]);

  const allShifts = shifts;
  
  // Filter and search functionality
  const departments = useMemo(() => 
    [...new Set(staff.map(member => member.department))], [staff]);

  const filteredStaff = useMemo(() => 
    enhancedStaff.filter(member => {
      const matchesSearch = !searchTerm || 
        `${member.firstName} ${member.lastName} ${member.email} ${member.position}`
          .toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !departmentFilter || member.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    }), [enhancedStaff, searchTerm, departmentFilter]);

  const upcomingShifts = useMemo(() => 
    allShifts
      .filter(shift => new Date(shift.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 10), [allShifts]);

  // Handlers
  const handleAddStaff = async (staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    try {
      await addStaff(staffData);
      setIsStaffModalOpen(false);
      toast.success('Staff member added successfully');
    } catch (error) {
      toast.error('Failed to add staff member');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setIsStaffModalOpen(true);
  };
  
  const handleUpdateStaff = async (staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingStaff) return;
    
    setIsSubmitting(true);
    try {
      await updateStaff(editingStaff.id, staffData);
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      toast.success('Staff member updated successfully');
    } catch (error) {
      toast.error('Failed to update staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessage = (member: StaffMember) => {
    toast.success(`Message sent to ${member.firstName} ${member.lastName}`);
  };

  const handleCall = (member: StaffMember) => {
    if (member.phone) {
      window.open(`tel:${member.phone}`);
    } else {
      toast.error('No phone number available');
    }
  };

  const handleShiftClick = (shift: any) => {
    toast.info(`Shift: ${shift.title} at ${shift.location}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <Breadcrumbs />
            <h1 className="mt-2 text-3xl font-bold text-white font-playfair bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
              Staff Management
            </h1>
            <p className="mt-1 text-gray-400">
              Comprehensive staff management with analytics, scheduling, and performance tracking
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:from-amber-600 hover:to-amber-700 focus:outline-none"
            >
              <UserPlus size={16} className="mr-2" />
              Add Staff
            </button>
            
            <button 
              onClick={() => setIsShiftModalOpen(true)}
              className="inline-flex items-center rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-4 py-2.5 text-sm text-white hover:bg-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all duration-200 backdrop-blur-sm"
            >
              <Calendar size={16} className="mr-2" />
              Schedule Shift
            </button>
        </div>
      </div>

        {/* Analytics Dashboard */}
        <StaffAnalyticsDashboard analytics={analytics} departments={departmentMetrics} />
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="mb-8 bg-zinc-900/50 border border-zinc-700/50 backdrop-blur-sm">
            <TabsTrigger value="staff" className="flex items-center data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Users size={14} className="mr-2" />
            Staff Directory
          </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Calendar size={14} className="mr-2" />
            Schedule
          </TabsTrigger>
            <TabsTrigger value="timetracking" className="flex items-center data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Clock size={14} className="mr-2" />
            Time Tracking
          </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <BarChart3 size={14} className="mr-2" />
              Performance
          </TabsTrigger>
        </TabsList>
        
        {/* Staff Directory Tab */}
        <TabsContent value="staff">
            <div className="space-y-6">
            {/* Search and Filters */}
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                  <div className="relative flex-1 lg:w-80">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                      className="block w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                value={departmentFilter || ""}
                onChange={(e) => setDepartmentFilter(e.target.value || null)}
                    className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 py-3 pl-4 pr-10 text-white focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-sm transition-all"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
                <div className="flex items-center space-x-3">
                  <div className="flex rounded-xl bg-zinc-900/50 border border-zinc-700/50 p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Users size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'table' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <BarChart3 size={16} />
                    </button>
                  </div>
                  
                  <button className="inline-flex items-center rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-4 py-2.5 text-sm text-white hover:bg-zinc-700/50 transition-colors backdrop-blur-sm">
                    <Download size={14} className="mr-2" />
                    Export
                  </button>
                </div>
              </div>
              
              {/* Staff Grid/Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                <p className="text-white">Loading staff...</p>
                  </div>
              </div>
            ) : filteredStaff.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map((member) => (
                      <EnhancedStaffCard
                        key={member.id}
                        member={member}
                        onView={() => navigate(`/staff/${member.id}`)}
                        onEdit={() => handleEditStaff(member)}
                        onMessage={() => handleMessage(member)}
                        onCall={() => handleCall(member)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-12 text-center backdrop-blur-sm border border-zinc-700/50">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-700/50">
                        <thead className="bg-zinc-900/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Name
                      </th>
                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Position
                      </th>
                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                              Performance
                      </th>
                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                              Attendance
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Status
                      </th>
                            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                        <tbody className="divide-y divide-zinc-700/50 bg-zinc-900/30">
                    {filteredStaff.map((member) => (
                            <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                              <div className="text-sm font-medium text-white">
                                {member.firstName} {member.lastName}
                            </div>
                          </div>
                        </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">{member.position}</div>
                                <div className="text-sm text-gray-400">{member.department}</div>
                        </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Star size={14} className="text-amber-400 mr-1" />
                                  <span className="text-sm text-white">{member.metrics.performanceScore}%</span>
                                </div>
                        </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-white">{member.metrics.attendanceRate}%</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            member.isActive 
                                    ? 'bg-green-400/20 text-green-400'
                                    : 'bg-gray-400/20 text-gray-400'
                          }`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                          <button 
                                    onClick={() => handleMessage(member)}
                                    className="text-blue-400 hover:text-blue-300 p-1 rounded"
                                    title="Message"
                                  >
                                    <MessageSquare size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleCall(member)}
                                    className="text-green-400 hover:text-green-300 p-1 rounded"
                                    title="Call"
                                  >
                                    <Phone size={14} />
                          </button>
                          <button 
                            onClick={() => handleEditStaff(member)}
                                    className="text-amber-400 hover:text-amber-300 p-1 rounded"
                                    title="Edit"
                          >
                                    <Edit size={14} />
                          </button>
                                </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                  </div>
                )
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-12 text-center backdrop-blur-sm border border-zinc-700/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
                  <div className="relative">
                    <UserPlus size={48} className="mx-auto text-amber-500/50 mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">No staff members found</h2>
                    <p className="text-gray-400 mb-6">
                  {searchTerm || departmentFilter ? 'No staff members match your search criteria.' : 'Add your first staff member to get started.'}
                </p>
                <button
                  onClick={() => setIsStaffModalOpen(true)}
                      className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-medium text-white hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg"
                >
                      <UserPlus size={16} className="mr-2" />
                  Add Staff Member
                </button>
                  </div>
              </div>
            )}
          </div>
        </TabsContent>
        
          {/* Schedule Tab */}
        <TabsContent value="schedule">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CalendarView shifts={allShifts} onShiftClick={handleShiftClick} />
                </div>
                <div className="space-y-6">
                  <PayrollSummaryPanel payrollData={payrollData} />
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Time Tracking Tab */}
        <TabsContent value="timetracking">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 text-center backdrop-blur-sm border border-zinc-700/50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
              <div className="relative">
                <Timer size={48} className="mx-auto text-blue-500/50 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Time Tracking System</h2>
                <p className="text-gray-400">Advanced time tracking with payroll integration coming soon...</p>
                </div>
                          </div>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Award className="mr-2 h-5 w-5 text-purple-400" />
                      Top Performers
                    </h3>
                    <div className="space-y-3">
                      {performanceMetrics.slice(0, 5).map((performer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-sm font-semibold">
                              {index + 1}
              </div>
                            <div>
                              <p className="text-white font-medium">{performer.name}</p>
                              <p className="text-xs text-gray-400">{performer.department}</p>
                </div>
                                </div>
                          <div className="text-right">
                            <p className="text-amber-400 font-semibold">{performer.performanceScore}%</p>
                            <p className="text-xs text-gray-400">{performer.tasksCompleted} tasks</p>
                              </div>
                </div>
                      ))}
                </div>
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 backdrop-blur-sm border border-zinc-700/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
                      Department Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={departmentMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9CA3AF" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        <Bar dataKey="avgPerformance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
      
      {/* Modals */}
        <StaffFormModal
          isOpen={isStaffModalOpen}
          onClose={() => {
            setIsStaffModalOpen(false);
          setEditingStaff(null);
        }}
        onSave={editingStaff ? handleUpdateStaff : handleAddStaff}
        initialStaff={editingStaff || undefined}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default StaffManagement;