import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { adminService, subjectService } from '../services/api';
import { Plus, Trash2, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const EditSubject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    semester: 1,
    units: []
  });

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const res = await subjectService.getSubjectById(id);
        if (res.data.success) {
          const sub = res.data.subject;
          setFormData({
            name: sub.name || '',
            branch: sub.branch || '',
            semester: Number(sub.semester) || 1,
            units: sub.units ? sub.units.map(u => ({
              unitNumber: Number(u.unitNumber) || 1,
              unitTitle: u.unitTitle || '',
              topics: u.topics ? u.topics.map(t => t.title).join(', ') : '',
              notes: u.notes?.length ? u.notes : [{ title: '', link: '' }],
              books: u.books?.length ? u.books : [{ title: '', link: '' }],
              pyqs: u.pyqs?.length ? u.pyqs : [{ title: '', link: '' }],
              youtubeLinks: u.youtubeLinks?.length ? u.youtubeLinks : [{ title: '', link: '' }]
            })) : []
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load subject for editing.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSubject();
  }, [id]);

  const handleBaseChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'semester' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const handleUnitChange = (index, field, value) => {
    const updatedUnits = [...formData.units];
    updatedUnits[index][field] = field === 'unitNumber' ? Number(value) : value;
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
      .map((u, i) => ({ ...u, unitNumber: i + 1 }));
    setFormData(prev => ({ ...prev, units: updatedUnits }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formattedPayload = {
        ...formData,
        semester: Number(formData.semester),
        units: formData.units.map(u => ({
          ...u,
          unitNumber: Number(u.unitNumber),
          topics: typeof u.topics === 'string' 
            ? u.topics.split(',').map(t => ({ title: t.trim() })).filter(t => t.title)
            : u.topics
        }))
      };

      const res = await adminService.updateSubject(id, formattedPayload);
      if (res.data.success) {
        setSuccess('Subject updated successfully!');
        setTimeout(() => navigate('/admin'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subject.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] pt-40 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Module Editor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] pt-32 pb-20 px-6 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-12 border-b border-gray-200 pb-10">
          <Link to="/admin" className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Console
          </Link>
          <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a] italic">
            Edit <span className="text-blue-600 not-italic">Subject</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Modifying resources for: <span className="text-black font-bold underline underline-offset-4">{formData.name}</span></p>
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

        <form onSubmit={handleSubmit} className="space-y-12">
          
          <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-8">Base Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Subject Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleBaseChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Branch</label>
                <input 
                  type="text" 
                  name="branch" 
                  value={formData.branch} 
                  onChange={handleBaseChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-blue-500 uppercase" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Semester</label>
                <input 
                  type="number" 
                  name="semester" 
                  value={formData.semester} 
                  onChange={handleBaseChange}
                  required
                  min="1" max="8"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Resource Architecture</h2>
            <div className="h-[1px] flex-grow bg-gray-200"></div>
          </div>

          <div className="space-y-10">
            {formData.units.map((unit, uIdx) => (
              <div key={uIdx} className="bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-10">
                <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                  <h3 className="text-2xl font-black italic tracking-tighter">Unit 0{unit.unitNumber}</h3>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button" 
                      onClick={() => removeUnit(uIdx)}
                      className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors py-2 px-4 border border-gray-100 rounded-xl hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Unit
                    </button>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Active Module
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Module Title</label>
                    <input 
                      value={unit.unitTitle} 
                      onChange={(e) => handleUnitChange(uIdx, 'unitTitle', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-500" 
                      placeholder="Unit Title" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Topic Index</label>
                    <input 
                      value={unit.topics} 
                      onChange={(e) => handleUnitChange(uIdx, 'topics', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-500" 
                      placeholder="Topic 1, Topic 2..." 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Notes */}
                  <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100/50 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Study Notes</p>
                    <input 
                      value={unit.notes[0]?.title || ''}
                      onChange={(e) => handleResourceChange(uIdx, 'notes', 0, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold bg-white" 
                      placeholder="Title" 
                    />
                    <input 
                      value={unit.notes[0]?.link || ''}
                      onChange={(e) => handleResourceChange(uIdx, 'notes', 0, 'link', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white text-blue-600" 
                      placeholder="URL" 
                    />
                  </div>

                  {/* Books */}
                  <div className="p-6 bg-purple-50/30 rounded-3xl border border-purple-100/50 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-600">Reference Books</p>
                    <input 
                      value={unit.books[0]?.title || ''}
                      onChange={(e) => handleResourceChange(uIdx, 'books', 0, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold bg-white" 
                      placeholder="Title" 
                    />
                    <input 
                      value={unit.books[0]?.link || ''}
                      onChange={(e) => handleResourceChange(uIdx, 'books', 0, 'link', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white text-purple-600" 
                      placeholder="URL" 
                    />
                  </div>

                  {/* PYQs */}
                  <div className="p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100/50 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">University PYQs</p>
                    <input 
                      value={unit.pyqs[0]?.title || ''}
                      onChange={(e) => handleResourceChange(uIdx, 'pyqs', 0, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold bg-white" 
                      placeholder="Title" 
                    />
                    <input 
                      value={unit.pyqs[0]?.link || ''}
                      onChange={(e) => handleResourceChange(uIdx, 'pyqs', 0, 'link', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white text-emerald-600" 
                      placeholder="URL" 
                    />
                  </div>

                  {/* YouTube */}
                  <div className="p-6 bg-gray-900 rounded-3xl space-y-3 text-white">
                    <p className="text-[10px] font-black uppercase tracking-wider text-red-400">Video Tutorials</p>
                    <input 
                      value={unit.youtubeLinks[0]?.title || ''}
                      onChange={(e) => handleResourceChange(uIdx, 'youtubeLinks', 0, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 text-xs font-bold bg-white/5 text-white" 
                      placeholder="Title" 
                    />
                    <input 
                      value={unit.youtubeLinks[0]?.link || ''}
                      onChange={(e) => handleResourceChange(uIdx, 'youtubeLinks', 0, 'link', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 text-xs bg-white/5 text-blue-400" 
                      placeholder="URL" 
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10">
            <button 
              type="button" 
              onClick={addUnit}
              className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 text-gray-600 px-8 py-4 rounded-2xl font-bold hover:border-blue-500 hover:text-blue-500 transition-all w-full md:w-auto"
            >
              <Plus className="w-4 h-4" /> Append New Unit
            </button>

            <button 
              type="submit" 
              disabled={submitting}
              className="bg-[#0a0a0a] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-blue-600 transition-all shadow-2xl shadow-gray-300 active:scale-95 w-full md:w-auto"
            >
              {submitting ? 'Updating Vault...' : 'Commit Changes to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};