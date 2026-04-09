import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { useClinic } from '../context/ClinicContext';
import { Search, UserPlus, ChevronLeft, Users, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { haptic } from '../lib/haptics';
import { smartMatch } from '../lib/search';
import { Modal } from '../components/ui/Modal';
import { PatientForm } from '../components/forms/PatientForm';
import { getPatientLastVisit } from '../lib/patientUtils';
import { debounce } from '../lib/security';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const avatarColors = [
  'bg-gradient-to-br from-teal-400 to-teal-600 text-white',
  'bg-gradient-to-br from-blue-400 to-blue-600 text-white',
  'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
  'bg-gradient-to-br from-purple-400 to-purple-600 text-white',
  'bg-gradient-to-br from-rose-400 to-rose-600 text-white',
  'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white',
];

function getAvatarColor(id: string) {
  const index = id.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}

type SortOption = 'name' | 'recent' | 'oldest';
type FilterOption = 'all' | 'debtors' | 'completed' | 'orthodontics' | 'implants';

export function Patients() {
  const navigate = useNavigate();
  const { patients, appointments, addPatient, arrivalRecords, displayPreferences, isLoading } = useClinic();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Derive state from URL params to preserve it across navigation
  const sortBy = (searchParams.get('sort') as SortOption) || 'recent';
  const filterBy = (searchParams.get('filter') as FilterOption) || 'all';

  const [showFilters, setShowFilters] = useState(filterBy !== 'all');

  const setSortBy = (sort: SortOption) => {
    setSearchParams(prev => {
      prev.set('sort', sort);
      return prev;
    });
  };

  const setFilterBy = (filter: FilterOption) => {
    setSearchParams(prev => {
      // Toggle off if already selected
      if (filterBy === filter) {
        prev.set('filter', 'all');
      } else {
        prev.set('filter', filter);
      }
      return prev;
    });
  };

  // Sync search input to URL parameters (debounced)
  useEffect(() => {
    setSearchParams(prev => {
        if (searchQuery) {
            prev.set('q', searchQuery);
        } else {
            prev.delete('q');
        }
        return prev;
    }, { replace: true });
  }, [searchQuery, setSearchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on Ctrl+K, Cmd+K, or /
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const debouncedSetSearch = useMemo(
    () => debounce((val: string) => setSearchQuery(val), 300),
    []
  );

  const filteredPatients = useMemo(() => {
    // 1. Map to include the dynamically computed lastVisit
    let result = patients.map(patient => ({
      ...patient,
      computedLastVisit: getPatientLastVisit(patient, appointments, arrivalRecords)
    })).filter((patient) => {
      const searchableText = `${patient.name} ${patient.phone} ${patient.email || ''} ${patient.allergies || ''}`;
      return smartMatch(searchQuery, searchableText);
    });

    // 2. Filter
    if (filterBy === 'debtors') {
      result = result.filter(p => 
        p.treatmentPlans?.some(plan => (plan.totalCost || 0) > (plan.paidAmount || 0))
      );
    } else if (filterBy === 'completed') {
      result = result.filter(p => {
        const plans = p.treatmentPlans || [];
        if (plans.length === 0) return false;
        
        const hasInProgress = plans.some(plan => plan.status === 'in_progress');
        // A patient is clinically "finished" if they have at least one successfully closed plan
        const hasCompleted = plans.some(plan => plan.status === 'completed');
        const totalDebt = plans.reduce((sum, plan) => sum + Math.max(0, (plan.totalCost || 0) - (plan.paidAmount || 0)), 0);
        
        // Return patients who have finished their treatment cycle and have no debt
        return (hasCompleted || !hasInProgress) && totalDebt <= 0;
      });
    } else if (filterBy === 'orthodontics') {
      result = result.filter(p => 
          p.treatmentPlans?.some(plan => 
            plan.orthoDetails !== undefined || 
            plan.name?.includes('تقويم') || 
            plan.treatments.some(t => t.treatmentType.includes('تقويم'))
          )
      );
    } else if (filterBy === 'implants') {
         result = result.filter(p => 
          p.treatmentPlans?.some(plan => 
            plan.name?.includes('زراعة') || 
            plan.treatments.some(t => t.treatmentType.includes('زراعة'))
          )
      );
    }

    // 3. Sort
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) => {
        const timeA = a.computedLastVisit ? new Date(a.computedLastVisit).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.computedLastVisit ? new Date(b.computedLastVisit).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
    } else if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => {
        const timeA = a.computedLastVisit ? new Date(a.computedLastVisit).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.computedLastVisit ? new Date(b.computedLastVisit).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeA - timeB;
      });
    }

    return result;
  }, [patients, appointments, arrivalRecords, searchQuery, sortBy, filterBy]);


  return (
    <Layout
      title="المرضى"
      subtitle={`${patients.length} مريض مسجل`}
      floatingAction={
        <>
          <button
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-24 left-5 w-14 h-14 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-teal-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
            title="إضافة مريض جديد"
          >
            <UserPlus className="w-6 h-6" strokeWidth={2.5} />
          </button>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="إضافة مريض جديد"
          >
            <PatientForm
              onSubmit={(data) => {
                const result = addPatient(data);
                if (!result.success) {
                  alert(result.error);
                  return;
                }
                setIsModalOpen(false);
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </Modal>
        </>
      }
    >
      <div className="space-y-4">
        {/* Premium Search */}
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="بحث سريع بالاسم أو رقم الهاتف..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              debouncedSetSearch(e.target.value);
            }}
            aria-label="بحث في قائمة المرضى"
            className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-teal-500 focus:shadow-[0_0_0_4px_rgba(15,118,110,0.1)]"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg" dir="ltr">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Filter & Sort Bar - Premium */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
              showFilters ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            فلترة
          </button>
          
          <div className="flex-1 flex gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSortBy('recent')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                sortBy === 'recent' ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
              الأحدث
            </button>
            <button
              onClick={() => setSortBy('oldest')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                sortBy === 'oldest' ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
              الأقدم
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                sortBy === 'name' ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
              الأبجدي
            </button>
          </div>
        </div>

        {/* Filter Options - Premium */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-slide-up">
            <button
              onClick={() => setFilterBy('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                filterBy === 'all' ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterBy('debtors')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                filterBy === 'debtors' ? "bg-rose-500 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              المديونين
            </button>
            <button
              onClick={() => setFilterBy('completed')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                filterBy === 'completed' ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              المكتملين
            </button>
            <button
              onClick={() => setFilterBy('orthodontics')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                filterBy === 'orthodontics' ? "bg-blue-500 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              مرضى تقويم
            </button>
            <button
              onClick={() => setFilterBy('implants')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                filterBy === 'implants' ? "bg-indigo-500 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              مرضى زراعة
            </button>
          </div>
        )}

        {/* Patients List - Premium */}
        {isLoading ? (
          <div className="glass-card py-16 flex flex-col items-center justify-center text-center px-4">
             <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mb-4" />
             <h3 className="text-lg font-bold text-slate-800">جاري تحميل بيانات المرضى...</h3>
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="glass-card overflow-hidden divide-y divide-slate-100">
            {filteredPatients.map((patient, idx) => (
              <div key={patient.id}>
                <div
                  className="flex items-center p-4 gap-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <div className={cn(
                    "w-12 h-12 flex items-center justify-center font-bold text-lg shrink-0 shadow-md",
                    displayPreferences.avatarStyle === 'circle' ? 'rounded-full' : 'rounded-2xl',
                    getAvatarColor(patient.id)
                  )}>
                    {patient.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800">{patient.name}</h3>
                    {displayPreferences.showPhoneInList && (
                      <p className="text-xs text-slate-500 mt-1 ltr" dir="ltr">{patient.phone}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end shrink-0 max-w-[120px] sm:max-w-none">
                    {displayPreferences.showLastVisitInList && patient.computedLastVisit && (
                      <span className="text-[10px] text-slate-400 truncate w-full text-left">
                        آخر زيارة:{' '}
                        <span className="font-bold text-slate-500">
                          {displayPreferences.dateFormat === 'relative'
                            ? formatDistanceToNow(parseISO(patient.computedLastVisit), { addSuffix: true, locale: ar })
                            : patient.computedLastVisit.split('T')[0]
                          }
                        </span>
                      </span>
                    )}
                  </div>

                  <ChevronLeft className="w-5 h-5 text-slate-300 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card py-16 flex flex-col items-center justify-center text-center px-4 animate-scale-in">
            <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-teal-100">
              <Users className="w-10 h-10 text-teal-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {searchQuery ? 'لا توجد نتائج' : 'سجل المرضى فارغ'}
            </h3>
            <p className="text-sm text-slate-500 max-w-[280px] mb-6 leading-relaxed">
              {searchQuery
                ? 'لم نتمكن من العثور على أي مرضى يطابقون بحثك الحالي.'
                : 'لم يتم إضافة أي مرضى حتى الآن. ابدأ بإضافة مريضك الأول لبناء قاعدة بيانات العيادة.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  haptic.light();
                  setIsModalOpen(true);
                }}
                className="apple-btn apple-btn-primary px-6 shadow-lg shadow-teal-200 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <UserPlus className="w-5 h-5 ml-1.5" />
                إضافة مريض جديد
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
