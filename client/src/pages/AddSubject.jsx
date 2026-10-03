import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { Plus, Trash2, ArrowLeft, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

export const AddSubject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    semester: 1,
    units: [
      {
        unitNumber: 1,
        unitTitle: '',
        topics: '',
        notes: [{ title: '', link: '' }],
        books: [{ title: '', link: '' }],
        pyqs: [{ title: '', link: '' }],
        youtubeLinks: [{ title: '', link: '' }]
      }
    ]
  });

  const handleBaseChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUnitChange = (index, field, value) => {
    const updatedUnits = [...formData.units];
    updatedUnits[index][field] = value;
    setFormData(prev => ({ ...prev, units: updatedUnits }));
  };

  const handleResourceChange = (unitIndex, resourceType, resIndex, field, value) => {
    const updatedUnits = [...formData.units];
    updatedUnits[unitIndex][resourceType][resIndex][field] = value;
    setFormData(prev => ({ ...prev, units: updatedUnits }));
  };

  const addUnit = () => {
    setFormData(prev => ({
      ...prev,
      units: [
        ...prev.units,
        {
          unitNumber: prev.units.length + 1,
          unitTitle: '',
          topics: '',
          notes: [{ title: '', link: '' }],
          books: [{ title: '', link: '' }],
          pyqs: [{ title: '', link: '' }],
          youtubeLinks: [{ title: '', link: '' }]
        }
      ]
    }));
  };

  const removeUnit = (index) => {
    const updatedUnits = formData.units.filter((_, i) => i !== index)
      .map((u, i) => ({ ...u, unitNumber: i + 1 })); // Renumber units
    setFormData(prev => ({ ...prev, units: updatedUnits }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Clean and format topics string into an array of objects if needed by backend schema
      const formattedPayload = {
        ...formData,
        units: formData.units.map(u => ({
          ...u,
          topics: typeof u.topics === 'string' 
            ? u.topics.split(',').map(t => ({ title: t.trim() })).filter(t => t.title)
            : u.topics
        }))
      };

      const res = await adminService.createSubject(formattedPayload);
      if (res.data.success) {
        setSuccess('Subject created successfully!');
        setTimeout(() => navigate('/admin'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] pt-32 pb-20 px-6 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-12 border-b border-gray-200 pb-10 flex items-end justify-between">
          <div>
            <Link to="/admin" className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Console
            </Link>
            <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a] italic">
              Create <span className="text-gray-400 font-light not-italic">New Subject</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Define core curriculum parameters and upload academic resources.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-5 py-4 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Base Parameters */}
          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 md:p-10 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-6">Subject Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Subject Name</label>
                <input 
                  name="name" 
                  value={formData.name}
                  onChange={handleBaseChange}
                  required 
                  placeholder="e.g. Discrete Structures" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Branch</label>
                <input 
                  name="branch" 
                  value={formData.branch}
                  onChange={handleBaseChange}
                  required 
                  placeholder="e.g. CSE" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-blue-500 uppercase" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Semester</label>
                <input 
                  type="number" 
                  name="semester" 
                  value={formData.semester}
                  onChange={handleBaseChange}
                  required 
                  min="1" max="8" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Curriculum Units</h2>
            <div className="h-[1px] flex-grow bg-gray-200"></div>
          </div>

          {/* Dynamic Units List */}
          <div className="space-y-8">
            {formData.units.map((unit, uIdx) => (
              <div key={uIdx} className="bg-white border border-gray-200 border-l-4 border-l-black rounded-[2rem] p-8 md:p-10 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black italic">Unit 0{unit.unitNumber}</h3>
                  {formData.units.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeUnit(uIdx)}
                      className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors py-2 px-4 border border-gray-100 rounded-xl hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Unit
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-2">Unit Title</label>
                    <input 
                      value={unit.unitTitle}
                      onChange={(e) => handleUnitChange(uIdx, 'unitTitle', e.target.value)}
                      placeholder="e.g. Graph Theory" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-2">Topics (Comma separated)</label>
                    <input 
                      value={unit.topics}
                      onChange={(e) => handleUnitChange(uIdx, 'topics', e.target.value)}
                      placeholder="BFS, DFS, Dijkstra..." 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>

                {/* Resource Links Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Notes */}
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                    <p className="text-[10px] font-extrabold uppercase text-blue-500 tracking-wider">Notes</p>
                    <input 
                      value={unit.notes[0].title}
                      onChange={(e) => handleResourceChange(uIdx, 'notes', 0, 'title', e.target.value)}
                      placeholder="Title" 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" 
                    />
                    <input 
                      value={unit.notes[0].link}
                      onChange={(e) => handleResourceChange(uIdx, 'notes', 0, 'link', e.target.value)}
                      placeholder="URL" 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" 
                    />
                  </div>

                  {/* Books */}
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                    <p className="text-[10px] font-extrabold uppercase text-purple-500 tracking-wider">Books</p>
                    <input 
                      value={unit.books[0].title}
                      onChange={(e) => handleResourceChange(uIdx, 'books', 0, 'title', e.target.value)}
                      placeholder="Title" 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" 
                    />
                    <input 
                      value={unit.books[0].link}
                      onChange={(e) => handleResourceChange(uIdx, 'books', 0, 'link', e.target.value)}
                      placeholder="URL" 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" 
                    />
                  </div>

                  {/* PYQs */}
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                    <p className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider">PYQs</p>
                    <input 
                      value={unit.pyqs[0].title}
                      onChange={(e) => handleResourceChange(uIdx, 'pyqs', 0, 'title', e.target.value)}
                      placeholder="Title" 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" 
                    />
                    <input 
                      value={unit.pyqs[0].link}
                      onChange={(e) => handleResourceChange(uIdx, 'pyqs', 0, 'link', e.target.value)}
                      placeholder="URL" 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" 
                    />
                  </div>

                  {/* YouTube */}
                  <div className="bg-gray-900 p-4 rounded-xl space-y-2 text-white">
                    <p className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider">YouTube</p>
                    <input 
                      value={unit.youtubeLinks[0].title}
                      onChange={(e) => handleResourceChange(uIdx, 'youtubeLinks', 0, 'title', e.target.value)}
                      placeholder="Title" 
                      className="w-full px-3 py-2 rounded-lg border border-white/10 text-xs bg-white/5 text-white" 
                    />
                    <input 
                      value={unit.youtubeLinks[0].link}
                      onChange={(e) => handleResourceChange(uIdx, 'youtubeLinks', 0, 'link', e.target.value)}
                      placeholder="URL" 
                      className="w-full px-3 py-2 rounded-lg border border-white/10 text-xs bg-white/5 text-blue-400" 
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
            <button 
              type="button" 
              onClick={addUnit}
              className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 text-gray-600 px-8 py-4 rounded-2xl font-bold hover:border-blue-500 hover:text-blue-500 transition-all w-full md:w-auto"
            >
              <Plus className="w-4 h-4" /> Append New Unit
            </button>

            <button 
              type="submit" 
              disabled={loading}
              className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl active:scale-95 w-full md:w-auto"
            >
              {loading ? 'Creating Subject...' : 'Finalize & Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};