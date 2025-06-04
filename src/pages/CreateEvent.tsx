import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Calendar, Clock, Users, DollarSign, MapPin, Image, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAI } from '../contexts/AIContext';
import { useEvents } from '../hooks/useEvents';
import Breadcrumbs, { useBreadcrumbs } from '../components/navigation/Breadcrumbs';

interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  ticketPrice: number;
  totalCapacity: number;
  artistIds: string[];
  genre: string;
  image: string;
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { generateContent, isProcessing } = useAI();
  const breadcrumbs = useBreadcrumbs();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    ticketPrice: 0,
    totalCapacity: 0,
    artistIds: [],
    genre: '',
    image: ''
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{
    title?: string;
    description?: string;
    marketingCopy?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createEvent } = useEvents();

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        toast.error('Please log in to create events');
        navigate('/login');
      }
    };
    checkAuth();
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ticketPrice' || name === 'totalCapacity' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAIPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAiPrompt(e.target.value);
  };

  const generateAIContent = async (type: 'title' | 'description' | 'marketingCopy') => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    try {
      let prompt = '';
      switch (type) {
        case 'title':
          prompt = `Generate a catchy, professional event title for: ${aiPrompt}`;
          break;
        case 'description':
          prompt = `Write a compelling event description for: ${aiPrompt}`;
          break;
        case 'marketingCopy':
          prompt = `Create marketing copy for promoting this event: ${aiPrompt}`;
          break;
      }

      const result = await generateContent(prompt);
      setAiSuggestions(prev => ({
        ...prev,
        [type]: result
      }));
      toast.success(`AI ${type} generated successfully!`);
    } catch (error) {
      toast.error(`Failed to generate AI ${type}`);
    }
  };

  const applySuggestion = (type: 'title' | 'description') => {
    if (aiSuggestions[type]) {
      setFormData(prev => ({
        ...prev,
        [type]: aiSuggestions[type] || ''
      }));
      toast.success(`AI ${type} applied!`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.startTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, event, error } = await createEvent(formData);
      if (success && event) {
        toast.success('Event created successfully!');
        navigate(`/events/${event.id}`);
      } else {
        toast.error(error?.message || 'Failed to create event');
      }
    } catch (error) {
      toast.error('Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Event</h1>
            <p className="text-gray-400">Plan and schedule your next venue event</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                Event Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your event..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genre
                  </label>
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select genre</option>
                    <option value="Rock">Rock</option>
                    <option value="Pop">Pop</option>
                    <option value="Jazz">Jazz</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Folk">Folk</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="Classical">Classical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ticket Price ($)
                  </label>
                  <input
                    type="number"
                    name="ticketPrice"
                    value={formData.ticketPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="totalCapacity"
                    value={formData.totalCapacity}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Maximum attendees"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* AI Assistant Panel */}
        <div className="space-y-6">
          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-amber-400" />
              AI Assistant
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your event idea
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={handleAIPromptChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., Rock concert with local bands, outdoor summer festival..."
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => generateAIContent('title')}
                  disabled={isProcessing || !aiPrompt.trim()}
                  className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Generate Title
                </button>
                
                <button
                  type="button"
                  onClick={() => generateAIContent('description')}
                  disabled={isProcessing || !aiPrompt.trim()}
                  className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Generate Description
                </button>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.title && (
                <div className="p-3 bg-zinc-700/30 rounded-lg border border-amber-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-amber-400 font-medium">AI Title Suggestion</span>
                    <button
                      onClick={() => applySuggestion('title')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-sm text-gray-300">{aiSuggestions.title}</p>
                </div>
              )}

              {aiSuggestions.description && (
                <div className="p-3 bg-zinc-700/30 rounded-lg border border-amber-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-amber-400 font-medium">AI Description Suggestion</span>
                    <button
                      onClick={() => applySuggestion('description')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-sm text-gray-300">{aiSuggestions.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Event Preview</h3>
            <div className="space-y-3">
              <div className="p-3 bg-zinc-700/30 rounded-lg">
                <p className="text-white font-medium">{formData.title || 'Untitled Event'}</p>
                <p className="text-gray-400 text-sm">{formData.date || 'No date set'}</p>
                <p className="text-gray-400 text-sm">{formData.genre || 'No genre selected'}</p>
              </div>
              
              {formData.description && (
                <div className="p-3 bg-zinc-700/30 rounded-lg">
                  <p className="text-gray-300 text-sm">{formData.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;